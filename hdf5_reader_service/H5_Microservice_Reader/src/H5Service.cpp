#include "H5Service.h" 

#include <grpcpp/grpcpp.h>
#include "proto/H5ReaderServices.grpc.pb.h"
#include "proto/H5ReaderServices.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector>
#include <cstdlib>
#include <cmath>



    grpc::Status H5Service::CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response)
    {
        std::cout << "Checking Status" << std::endl;
        response->set_status(true);
        response->set_statusmessage("OK");
        return grpc::Status::OK;
    }

    //TODO include a map for the files
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response)
    {

        try
        {
            std::cout << ">>Opening file" << std::endl;
            _file= H5::H5File("/media/stuart/Elements/" + request->filename(), H5F_ACC_RDONLY);
            // _group = _file.openGroup("0");
            // _dataset = _group.openDataSet("DATA");

            // auto data_space = _dataset.getSpace();
            // _N = data_space.getSimpleExtentNdims();
            // _dims.resize(_N);
            // data_space.getSimpleExtentDims(_dims.data(), nullptr);

            // std::reverse(_dims.begin(), _dims.end());
            // _stokes = _N == 4 ? _dims[3] : 1;
            // _depth = _N >= 3 ? _dims[2] : 1;
            // _height = _dims[1];
            // _width = _dims[0];
            // std::cout << "Width:Height:Depth:Stokes"<< _width << ":"<< _height << ":"<< _depth << ":"<< _stokes << std::endl;
            response->set_statusmessage(request->filename() + " has been opened.");
            response->set_status(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_status(false);
        }
        std::cout<<"<<File has been opened"<<std::endl;
        return grpc::Status::OK;
    }

    grpc::Status H5Service::CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response)
    {

        try
        {
            std::cout << "Closing file" << std::endl;
            _file.close();
            response->set_statusmessage("File has been closed.");
            response->set_status(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_status(false);
        }
        return grpc::Status::OK;
    };
    grpc::Status H5Service::GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response)
    {
        try
        {
            //Relook at this
            std::cout << "Getting file info" << std::endl;
            H5::H5File qckFile = H5::H5File(request->directory()+request->file(), H5F_ACC_RDONLY);
            std::string hdu = !request->hdu().empty()?request->hdu():"0";
            H5::Group qckGroup = qckFile.openGroup(hdu);
            
            FileInfo *fileInfo = response->mutable_file_info();
            FileInfoExtended *extendedFileInfo = response->mutable_file_info_extended();
            
            fileInfo->set_name(request->file());

            int fileSize = qckFile.getFileSize();     
            fileInfo->set_size(fileSize);

            //Put in cases statment
            int numAttrs = qckGroup.getNumAttrs();
            for (int i = 0; i < numAttrs; i++) {
                H5::Attribute attr = qckGroup.openAttribute(i);
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

    grpc::Status H5Service::ReadRegion(::grpc::ServerContext *context, const ::ReadRegionRequest *request, ::ReadRegionResponse *response)
    {
        std::cout << "Reading Region" << std::endl;
        std::vector<float> result;

        std::vector<hsize_t> h5_start;
        std::vector<hsize_t> h5_count;

        hsize_t result_size = 1;

        std::vector<hsize_t> start(request->start().begin(), request->start().end());
        std::vector<hsize_t> count(request->count().begin(), request->count().end());


        _group = _file.openGroup("0");
        _dataset = _group.openDataSet("DATA");    
        auto data_space = _dataset.getSpace();
        _N = data_space.getSimpleExtentNdims();

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
        _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        
        data_space.close();
        _dataset.close();
        _group.close();

        for (float value : result)
        {
            response->add_region(value);
        }

        return grpc::Status::OK;
    };


grpc::Status H5Service::GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileRequest* request, ::SpectralProfileResponse* response){
 
    std::vector<float> result;
    const hsize_t x = request->x();
    const hsize_t y = request->y();
    const hsize_t z = request->z();
    const hsize_t num_pixels = request->numpixels();


    _group = _file.openGroup("0");
    H5::Group _secondaryGroup = _group.openGroup("PermutedData");
    _dataset = _secondaryGroup.openDataSet("ZYXW");
    // H5::DataSpace data_space = _dataset.getSpace();
    
    //For ZYXW {W,X,Y,Z} For XYZW {W,Z,Y,X}
    RegionType regionType = request->regiontype();
    if (regionType == RegionType::POINT){
        std::cout << ">> Performing Single Point Spectral Profile" << std::endl;

        std::vector<hsize_t> start = {0,x,y,z};
        std::vector<hsize_t> dimCounts = {1,1,1,num_pixels};
        result = H5Service::readRegion(_dataset,dimCounts,start,num_pixels);
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
        result = H5Service::readRegion(_dataset,dimCounts,start,num_pixels*width*height);

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
    }
    else if (regionType == RegionType::CIRCLE){
        std::cout << ">> Performing Multi Point Circle Spectral Profile" << std::endl;
        const hsize_t width = request->width();
        const hsize_t height = request->height();

        //Assuming width and height == for perfect circle
        std::vector<hsize_t> start = {0,x,y,z};
        std::vector<hsize_t> dimCounts = {1,width,height,num_pixels};
        result = H5Service::readRegion(_dataset,dimCounts,start,num_pixels*width*height);

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

