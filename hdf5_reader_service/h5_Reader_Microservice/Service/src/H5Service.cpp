#include "H5Service.h" 

#include <grpcpp/grpcpp.h>
#include "./../proto/H5ReaderService.grpc.pb.h"
#include "./../proto/H5ReaderService.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector>
#include <string>
#include <cstdlib>
#include <cmath>
#include <fmt/core.h> 
#include <chrono>

using namespace std::chrono;

    H5Service::H5Service(int port) : port(port) {}

    grpc::Status H5Service::CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response)
    {
        std::cout << "Checking Status" << std::endl;
        response->set_status(true);
        
        for (const auto& pair : hdf5_files) {
            std::cout << pair.first << " : " << pair.second._file.getFileName() << std::endl;
        }
                
        response->set_statusmessage("OK");
        return grpc::Status::OK;
    }

    
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::OpenFileRequest *request, ::StatusResponse *response)
    {


        try
        {
            // std::cout << ">>Opening file " << std::endl;
            ServicePrint("Opening File");
            if (request->uuid().empty() || request->file().empty()){
                // std::cout << "<<Failed Request" << std::endl;
                ServicePrint("Failed Open");
                std::cout << request->uuid() << " : " << request->file()<<std::endl;
                return {grpc::StatusCode::INVALID_ARGUMENT, "UUID and filename must be present"};
            }

            if (hdf5_files.find(request->uuid()) != hdf5_files.end()) {
                return {grpc::StatusCode::INVALID_ARGUMENT, fmt::format("UUID already in use {}", request->uuid())};
            }

            //Opening HDF5 file and group
            H5::H5File file = H5::H5File(request->directory() + request->file(), H5F_ACC_RDONLY);
            std::string hdu = !request->hdu().empty()?request->hdu():"0";
            H5::Group group = file.openGroup(hdu);
          
            hdf5_files[request->uuid()] = {file, group};


            response->set_statusmessage(request->file() + " has been opened.");
            response->set_status(true);
        }
        catch (const H5::FileIException& e)
        {
            // std::cerr << "FileIException: " << e.getCDetailMsg() << std::endl;
            response->set_status(false);
            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 file"};
        } catch (const H5::GroupIException& e) {
            //Not working currently
            // std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            response->set_status(false);

            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 group " + request->hdu()};
        } catch (const std::exception& e) {
            response->set_status(false);

            // std::cerr << "Exception: " << e.what() << std::endl;
            return {grpc::StatusCode::INTERNAL, "An unexpected error occurred"};
        }
        
        // std::cout<<"<<File has been opened"<<std::endl;
        ServicePrint("File Opened");
        return grpc::Status::OK;
    }

    grpc::Status H5Service::CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response)
    {
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }

        try
        {
            ServicePrint("Closing File");
            Hdf5_File &h5file = hdf5_files[request->uuid()];
            h5file._file.close();
            h5file._group.close();
            hdf5_files.erase(request->uuid());
            response->set_statusmessage("File has been closed.");
            response->set_status(true);

        } catch (const H5::FileIException& e)
        {
            std::cerr << "FileIException: " << e.getCDetailMsg() << std::endl;
            return {grpc::StatusCode::INTERNAL, "Failed to close HDF5 file"};
        } catch (const H5::GroupIException& e) {
            std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            return {grpc::StatusCode::INTERNAL, "Failed to close HDF5 group "};
        }
        return grpc::Status::OK;
    };

    
    grpc::Status H5Service::GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response)
    {
        try
        {
            //TODO Currenty only open files Change to ICD method

            // std::cout << ">>Getting file info" << std::endl;
            ServicePrint("Getting file info");
            
            H5::H5File file;
            H5::Group group;

            if (request->uuid().empty()) {
                try
                {
                    file = H5::H5File(request->directory()+request->file(),H5F_ACC_RDONLY);
                    std::string hdu = !request->hdu().empty()?request->hdu():"0";
                    group = file.openGroup(hdu);
                }catch (const std::exception& e){
                    return {grpc::StatusCode::INVALID_ARGUMENT, "Couldn't open file : " + request->directory()+request->file() + " & No UUID present"};
                }       
            } else{
                if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
                    return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
                }

                Hdf5_File &h5file = hdf5_files[request->uuid()];
                file = h5file._file;
                group = h5file._group;

            }

            FileInfo *fileInfo = response->mutable_file_info();
            FileInfoExtended *extendedFileInfo = response->mutable_file_info_extended();
            
            fileInfo->set_name(file.getFileName());
            int fileSize = file.getFileSize();     
            fileInfo->set_size(fileSize);

            int numAttrs = group.getNumAttrs();
            for (int i = 0; i < numAttrs; i++) {
                H5::Attribute attr = group.openAttribute(i);
                std::string attrName = attr.getName();
                fileInfo->add_hdu_list(attrName);
                appendAttribute(extendedFileInfo,attr);
            }
            
            response->set_success(true);
        }
        catch (const H5::Exception &e)
        {
            //Handle more errors
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_success(false);
            response->set_message("Failed");
        }

        return grpc::Status::OK;
    };
    grpc::Status H5Service::GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request, ::grpc::ServerWriter< ::ImageDataResponse>* writer){
        
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }

        ServicePrint("Image Data Request");
      

        Hdf5_File &h5file = hdf5_files[request->uuid()];
        H5::DataSet dataset = h5file._group.openDataSet("DATA");  
        auto data_space = dataset.getSpace();

        // std::vector<float> result;

        std::vector<hsize_t> h5_start;
        std::vector<hsize_t> h5_count;

        hsize_t result_size = 1;

        std::vector<hsize_t> start(request->start().begin(), request->start().end());
        std::vector<hsize_t> count(request->count().begin(), request->count().end());

        int numDims = data_space.getSimpleExtentNdims();

        for (int d = 0; d < numDims; d++)
        {
            h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
            h5_count.insert(h5_count.begin(), d < count.size() ? count[d] : 1);
            result_size *= d < count.size() ? count[d]: 1;
        }
        // for (size_t i = 0; i < numDims; i++)
        // {
        //     std::cout<<h5_start[i]<<" ";
        // }
        // std::cout<<std::endl;
        
        // for (size_t i = 0; i < numDims; i++)
        // {
        //     std::cout<<h5_count[i]<<" ";
        // }
        // std::cout<<std::endl;

        // std::cout<<result_size<<std::endl;
        

        int num_bytes = result_size * sizeof(float);

        std::vector<float> buffer(result_size);

        H5::DataSpace mem_space(1, &result_size);

        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());

        dataset.read(buffer.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        data_space.close();
        dataset.close();

        const size_t MAX_CHUNK_SIZE = 2000* 2000;

        size_t offset = 0;
        size_t chunk_size = MAX_CHUNK_SIZE / sizeof(float);

        while (offset < buffer.size()) {
            size_t current_chunk_size = std::min(chunk_size, buffer.size() - offset);
            auto begin = std::chrono::high_resolution_clock::now();

            ImageDataResponse response;
            response.mutable_raw_values_fp32()->resize(current_chunk_size*sizeof(float));
        
            response.set_num_pixels(current_chunk_size);
            float* response_data = reinterpret_cast<float*>(response.mutable_raw_values_fp32()->data());

            std::copy(buffer.data() + offset, buffer.data() + offset + current_chunk_size, response_data);
            
            writer->Write(response);
            auto end = std::chrono::high_resolution_clock::now();
            auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);

            
            std::cout<<duration1.count()<<std::endl;


            offset += current_chunk_size;
        }


        // int num_bytes = result_size * sizeof(float);
        // std::cout<<sizeof(float)<<std::endl; 
        // //Create a bytes var
        //         ImageDataResponse response;    

        // //Fix this to not use the response var
        // response.mutable_raw_values_fp32()->resize(num_bytes);

        // H5::DataSpace mem_space(1, &result_size);

        // data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());

        // //Read data into the bytes var
        // dataset.read(response.mutable_raw_values_fp32()->data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        
        // ImageDataResponse response;    
     
        // //For loop to write chunks of the read into the response var
        // writer->Write(response);
        
        ServicePrint("ImageData Request Complete");
        return grpc::Status::OK;
    };
