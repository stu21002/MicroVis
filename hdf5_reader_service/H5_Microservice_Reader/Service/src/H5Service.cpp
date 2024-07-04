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
            std::cout << ">>Opening file " << std::endl;
            if (request->uuid().empty() || request->file().empty()){
                std::cout << "<<Failed Request" << std::endl;
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
            // std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            response->set_success(false);

            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 group " + request->hdu()};
        } catch (const std::exception& e) {
            response->set_success(false);

            // std::cerr << "Exception: " << e.what() << std::endl;
            return {grpc::StatusCode::INTERNAL, "An unexpected error occurred"};
        }
        
        std::cout<<"<<File has been opened"<<std::endl;
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
            std::cout << "Closing file" << std::endl;
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

    ::grpc::Status H5Service::GetRegion(::grpc::ServerContext* context, const ::RegionDataRequest* request, ::RegionDataResponse* response)
    {
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }

        std::cout << ">>Reading Region" << std::endl;
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
            h5_count.insert(h5_count.begin(), d < start.size() ? count[d] : 1);
            result_size *= d < start.size() ? count[d]: 1;
        }

        result.resize(result_size);
        H5::DataSpace mem_space(1, &result_size);
        
        // auto file_space = _dataset.getSpace();
        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
        dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
                std::cout << "Reading Region" << std::endl;

        data_space.close();
        dataset.close();

        for (float value : result)
        {
            response->add_data(value);
        }

        return grpc::Status::OK;
    };


    grpc::Status H5Service::GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileRequest* request, ::SpectralProfileResponse* response){
        
        if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }
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
        std::cout << resultSize << std::endl;

        //TODO for sending bytes
        // auto data_type = dataset.getDataType();
        // int num_bytes = (resultSize) * data_type.getSize();
        // response->mutable_data()->resize(num_bytes);


        // H5::DataSpace data_space = dataset.getSpace();
        // H5::DataSpace mem_space(1,&resultSize);

        std::vector<hsize_t> start = {0,x,y,z};
        std::vector<hsize_t> dimCount = {1,width,height,num_pixels};
        result = H5Service::readRegion(dataset,dimCount,start,width*height*num_pixels);
        
        std::cout << "Performing Spectral Profile" << std::endl;
        for (float value : result)
        {
            response->add_data(value);
        }


        // data_space.selectHyperslab(H5S_SELECT_SET,dimCount.data(),start.data());
        // dataset.read(response->mutable_data()->data(),H5::PredType::NATIVE_FLOAT,mem_space,data_space);
        


        // RegionType regionType = request->regiontype();
        // if (regionType == RegionType::POINT){
        //     std::cout << ">> Performing Single Point Spectral Profile" << std::endl;

        //     std::vector<hsize_t> start = {0,x,y,z};
        //     std::vector<hsize_t> dimCounts = {1,1,1,num_pixels};

        //     result = H5Service::readRegion(dataset,dimCounts,start,num_pixels);
 

        //     for (float value : result)
        //     {
        //         response->add_data(value);
        //     }

        // }
        // else if (regionType == RegionType::LINE || regionType == RegionType::RECTANGLE){
        //     std::cout << ">> Performing Multi Point Rectangle Spectral Profile " << std::endl;
        //     const hsize_t width = request->width();
        //     const hsize_t height = request->height();

        //     std::cout << x << " " << y << " " << z << " "<< width << " " << height << " " << num_pixels << std::endl;
        //     std::vector<hsize_t> start = {0,x,y,z};
        //     std::vector<hsize_t> dimCounts = {1,width,height,num_pixels};
            
        //     auto sRead = std::chrono::high_resolution_clock::now();
        //     bool success = H5Service::readRegion(dataset,dimCounts,start,num_pixels*width*height);
        //     auto eRead = std::chrono::high_resolution_clock::now();
        //     auto dRead = std::chrono::duration_cast<std::chrono::milliseconds>( eRead - sRead);
        //     std::cout << "Read time: "<< dRead.count() << " milliseconds" << std::endl;

        //     // if (request->xsplit()){
                
        //     // }
            

        //     // auto sSpec = std::chrono::high_resolution_clock::now();
        //     // std::vector<float> spectralProfile(num_pixels);
        //     // int offset = num_pixels*height;
        //     // for (int z = 0; z < num_pixels; z++) {
        //     //     int count = 0;
        //     //     float sum = 0; 
        //     //     for (int x = 0; x < width; x++) {
        //     //         int index = z + x * offset;
        //     //         for (int y = 0; y < height; y++) {

        //     //             const auto value = result[index];
        //     //             if (std::isfinite(value)) {
        //     //                 sum += value;
        //     //                 count++;
        //     //             }
        //     //             index += num_pixels;
        //     //         }
        //     //     }
        //     //     const float channel_mean = count > 0 ? sum / count : NAN;
        //     //     // spectralProfile.at(z) = channel_mean;
        //     //     response->add_data(channel_mean);
        //     // }   
        //     // auto eSpec = std::chrono::high_resolution_clock::now();
        //     // auto dSpec = std::chrono::duration_cast<std::chrono::milliseconds>( eSpec- sSpec);
        //     // std::cout << "Average time: "<< dSpec.count() << " milliseconds" << std::endl;
        // }
        // else if (regionType == RegionType::CIRCLE){
        //     std::cout << ">> Performing Multi Point Circle Spectral Profile" << std::endl;
        //     // const hsize_t width = request->width();
        //     // const hsize_t height = request->height();

        //     // //Assuming width and height == for perfect circle
        //     // std::vector<hsize_t> start = {0,x,y,z};
        //     // std::vector<hsize_t> dimCounts = {1,width,height,num_pixels};
        //     // bool success = H5Service::readRegion(dataset,dimCounts,start,num_pixels*width*height);

        //     // std::vector<float> spectralProfile(num_pixels);
        //     // std::vector<std::vector<bool>> mask = getMask(regionType,width);
        //     // int offset = num_pixels*height;
        //     // for (int z = 0; z < num_pixels; z++) {
        //     //     int count = 0;
        //     //     float sum = 0; 
        //     //     for (int x = 0; x < width; x++) {
        //     //         int index = z + x * offset;    
        //     //         for (int y = 0; y < height; y++) {
        //     //             //if point is inside the circle
        //     //             if (mask[x][y]){
        //     //                 const auto value = result[index];
        //     //                 if (std::isfinite(value)) {
        //     //                     sum += value;
        //     //                     count++;
        //     //                 }

        //     //             }
        //     //             index += num_pixels;
        //     //         }
        //     //     }
        //     //     const float channel_mean = count > 0 ? sum / count : NAN;
        //     //     // spectralProfile.at(z) = channel_mean;
        //     //     response->add_data(channel_mean);
        //     // }   
        // }
        std::cout << "<< Spectral Profile Complete" << std::endl;
        return grpc::Status::OK;
    };
    grpc::Status H5Service::GetSpectralProfileStream(::grpc::ServerContext* context, const ::proto::SpectralProfileRequest* request, ::grpc::ServerWriter< ::proto::SpectralProfileResponse>* writer){
                if (request->uuid().empty()) {
            return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
        }

        if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
            return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
        }
        std::vector<float> result;
        const hsize_t x = request->x();
        const hsize_t y = request->y();
        const hsize_t z = request->z();
        const hsize_t width = request->width();
        const hsize_t height = request->height();
        const hsize_t num_pixels = request->numpixels();
        
        std::cout<<x<< " : " << width <<std::endl;
        std::cout<<y << " : " <<height<<std::endl;
     
        Hdf5_File &h5file = hdf5_files[request->uuid()];
        //Possible add perm group to struct
       
        
        H5::Group permGroup = h5file._group.openGroup("PermutedData");


        H5::DataSet dataset = permGroup.openDataSet("ZYXW");


        const hsize_t resultSize = width*height*num_pixels;
        std::cout << resultSize << std::endl;

        std::vector<hsize_t> start = {0,x,y,z};
        std::vector<hsize_t> dimCount = {1,width,height,num_pixels};
        result = H5Service::readRegion(dataset,dimCount,start,width*height*num_pixels);
        
        ServicePrint("Performing Spectral Profile Stream");

        int offset = 0;
        
        for (size_t i = 0; i < width; i++)
        {
            for (size_t j = 0; j < height; j++)
            {   
                ::SpectralProfileResponse response;
                for (size_t k = 0; k < num_pixels; k++)
                {
                    response.add_data(result[offset]);
                    offset++;
                }
                
                std::cout << response.ByteSizeLong() << std::endl;
                // ServicePrint(std::to_string(response.ByteSizeLong()));
                writer->Write(response);
            }
            
        }
        


        ServicePrint("Performing Spectral Profile Stream Complete");
        return grpc::Status::OK;
    }


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

