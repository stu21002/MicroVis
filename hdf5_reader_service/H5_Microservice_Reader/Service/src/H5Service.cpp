#include "H5Service.h" 

#include <grpcpp/grpcpp.h>
#include "../proto/H5ReaderServices.grpc.pb.h"
#include "../proto/H5ReaderServices.pb.h"

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

    
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::OpenFileRequest *request, ::OpenFileACK *response)
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
            
            FileInfo *fileInfo = response->mutable_file_info();
            FileInfoExtended *extendedFileInfo = response->mutable_file_info_extended();
            
            fileInfo->set_name(file.getFileName());
            int64_t fileSize = file.getFileSize();     
            fileInfo->set_size(fileSize);

            int numAttrs = group.getNumAttrs();
            for (int i = 0; i < numAttrs; i++) {
                H5::Attribute attr = group.openAttribute(i);
                std::string attrName = attr.getName();
                fileInfo->add_hdu_list(attrName);
                appendAttribute(extendedFileInfo,attr);
            }

            response->set_message(request->file() + " has been opened.");
            response->set_success(true);
        }
        catch (const H5::FileIException& e)
        {
            // std::cerr << "FileIException: " << e.getCDetailMsg() << std::endl;
            response->set_success(false);
            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 file"};
        } catch (const H5::GroupIException& e) {
            //Not working currently
            // std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            response->set_success(false);

            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 group " + request->hdu()};
        } catch (const std::exception& e) {
            response->set_success(false);

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

            std::cout << ">>Getting file info" << std::endl;
            
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
    grpc::Status H5Service::GetRegionStream(::grpc::ServerContext* context, const ::proto::RegionDataRequest* request, ::grpc::ServerWriter< ::proto::RegionDataResponse>* writer){
        
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }

        ServicePrint("Region Request");
      

        std::vector<float> result;

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

        result.resize(result_size);
        H5::DataSpace mem_space(1, &result_size);
        
        // auto file_space = _dataset.getSpace();
  


        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
        dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
 

        data_space.close();
        dataset.close();
        int offset = 0;

        for (size_t w = 0; w < h5_count[0]; w++)
        {
            for (size_t z = 0; z < h5_count[1]; z++)
                {
                    for (size_t y = 0; y < h5_count[2]; y++)
                    {   
                        RegionDataResponse response;     
                        for (size_t x = 0; x < h5_count[3]; x++)
                        {
                            response.add_data(result[offset]);
                            
                            offset++;
                        }
  
              
                        writer->Write(response);
                        response.clear_data();
        
          
                       
                    }

                }

        }
        
        ServicePrint("Region Request Complete");
        return grpc::Status::OK;
    };

    grpc::Status H5Service::GetSpectralProfileStream(::grpc::ServerContext* context, const ::proto::SpectralProfileRequest* request, ::grpc::ServerWriter< ::proto::SpectralProfileResponse>* writer){
                if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }
        

        // bool hasMask = false;//!request->mask().empty();
        // std::vector<bool> mask_vector;


        // if (hasMask){
        //     // const google::protobuf::RepeatedField<bool>& mask_values  = request->mask();
        //     // mask_vector.assign(mask_values.begin(), mask_values.end());
        //     // // int16_t mask_width = mask.width();
        //     // // int16_t mask_height = mask.height();


        //     // for (size_t i = 0; i < mask_vector.size(); i++)
        //     // {
        //     //     std::cout<<mask_vector[i]<<" ";
        //     //     /* code */
        //     // }
        //     std::cout<<std::endl;
         
        // }

        ServicePrint("Spectral Profile Stream Request");

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
        
        // ServicePrint("Reading Complete");

        int offset = 0;
        
        std::vector<float> sum(num_pixels,0);
        std::vector<int> counts(num_pixels,0);
        int xoffset = num_pixels*height;
        
        int index = 0;
        for (size_t xpos = 0; xpos < width; xpos++) {
            for (size_t ypos = 0; ypos < height; ypos++) {
                    // int yoffset = ypos * num_pixels + zpos;
                    for (size_t zpos = 0; zpos < num_pixels; zpos++) {
                        // int index = xpos * xoffset + yoffset;
                        float val = result[index++];
                        if (std::isfinite(val)) {
                            sum[zpos] += val;
                            counts[zpos]++;
                    }
                }
            }
        }



        // auto mid = std::chrono::high_resolution_clock::now();

        ::SpectralProfileResponse response;
        for (size_t i = 0; i < num_pixels; i++){

            response.add_count(counts[i]);
            response.add_data(sum[i]);

        }
        // auto mid2 = std::chrono::high_resolution_clock::now();
      
        writer->Write(response);
        
        // auto end = std::chrono::high_resolution_clock::now();
     
        // auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(mid - st);
        // auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(mid2 - mid);
        // auto duration3 = std::chrono::duration_cast<std::chrono::milliseconds>(end - mid2);

        // std::cout << "Cal " <<duration1.count() << std::endl;
        // std::cout << "App " <<duration2.count() << std::endl;
        // std::cout << "Write " <<duration3.count() << std::endl;

        // ServicePrint("Spectral Profile Stream Complete");
        return grpc::Status::OK;
    }

    grpc::Status H5Service::GetHistogram(::grpc::ServerContext* context, const ::proto::HistogramRequest* request, ::proto::HistogramResponse* response){
        
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
        std::cout << "Read : " <<duration1.count() << std::endl;

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
    grpc::Status H5Service::GetHistogramDist(::grpc::ServerContext* context, const ::proto::HistogramDistRequest* request, ::proto::HistogramResponse* response){
        
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


    //Old Methods
    std::vector<std::vector<bool>> H5Service::getMask(RegionType regionType,int width){
        std::vector<std::vector<bool>> mask;
        switch (regionType)
        {
        case RegionType::CIRCLE:{
            mask.resize(width, std::vector<bool>(width, false));
            double pow_radius = pow(width/2.0,2);
            float centerX = (width-1)/2.0;
            float centerY = (width-1)/2.0;
            for (int x = 0; x < width; x++) {
                //part of circle calculation
                double pow_x = pow(x-centerX,2);
                for (int y = 0; y < width; y++) {
                    //if point is inside the circle
                    if (pow_x + pow(y-centerY,2) <= pow_radius){
                        mask[x][y] = true;
                    }
                }
            }
            break;
        }
        default:
            break;
        }
        return mask;
    }

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

