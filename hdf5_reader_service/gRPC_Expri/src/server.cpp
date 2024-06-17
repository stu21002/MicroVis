#include <grpcpp/grpcpp.h>
#include "proto/hello.grpc.pb.h"
#include "proto/hello.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector>
#include <math.h>

#include <cstdlib>

class H5Service : public H5ReaderService::Service
{
    H5::H5File _file;
    H5::Group _group;
    H5::DataSet _dataset;
    bool open = false;
    int _N;
    std::vector<hsize_t> _dims;
    hsize_t _stokes, _depth, _height, _width;

    ::grpc::Status CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response)
    {
        response->set_status(true);
        response->set_statusmessage("OK");
        return grpc::Status::OK;
    }

    // CHANGE: According to docs, only open groups and dataset at last miniute and close early.
    ::grpc::Status OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response)
    {

        try
        {
            _file = H5::H5File("./files/" + request->filename(), H5F_ACC_RDONLY);
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
            response->set_status(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_status(false);
        }

        return grpc::Status::OK;
    }

    ::grpc::Status CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response)
    {
        try
        {
            _file.close();
            response->set_status(true);
        }
        catch (const H5::Exception &e)
        {
            std::cerr << e.getCDetailMsg() << '\n';
            response->set_status(false);
        }
        return grpc::Status::OK;
    };
    ::grpc::Status GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response)
    {
        try
        {

            H5::H5File qckFile = H5::H5File("./files/" + request->filename(), H5F_ACC_RDONLY);
            int fileSize = qckFile.getFileSize();
            H5::Group qckGroup = qckFile.openGroup("0");
            H5::DataSet qckdataset = qckGroup.openDataSet("DATA");

            auto qckDataSpace = qckdataset.getSpace();
            int qckN = qckDataSpace.getSimpleExtentNdims();
            std::vector<hsize_t> qckDims;
            qckDims.resize(qckN);
            qckDataSpace.getSimpleExtentDims(qckDims.data(), nullptr);
            std::reverse(qckDims.begin(), qckDims.end());

            response->set_size(fileSize);
            for (int i = 0; i < qckN; i++)
            {
                // std::cout << qckDims[i] << " ";
                response->add_dimensions(qckDims[i]);
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

    ::grpc::Status ReadRegion(::grpc::ServerContext *context, const ::ReadRegionRequest *request, ::ReadRegionResponse *response)
    {
        std::vector<float> result;

        // Starting points in each dimension
        std::vector<hsize_t> h5_start;

        // Number of pixels selected per dimension
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


::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileRequest* request, ::SpectralProfileResponse* response){
 
    std::vector<float> result;

    const hsize_t width =request->width();
    const hsize_t height = request->height();
    const hsize_t num_pixels = request->numpixels();

    // Fancy Response stuff
    // const auto num_bytes = num_pixels * sizeof(float);
    // response->mutable_data()->resize(num_bytes);
    if (width == 1 && height == 1) {

        std::vector<hsize_t> h5_start = {0, static_cast<hsize_t>(request->z()), static_cast<hsize_t>(request->y()), static_cast<hsize_t>(request->x())};
        std::vector<hsize_t> h5_count = {1, num_pixels, 1, 1};

        
        //Read H5 
        std::cout << "Opening them files" << std::endl;

        _group = _file.openGroup("0");
        _dataset = _group.openDataSet("DATA");
        auto data_space = _dataset.getSpace();
        hsize_t newSize = num_pixels * width * height;
        result.resize(newSize);
        H5::DataSpace mem_space(1, &newSize);
        

        for (int value : h5_count )
        {
            std::cout << value << " ";
        }

        std::cout << std::endl;
        data_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
        _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, data_space);
        
        std::cout << "Closing them files" << std::endl;

        data_space.close();
        _dataset.close();
        _group.close();

        for (float value : result)
        {
            response->add_data(value);
        }

    } else {
        // const auto required_buffer_size = _dims[0] * (height-1) + width;
        // std::vector<float> required_buffer(required_buffer_size);

    //    const auto slice_size_pixels = width * height;
    //    std::vector<float> channel_buffer(slice_size_pixels);
        // float* data_ptr = reinterpret_cast<float*>(response->mutable_data()->data());
        std::cout << "Werid stuff here" << std::endl;
        for (auto i = 0; i < request->numpixels(); i++) {
        const auto channel = request->z() + i;

        // std::vector<long> start_pix = {request->x(), request->y(), channel, 1};
        // std::vector<long> last_pix = {request->x() + width - 1, request->y() + height - 1, channel, 1};
        // std::vector<long> increment = {1, 1, 1, 1};

        // Read H5

        int count = 0;
        float sum = 0;
    //      for (const auto& value : channel_buffer) {
    //        if (std::isfinite(value)) {
    //          sum += value;
    //          count++;
    //        }
    //      }

        //Fancy stuff sending to response directly
        // long offset = 0;
        // for (int row = 0; row < height; row++) {
        //     for (int col = 0; col < width; col++) {
        //     const auto value = required_buffer[offset + col];
        //     if (std::isfinite(value)) {
        //         sum += value;
        //         count++;
        //     }
        //     }
        //     offset += dims[0];
        // }


        const float channel_mean = count > 0 ? sum / count : NAN;
        result[i] = channel_mean;
        }
    }

    return grpc::Status::OK;
};
};

int main()
{
    H5Service service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort("0.0.0.0:9999", grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());

    std::cout << "Server Running!" << std::endl;

    server->Wait();
    return 0;
}