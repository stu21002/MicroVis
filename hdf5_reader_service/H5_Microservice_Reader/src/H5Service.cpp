#include "H5Service.h"

#include <grpcpp/grpcpp.h>
#include "proto/H5ReaderService.grpc.pb.h"
#include "proto/H5ReaderService.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector>
#include <cstdlib>



    grpc::Status H5Service::CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response)
    {
        std::cout << "Checking Status" << std::endl;
        response->set_status(true);
        response->set_statusmessage("OK");
        return grpc::Status::OK;
    }

    // CHANGE: According to docs, only open groups and dataset at last miniute and close early.
    grpc::Status H5Service::OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response)
    {

        try
        {
            std::cout << "Opening file" << std::endl;
            _file= H5::H5File("./files/" + request->filename(), H5F_ACC_RDONLY);
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
            response->set_statusmessage(request->filename() + " has been opened.");
            response->set_status(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_status(false);
        }

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
            H5::H5File qckFile = H5::H5File("./files/" + request->filename(), H5F_ACC_RDONLY);
            int fileSize = qckFile.getFileSize();
            H5::Group qckGroup = qckFile.openGroup("0");
            int numAttrs = qckGroup.getNumAttrs();
            // // Iterate through each attribute
            for (int i = 0; i < 32; i++) {
                std::cout<< i << std::endl;
                std::cout<<std::endl;   
                // Open the attribute
                H5::Attribute attr = qckGroup.openAttribute(i);
                
                // Get the name of the attribute
                std::string attrName = attr.getName();
                std::cout<<attrName<<std::endl;        
 
 
                // Handle other types as needed
            }
            response->set_success(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_success(false);
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
        std::vector<hsize_t> end(request->end().begin(), request->end().end());


        _group = _file.openGroup("0");
        _dataset = _group.openDataSet("DATA");
        auto data_space = _dataset.getSpace();
        _N = data_space.getSimpleExtentNdims();

        for (int d = 0; d < _N; d++)
        {

            h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
            h5_count.insert(h5_count.begin(), d < start.size() ? end[d] - start[d] : 1);

            result_size *= d < start.size() ? end[d] - start[d] : 1;
            // result_size *= end[d] - start[d];
        }

        for (int value : h5_count )
        {
            std::cout << value << " ";
        }
        std::cout << std::endl;

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

    const hsize_t width =request->width();
    const hsize_t height = request->height();
    const hsize_t num_pixels = request->numpixels();
    const hsize_t total_pixels = width*height*num_pixels;
   
    _group = _file.openGroup("0");
    H5::Group _secondaryGroup = _group.openGroup("PermutedData");
    _dataset = _secondaryGroup.openDataSet("ZYXW");
    H5::DataSpace data_space = _dataset.getSpace();


    if (width == 1 && height == 1) {
        
        std::cout << "Performing Single Point Spectral Profile" << std::endl;
        //Takes in from order of least change...
        std::vector<hsize_t> h5_start = {0,static_cast<hsize_t>(request->x()) , static_cast<hsize_t>(request->y()), static_cast<hsize_t>(request->z())};
        std::vector<hsize_t> h5_count = {1, 1, 1, num_pixels};

        result.resize(total_pixels);
        H5::DataSpace mem_space(1, &total_pixels);
        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
        _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        
 

        for (float value : result)
        {
            response->add_data(value);
        }
        
        mem_space.close();
    } else {
        std::cout << "Performing Multi Point Spectral Profile" << std::endl;

        std::vector<hsize_t> h5_start = {0, static_cast<hsize_t>(request->x()), static_cast<hsize_t>(request->y()), static_cast<hsize_t>(request->z())};
        std::vector<hsize_t> h5_count = {1, width, height, num_pixels};

        
        result.resize(total_pixels);
        H5::DataSpace mem_space(1, &total_pixels);
        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
        _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        std::vector<float> spectralProfile(num_pixels);
        int offset = num_pixels*height;
        for (int z = 0; z < num_pixels; ++z) {
            int count = 0;
            float sum = 0; 
            for (int x = 0; x < width; ++x) {
                int index = z + x * offset;
                for (int y = 0; y < height; ++y) {

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
        mem_space.close();
    }
    
    data_space.close();
    _dataset.close();
    _secondaryGroup.close();
    _group.close();
    return grpc::Status::OK;
};