grpc::Status H5Service::GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileReaderResponse* response){
                if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }
        
        ServicePrint("Spectral Profile Request");
        std::vector<float> result;
        const hsize_t x = request->x();
        const hsize_t y = request->y();
        const hsize_t z = request->z();
        const hsize_t width = request->width();
        const hsize_t height = request->height();
        const hsize_t num_pixels = request->numpixels();
        
     
        Hdf5_File &h5file = hdf5_files[request->uuid()];
        //Possible add perm group to struct
       
        H5::Group permGroup = h5file._group.openGroup("PermutedData");

        H5::DataSet dataset = permGroup.openDataSet("ZYXW");

        const hsize_t resultSize = width*height*num_pixels;

        std::vector<hsize_t> start = {0,x,y,z};
        std::vector<hsize_t> dimCount = {1,width,height,num_pixels};
        result = H5Service::readRegion(dataset,dimCount,start,width*height*num_pixels);

      
        std::vector<bool> mask = getMask(request->region_info(),x,y,width,height);
 
        const auto num_bytes_sum = num_pixels * sizeof(float);
        const auto num_bytes_count = num_pixels * sizeof(int);
    
        response->mutable_raw_values_fp32()->resize(num_bytes_sum);
        response->mutable_counts()->resize(num_bytes_count);

        float* sum = reinterpret_cast<float*>(response->mutable_raw_values_fp32()->data());
        int* counts = reinterpret_cast<int*>(response->mutable_counts()->data());

        // std::vector<float> sum(num_pixels,0);
        // std::vector<int> counts(num_pixels,0);
        // int xoffset = num_pixels*height;
        
        int index = 0;
        int maskIndex=0;

          for (size_t xpos = 0; xpos < width; xpos++) {
            for (size_t ypos = 0; ypos < height; ypos++) {
                if (mask[maskIndex++]){
                    for (size_t zpos = 0; zpos < num_pixels; zpos++) {
                        float val = result[index++];
                        if (std::isfinite(val)) {
                            sum[zpos] += val;
                            counts[zpos]+=1;
                        }
                    }
                }
                else{
                    index+=num_pixels;
                }
            }
        }

        ServicePrint("Spectral Profile Stream Complete");
        return grpc::Status::OK;
    }


    grpc::Status H5Service::GetHistogram(::grpc::ServerContext* context, const ::HistogramRequest* request, ::HistogramResponse* response){
        
        ServicePrint("Histogram Request");

        // std::vector<float> result;
        
        auto begin = std::chrono::high_resolution_clock::now();

        std::vector<hsize_t> h5_start;
        std::vector<hsize_t> h5_count;

        hsize_t result_size = 1;

        std::vector<hsize_t> start(request->start().begin(), request->start().end());
        std::vector<hsize_t> count(request->count().begin(), request->count().end());

        Hdf5_File &h5file = hdf5_files[request->uuid()];

        H5::DataSet dataset = h5file._group.openDataSet("DATA");  
  
        auto data_space = dataset.getSpace();

        int numDims = data_space.getSimpleExtentNdims(); 
        
        for (int d = 0; d < numDims; d++)
        {
            h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
            h5_count.insert(h5_count.begin(), d < count.size() ? count[d] : 1);
            result_size *= d < count.size() ? count[d]: 1;
        }

        std::vector<float> data = readRegion(dataset,h5_count,h5_start,result_size);

        //Find Min,Max;
        float min_val = std::numeric_limits<float>::max(); 
        float max_val = std::numeric_limits<float>::min();

        for (size_t i = 0; i < result_size; i++)
        {
            const float val = data[i];
            if (std::isfinite(val)){
                if (val<min_val){
                    min_val = val;
                }
                if (val>max_val){
                    max_val = val;
                }
            }
        }
        const size_t num_bins = floor(sqrt(count[0]*count[1]));
        const float bin_width = (max_val - min_val) / num_bins;
        std::vector<int64_t> bins(num_bins);
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
        // std::cout << "Read : " <<duration1.count() << std::endl;

        // #pragma omp parallel
        //     {
        //         auto num_threads = omp_get_num_threads();
        //         auto thread_index = omp_get_thread_num();
        // #pragma omp single
        //         { temp_bins.resize(num_bins * num_threads); }
        // #pragma omp for

        for (int64_t i = 0; i < result_size; i++) {
            auto val = data[i];
            if (min_val <= val && val <= max_val) {
                size_t bin_number = std::clamp((size_t)((val - min_val) / bin_width), (size_t)0, num_bins - 1);
                bins[bin_number]++;
            }
        }

        // #pragma omp for
        //         for (int64_t i = 0; i < num_bins; i++) {
        //             for (int t = 0; t < num_threads; t++) {
        //                 _histogram_bins[i] += temp_bins[num_bins * t + i];
        //             }
        //         }
        // }  

        response->set_bin_width(bin_width);
        response->set_num_bins(num_bins);

        for (size_t i = 0; i < num_bins; i++)
        {
            response->add_bins(bins[i]);
        }
               
        return grpc::Status::OK;
    }




    /// @brief sets an h5 atrribute to its corresponding place in the FileInfoExtended messege
    /// @param extendedFileInfo 
    /// @param attr 
    void H5Service::appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr){
        std::string attrName = attr.getName();
        H5::DataType attrType = attr.getDataType();

        if (attrName == "NAXIS") {
            int value;
            attr.read(attrType, &value);
            extendedFileInfo->set_dimensions(value);
        } else if (attrName == "NAXIS1") {
            int value;
            attr.read(attrType, &value);
            extendedFileInfo->set_width(value);
        } else if (attrName == "NAXIS2") {
            int value;
            attr.read(attrType, &value);
            extendedFileInfo->set_height(value);
        } else if (attrName == "NAXIS3") {
            int value;
            attr.read(attrType, &value);
            extendedFileInfo->set_depth(value);
        } else if (attrName == "NAXIS4") {
            int value;
            attr.read(attrType, &value);
            extendedFileInfo->set_stokes(value);
        } else {
            //TODO Create header entry type and enum in .proto
            if (attrType.getClass() == H5T_INTEGER) {
                int value;
                attr.read(attrType, &value);
                // std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else if (attrType.getClass() == H5T_FLOAT) {
                double value;
                attr.read(attrType, &value);
                // std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else if (attrType.getClass() == H5T_STRING) {
                std::string value;
                attr.read(attrType, value);
                // std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else {
                // std::cout << "Attribute name: " << attrName << " has an unsupported data type." << std::endl;
            }
        }
    };


    std::vector<bool> H5Service::getMask(RegionInfo region_info,int startX,int startY,int numX, int numY){
        std::vector<bool> mask(numX*numY,true);

        switch (region_info.regiontype())
        {
        case RegionType::CIRCLE:{
            int radi = region_info.controlpoints().Get(1).x();
            int centerX = region_info.controlpoints().Get(0).x();
            int centerY = region_info.controlpoints().Get(0).y();
            int index = 0;
            double pow_radius = pow(radi,2);
            // float center = (diameter-1)/2.0;
            // float centerY = (diameter-1)/2.0;

            for (int x = startX; x < startX+numX; x++) {
                //part of circle calculation
                double pow_x = pow(x-centerX,2);
                for (int y = startY; y < startY+numY; y++) {
                    //if point is inside the circle
                    if (pow_x + pow(y-centerY,2) > pow_radius){


                        mask[index] = false;
                    }
                    index++;
                }
            }
            break;
        }
        default:
            break;
        }
        return mask;
    }
    //Old Methods

    std::vector<float> H5Service::readRegion(const H5::DataSet &dataset,std::vector<hsize_t> &dimCount,std::vector<hsize_t> &start,hsize_t totalPixels){
        
            std::vector<float> result(totalPixels);
            H5::DataSpace data_space = dataset.getSpace();
            H5::DataSpace mem_space(1,&totalPixels);

            data_space.selectHyperslab(H5S_SELECT_SET,dimCount.data(),start.data());
            dataset.read(result.data(),H5::PredType::NATIVE_FLOAT,mem_space,data_space);
            return result;
 
    };

    void H5Service::ServicePrint(std::string msg){
        std::cout << "[" << port << "] " << msg << std::endl;
    }

