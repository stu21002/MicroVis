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

    //Constructor
    H5Service::H5Service(int port) : port(port) {}

    grpc::Status H5Service::CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response)
    {
        response->set_status(true);  
        response->set_statusmessage("OK");
        return grpc::Status::OK;
    }

    //Opening file service
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::OpenFileRequest *request, ::StatusResponse *response)
    {

        ServicePrint("Opening File");

        try
        {
            if (request->uuid().empty() || request->file().empty()){
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
            // std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            response->set_status(false);

            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 group " + request->hdu()};
        } catch (const std::exception& e) {
            response->set_status(false);

            // std::cerr << "Exception: " << e.what() << std::endl;
            return {grpc::StatusCode::INTERNAL, "An unexpected error occurred"};
        }
        
        ServicePrint("File Opened");
        return grpc::Status::OK;
    }
    //Closing file service
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

    //file information service
    grpc::Status H5Service::GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response)
    {
        try
        {

            ServicePrint("Getting file info");
            
            H5::H5File file;
            H5::Group group;

            if (request->uuid().empty()) {
                try
                {
                    //File info of any file
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
                //File Info of open file
                Hdf5_File &h5file = hdf5_files[request->uuid()];
                file = h5file._file;
                group = h5file._group;

            }

            //Adding file info
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
        
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_success(false);
            response->set_message("Failed");
        }

        return grpc::Status::OK;
    };

    //Image data service
    grpc::Status H5Service::GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request, ::grpc::ServerWriter< ::ImageDataResponse>* writer){
        auto begin = std::chrono::high_resolution_clock::now();
        long total_bytes = 1;
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }

        ServicePrint("Image Data Request");
      

        Hdf5_File &h5file = hdf5_files[request->uuid()];

        H5::DataSet dataset;
        H5::Group permGroup; 
        H5::DataSpace data_space;

        if (request->perm_data())
        {
            permGroup = h5file._group.openGroup("PermutedData");

            dataset = permGroup.openDataSet("ZYXW");

            //initialising dimensions to be read
            std::vector<hsize_t> start(request->start().begin(), request->start().end());
            std::vector<hsize_t> count(request->count().begin(), request->count().end());

            data_space = dataset.getSpace();
            int numDims = data_space.getSimpleExtentNdims();

            //change start 4th pos for stokes values, assuming 0
            std::vector<hsize_t> h5_start(numDims,0);
            std::vector<hsize_t> h5_count(numDims,1);
            
            //0 1 2 3
            //W X Y Z H5
            //X Y Z W
      
            h5_start[0]=0;
            h5_start[1]=start[0];
            h5_start[2]=start[1];
            h5_start[3]=start[2];

            h5_count[0]=1;
            h5_count[1]=1;
            h5_count[2]=count[1];
            h5_count[3]=count[2];

            //calculating the number of pixels to be read
            hsize_t result_size = 1;
            for (size_t i = 0; i < h5_count.size(); i++)
            {
                result_size *=h5_count[i];
            }

            int num_bytes = result_size * sizeof(float);
            total_bytes *= num_bytes * count[0];
            
            size_t startX = start[0];
            size_t endX = count[0]+startX;

            //Loop iterating through the slowest ,X, dimension
            for (size_t i = startX; i < endX; i++)
            {   
                h5_start[1]=i; 

                std::vector<float> buffer(result_size);

                H5::DataSpace mem_space(1, &result_size);
     
                //reading
                data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
                dataset.read(buffer.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
                mem_space.close();
                const size_t MAX_CHUNK_SIZE = 2000* 2000;

                size_t offset = 0;
                size_t chunk_size = MAX_CHUNK_SIZE / sizeof(float);

                while (offset < buffer.size()) {
                    size_t current_chunk_size = std::min(chunk_size, buffer.size() - offset);

                    ImageDataResponse response;
                    response.mutable_raw_values_fp32()->resize(current_chunk_size*sizeof(float));
                
                    response.set_num_pixels(current_chunk_size);
                    float* response_data = reinterpret_cast<float*>(response.mutable_raw_values_fp32()->data());

                    std::copy(buffer.data() + offset, buffer.data() + offset + current_chunk_size, response_data);
                    
                    writer->Write(response);
                    offset += current_chunk_size;
                }
            }
            data_space.close();
            dataset.close();
            permGroup.close();
        }else{
            
            dataset= h5file._group.openDataSet("DATA");  

            //initialising dimensions
            std::vector<hsize_t> start(request->start().begin(), request->start().end());
            std::vector<hsize_t> count(request->count().begin(), request->count().end());

            data_space = dataset.getSpace();
            int numDims = data_space.getSimpleExtentNdims();
            std::vector<hsize_t> h5_start(numDims,0);
            std::vector<hsize_t> h5_count(numDims,1);

            //0 1 2 3
            //W Z Y X H5
            //X Y Z W
            h5_start[0]=0;
            h5_start[1]=start[2];
            h5_start[2]=start[1];
            h5_start[3]=start[0];

            h5_count[0]=1;
            h5_count[1]=1;
            h5_count[2]=count[1];
            h5_count[3]=count[0];


            //Getting result size
            hsize_t result_size = 1;
            for (size_t i = 0; i < h5_count.size(); i++)
            {
                result_size *=h5_count[i];
            }

            int num_bytes = result_size * sizeof(float);
            total_bytes *= num_bytes * count[2];


            size_t startZ = start[2];
            size_t endZ = count[2]+startZ;


            //Loop iterating through the slowest ,Z, dimension
            for (size_t i = startZ; i < endZ; i++)
            {     
                h5_start[1]=i; 
           
                std::vector<float> buffer(result_size);

                H5::DataSpace mem_space(1, &result_size);

                //Reading
                data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
                dataset.read(buffer.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
                mem_space.close();


                //Overflow with max message sizes
                const size_t MAX_CHUNK_SIZE = 2000* 2000;

                size_t offset = 0;
                size_t chunk_size = MAX_CHUNK_SIZE / sizeof(float);

                while (offset < buffer.size()) {
                    size_t current_chunk_size = std::min(chunk_size, buffer.size() - offset);

                    ImageDataResponse response;
                    response.mutable_raw_values_fp32()->resize(current_chunk_size*sizeof(float));
                
                    response.set_num_pixels(current_chunk_size);
                    float* response_data = reinterpret_cast<float*>(response.mutable_raw_values_fp32()->data());

                    std::copy(buffer.data() + offset, buffer.data() + offset + current_chunk_size, response_data);

                    //Sending message 
                    writer->Write(response);
                    offset += current_chunk_size;
                }

            }
            data_space.close();
            dataset.close();
        }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
        
        //Timings for expirments and demo
        if (duration.count()/1000 > 0){
        ServicePrint("Execution Time : " + std::to_string(duration.count()/1000)+" (s)");
        ServicePrint("Bytes Read : " + std::to_string(total_bytes/1000) + " MB");
            ServicePrint("Throughput : " + std::to_string((total_bytes/duration.count())/1000) + " MB/S");
        }else{
            if (duration.count() > 0){
                ServicePrint("Execution Time : " + std::to_string(duration.count())+" (ms)");
                ServicePrint("Bytes Read : " + std::to_string(total_bytes) + " B");
                ServicePrint("Throughput : " + std::to_string((total_bytes/duration.count())) + " B/ms");
            }else{
                ServicePrint("Execution Time : " + std::to_string(duration.count())+" (ms)");
                ServicePrint("Bytes Read : " + std::to_string(total_bytes) + " B");

            }


        }
        ServicePrint("Image Data Request Completed");
        return grpc::Status::OK;
    };


    //Method Spectral Profile Calculation
grpc::Status H5Service::GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileReaderResponse* response){
        
        auto begin = std::chrono::high_resolution_clock::now();

        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }
        
        ServicePrint("Spectral Profile Request");
        const hsize_t x = request->x();
        const hsize_t y = request->y();
        const hsize_t z = request->z();
        const hsize_t width = request->width();
        const hsize_t height = request->height();
        const hsize_t num_pixels = request->numpixels();
        
        //Opening perm dataset
        Hdf5_File &h5file = hdf5_files[request->uuid()];    
        H5::Group permGroup = h5file._group.openGroup("PermutedData");
        H5::DataSet dataset = permGroup.openDataSet("ZYXW");

        const hsize_t resultSize = width*height*num_pixels;
        std::vector<bool> mask = getMask(request->region_info(),x,y,width,height);

        const auto num_bytes_sum = num_pixels * sizeof(float);
        const auto num_bytes_count = num_pixels * sizeof(int);
    
        response->mutable_raw_values_fp32()->resize(num_bytes_sum);
        response->mutable_counts()->resize(num_bytes_count);

        float* sum = reinterpret_cast<float*>(response->mutable_raw_values_fp32()->data());
        int* counts = reinterpret_cast<int*>(response->mutable_counts()->data());

        hsize_t res_size = height*num_pixels;
        H5::DataSpace data_space = dataset.getSpace();
        
        int maskIndex=0;

        //looping through slowest dim (x)
        for (size_t i = x; i < x+width; i++)
        {
        
        std::vector<hsize_t> start = {0,i,y,z};
        std::vector<hsize_t> dimCount = {1,1,height,num_pixels};
        
        std::vector<float> result(res_size);
        H5::DataSpace mem_space(1,&res_size);
        //Reading
        data_space.selectHyperslab(H5S_SELECT_SET,dimCount.data(),start.data());
        dataset.read(result.data(),H5::PredType::NATIVE_FLOAT,mem_space,data_space);

        mem_space.close();
        //Calculation
        int index = 0;

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
        data_space.close();
        dataset.close();
        permGroup.close();

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);


        ServicePrint("Execution Time : " + std::to_string(duration.count()));
        ServicePrint("Spectral Service Complete");
        return grpc::Status::OK;
    }

    //No Expirments Run on Histogram Service (Future Work)
    // grpc::Status H5Service::GetHistogram(::grpc::ServerContext* context, const ::HistogramRequest* request, ::HistogramResponse* response){
        
    //     //ServicePrint("Histogram Request");

    //     // std::vector<float> result;
        
    //     auto begin = std::chrono::high_resolution_clock::now();

    //     std::vector<hsize_t> h5_start;
    //     std::vector<hsize_t> h5_count;

    //     hsize_t result_size = 1;

    //     std::vector<hsize_t> start(request->start().begin(), request->start().end());
    //     std::vector<hsize_t> count(request->count().begin(), request->count().end());

    //     Hdf5_File &h5file = hdf5_files[request->uuid()];

    //     H5::DataSet dataset = h5file._group.openDataSet("DATA");  
  
    //     auto data_space = dataset.getSpace();

    //     int numDims = data_space.getSimpleExtentNdims(); 
        
    //     for (int d = 0; d < numDims; d++)
    //     {
    //         h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
    //         h5_count.insert(h5_count.begin(), d < count.size() ? count[d] : 1);
    //         result_size *= d < count.size() ? count[d]: 1;
    //     }

    //     std::vector<float> data(result_size);
    // // readRegion(dataset,h5_count,h5_start,result_size,data);
    //     H5::DataSpace mem_space(1,&result_size);

    //     data_space.selectHyperslab(H5S_SELECT_SET,h5_count.data(),h5_start.data());
    //     dataset.read(data.data(),H5::PredType::NATIVE_FLOAT,mem_space,data_space);

    //     //Find Min,Max;
    //     float min_val = std::numeric_limits<float>::max(); 
    //     float max_val = std::numeric_limits<float>::min();

    //     for (size_t i = 0; i < result_size; i++)
    //     {
    //         const float val = data[i];
    //         if (std::isfinite(val)){
    //             if (val<min_val){
    //                 min_val = val;
    //             }
    //             if (val>max_val){
    //                 max_val = val;
    //             }
    //         }
    //     }
    //     const size_t num_bins = floor(sqrt(count[0]*count[1]));
    //     const float bin_width = (max_val - min_val) / num_bins;
    //     std::vector<int64_t> bins(num_bins);
        
    //     auto end = std::chrono::high_resolution_clock::now();
    //     auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
    //     // std::cout << "Read : " <<duration1.count() << std::endl;


    //     for (int64_t i = 0; i < result_size; i++) {
    //         auto val = data[i];
    //         if (min_val <= val && val <= max_val) {
    //             size_t bin_number = std::clamp((size_t)((val - min_val) / bin_width), (size_t)0, num_bins - 1);
    //             bins[bin_number]++;
    //         }
    //     }

    //     response->set_bin_width(bin_width);
    //     response->set_num_bins(num_bins);

    //     for (size_t i = 0; i < num_bins; i++)
    //     {
    //         response->add_bins(bins[i]);
    //     }
               
    //     return grpc::Status::OK;
    // }




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
            //TO be extend for the rest of the file info if needed
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


    //Mask Calculatiom
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
//Print message for service
    void H5Service::ServicePrint(std::string msg){
        std::cout << "[" << port << "] " << msg << std::endl;
    }


