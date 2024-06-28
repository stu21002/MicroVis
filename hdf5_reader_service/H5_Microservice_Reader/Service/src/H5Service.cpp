#include "H5Service.h" 

#include <grpcpp/grpcpp.h>
#include "../proto/H5ReaderServices.grpc.pb.h"
#include "../proto/H5ReaderServices.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector>
#include <cstdlib>
#include <cmath>
#include <fmt/core.h> 
#include <chrono>


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

    
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response)
    {


        try
        {
            std::cout << ">>Opening file" << std::endl;
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
            response->set_statusmessage(request->file() + " has been opened.");
            response->set_status(true);
        }
        catch (const H5::FileIException& e)
        {
            std::cerr << "FileIException: " << e.getCDetailMsg() << std::endl;
            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 file"};
        } catch (const H5::GroupIException& e) {
            std::cerr << "GroupIException: " << e.getCDetailMsg() << std::endl;
            return {grpc::StatusCode::INTERNAL, "Failed to open HDF5 group " + request->hdu()};
        } catch (const std::exception& e) {

            std::cerr << "Exception: " << e.what() << std::endl;
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
            //Possibly is empty... then try open??
            std::cout << ">>Getting file info" << std::endl;
            // H5::H5File qckFile = H5::H5File(request->directory()+request->file(), H5F_ACC_RDONLY);
            // std::string hdu = !request->hdu().empty()?request->hdu():"0";
            // H5::Group qckGroup = qckFile.openGroup(hdu);
            if (request->uuid().empty()) {
                return {grpc::StatusCode::INVALID_ARGUMENT, "No UUID present"};
            }

            if (hdf5_files.find(request->uuid()) == hdf5_files.end()) {
                return {grpc::StatusCode::NOT_FOUND, fmt::format("No file with UUID {}", request->uuid())};
            }
            Hdf5_File &h5file = hdf5_files[request->uuid()];

            FileInfo *fileInfo = response->mutable_file_info();
            FileInfoExtended *extendedFileInfo = response->mutable_file_info_extended();
            
            fileInfo->set_name(h5file._file.getFileName());
            int fileSize = h5file._file.getFileSize();     
            fileInfo->set_size(fileSize);

            int numAttrs = h5file._group.getNumAttrs();
            for (int i = 0; i < numAttrs; i++) {
                H5::Attribute attr = h5file._group.openAttribute(i);
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

        std::cout << "Reading Region" << std::endl;
        std::vector<float> result;

        std::vector<hsize_t> h5_start;
        std::vector<hsize_t> h5_count;

        hsize_t result_size = 1;

        std::vector<hsize_t> start(request->start().begin(), request->start().end());
        std::vector<hsize_t> count(request->count().begin(), request->count().end());
  
        Hdf5_File &h5file = hdf5_files[request->uuid()];

        H5::DataSet dataset = h5file._group.openDataSet("DATA");  
  
        auto data_space = dataset.getSpace();

        int _N = data_space.getSimpleExtentNdims();

        for (int d = 0; d < _N; d++)
        {

            h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
            h5_count.insert(h5_count.begin(), d < start.size() ? count[d] : 1);

            result_size *= d < start.size() ? count[d]: 1;
            // result_size *= end[d] - start[d];
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
            response->add_region(value);
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
        const hsize_t num_pixels = request->numpixels();
        
        Hdf5_File &h5file = hdf5_files[request->uuid()];

        //Possible add perm group to struct
        auto sGroup = std::chrono::high_resolution_clock::now();
        H5::Group permGroup = h5file._group.openGroup("PermutedData");
        auto eGroup = std::chrono::high_resolution_clock::now();
        auto gDuration = std::chrono::duration_cast<std::chrono::milliseconds>( eGroup - sGroup);
        std::cout << "Group Time: "<< gDuration.count() << " milliseconds" << std::endl;

        auto sData = std::chrono::high_resolution_clock::now();
        H5::DataSet dataset = permGroup.openDataSet("ZYXW");
        auto eData = std::chrono::high_resolution_clock::now();
        auto dDuration = std::chrono::duration_cast<std::chrono::milliseconds>( eData - sData);
        std::cout << "Dataset Time: "<< dDuration.count() << " milliseconds" << std::endl;

        //For ZYXW {W,X,Y,Z} For XYZW {W,Z,Y,X}
        RegionType regionType = request->regiontype();
        if (regionType == RegionType::POINT){
            std::cout << ">> Performing Single Point Spectral Profile" << std::endl;

            std::vector<hsize_t> start = {0,x,y,z};
            std::vector<hsize_t> dimCounts = {1,1,1,num_pixels};

            result = H5Service::readRegion(dataset,dimCounts,start,num_pixels);
 

            for (float value : result)
            {
                response->add_data(value);
            }

        }
        else if (regionType == RegionType::LINE || regionType == RegionType::RECTANGLE){
            std::cout << ">> Performing Multi Point Rectangle Spectral Profile " << std::endl;
            const hsize_t width = request->width();
            const hsize_t height = request->height();
            
            std::vector<hsize_t> start = {0,x,y,z};
            std::vector<hsize_t> dimCounts = {1,width,height,num_pixels};
            
            auto sRead = std::chrono::high_resolution_clock::now();
            result = H5Service::readRegion(dataset,dimCounts,start,num_pixels*width*height);
            auto eRead = std::chrono::high_resolution_clock::now();
            auto dRead = std::chrono::duration_cast<std::chrono::milliseconds>( eRead - sRead);
            std::cout << "Read time: "<< dRead.count() << " milliseconds" << std::endl;

            auto sSpec = std::chrono::high_resolution_clock::now();
            std::vector<float> spectralProfile(num_pixels);
            int offset = num_pixels*height;
            for (int z = 0; z < num_pixels; z++) {
                int count = 0;
                float sum = 0; 
                for (int x = 0; x < width; x++) {
                    int index = z + x * offset;
                    for (int y = 0; y < height; y++) {

                        const auto value = result[index];
                        if (std::isfinite(value)) {
                            sum += value;
                            count++;
                        }
                        index += num_pixels;
                    }
                }
                const float channel_mean = count > 0 ? sum / count : NAN;
                // spectralProfile.at(z) = channel_mean;
                response->add_data(channel_mean);
            }   
            auto eSpec = std::chrono::high_resolution_clock::now();
            auto dSpec = std::chrono::duration_cast<std::chrono::milliseconds>( eSpec- sSpec);
            std::cout << "Average time: "<< dSpec.count() << " milliseconds" << std::endl;
        }
        else if (regionType == RegionType::CIRCLE){
            std::cout << ">> Performing Multi Point Circle Spectral Profile" << std::endl;
            const hsize_t width = request->width();
            const hsize_t height = request->height();

            //Assuming width and height == for perfect circle
            std::vector<hsize_t> start = {0,x,y,z};
            std::vector<hsize_t> dimCounts = {1,width,height,num_pixels};
            result = H5Service::readRegion(dataset,dimCounts,start,num_pixels*width*height);

            std::vector<float> spectralProfile(num_pixels);
            std::vector<std::vector<bool>> mask = getMask(regionType,width);
            int offset = num_pixels*height;
            for (int z = 0; z < num_pixels; z++) {
                int count = 0;
                float sum = 0; 
                for (int x = 0; x < width; x++) {
                    int index = z + x * offset;    
                    for (int y = 0; y < height; y++) {
                        //if point is inside the circle
                        if (mask[x][y]){
                            const auto value = result[index];
                            if (std::isfinite(value)) {
                                sum += value;
                                count++;
                            }

                        }
                        index += num_pixels;
                    }
                }
                const float channel_mean = count > 0 ? sum / count : NAN;
                // spectralProfile.at(z) = channel_mean;
                response->add_data(channel_mean);
            }   
        }
        std::cout << "<< Spectral Profile Complete" << std::endl;
        return grpc::Status::OK;
    };

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
                std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else if (attrType.getClass() == H5T_FLOAT) {
                double value;
                attr.read(attrType, &value);
                std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else if (attrType.getClass() == H5T_STRING) {
                std::string value;
                attr.read(attrType, value);
                std::cout << "Attribute name: " << attrName << ", value: " << value << std::endl;
            } else {
                std::cout << "Attribute name: " << attrName << " has an unsupported data type." << std::endl;
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