//old
    grpc::Status H5Service::GetSpectralProfileStream(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::grpc::ServerWriter< ::SpectralProfileReaderResponse>* writer){
        //         if (request->uuid().empty()) {
        //     return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        // }

        // if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
        //     return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        // }
        

        // // bool hasMask = false;//!request->mask().empty();
        // // std::vector<bool> mask_vector;


        // // if (hasMask){
        // //     // const google::protobuf::RepeatedField<bool>& mask_values  = request->mask();
        // //     // mask_vector.assign(mask_values.begin(), mask_values.end());
        // //     // // int16_t mask_width = mask.width();
        // //     // // int16_t mask_height = mask.height();


        // //     // for (size_t i = 0; i < mask_vector.size(); i++)
        // //     // {
        // //     //     std::cout<<mask_vector[i]<<" ";
        // //     //     /* code */
        // //     // }
        // //     std::cout<<std::endl;
         
        // // }

        // ServicePrint("Spectral Profile Stream Request");

        // std::vector<float> result;
        // const hsize_t x = request->x();
        // const hsize_t y = request->y();
        // const hsize_t z = request->z();
        // const hsize_t width = request->width();
        // const hsize_t height = request->height();
        // const hsize_t num_pixels = request->numpixels();
        
     
        // Hdf5_File &h5file = hdf5_files[request->uuid()];
        // //Possible add perm group to struct
       
        // H5::Group permGroup = h5file._group.openGroup("PermutedData");

        // H5::DataSet dataset = permGroup.openDataSet("ZYXW");

        // const hsize_t resultSize = width*height*num_pixels;

        // std::vector<hsize_t> start = {0,x,y,z};
        // std::vector<hsize_t> dimCount = {1,width,height,num_pixels};
        // result = H5Service::readRegion(dataset,dimCount,start,width*height*num_pixels);
        
        //   const auto num_bytes = num_pixels * sizeof(float);
        // response->mutable_data()->resize(num_bytes);

        // int offset = 0;
        
        // std::vector<float> sum(num_pixels,0);
        // std::vector<int> counts(num_pixels,0);
        // int xoffset = num_pixels*height;
        
        // int index = 0;
        // for (size_t xpos = 0; xpos < width; xpos++) {
        //     for (size_t ypos = 0; ypos < height; ypos++) {
        //             // int yoffset = ypos * num_pixels + zpos;
        //             for (size_t zpos = 0; zpos < num_pixels; zpos++) {
        //                 // int index = xpos * xoffset + yoffset;
        //                 float val = result[index++];
        //                 if (std::isfinite(val)) {
        //                     sum[zpos] += val;
        //                     counts[zpos]++;
        //             }
        //         }
        //     }
        // }



        // // auto mid = std::chrono::high_resolution_clock::now();

        // ::SpectralProfileResponse response;
        // for (size_t i = 0; i < num_pixels; i++){

        //     response.add_count(counts[i]);
        //     response.add_data(sum[i]);

        // }
        // // auto mid2 = std::chrono::high_resolution_clock::now();
      
        // writer->Write(response);
        
        // // auto end = std::chrono::high_resolution_clock::now();
     
        // // auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(mid - st);
        // // auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(mid2 - mid);
        // // auto duration3 = std::chrono::duration_cast<std::chrono::milliseconds>(end - mid2);

        // // std::cout << "Cal " <<duration1.count() << std::endl;
        // // std::cout << "App " <<duration2.count() << std::endl;
        // // std::cout << "Write " <<duration3.count() << std::endl;

        // // ServicePrint("Spectral Profile Stream Complete");
        return grpc::Status::OK;
    }
    //For later if needed
    grpc::Status H5Service::GetHistogramDist(::grpc::ServerContext* context, const ::HistogramDistRequest* request, ::HistogramResponse* response){
        
        ServicePrint("Histogram Request");
        // const size_t num_bins = request->num_bins();
        // const float bin_width = request->bin_width();
        // const std::vector<float> data(request->data().begin(),request->data().end());
        // const size_t result_size = data.size();
        // std::vector<int64_t> bins(num_bins);
        // const float min_val = request->min_value();
        // const float max_val = request->max_value(); 
        // // for (int64_t i = 0; i < result_size; i++) {
        // //     auto val = data[i];
        // //     if (min_val <= val && val <= max_val) {
        // //         size_t bin_number = std::clamp((size_t)((val - min_val) / bin_width), (size_t)0, num_bins - 1);
        // //         bins[bin_number]++;
        // //     }
        // // }

        // // #pragma omp for
        // //         for (int64_t i = 0; i < num_bins; i++) {
        // //             for (int t = 0; t < num_threads; t++) {
        // //                 _histogram_bins[i] += temp_bins[num_bins * t + i];
        // //             }
        // //         }
        // // }  

        // response->set_bin_width(bin_width);
        // response->set_num_bins(num_bins);
        // for (size_t i = 0; i < num_bins; i++)
        // {
        //     response->add_bins(bins[i]);
        // }
         
            
        return grpc::Status::OK;
    }
