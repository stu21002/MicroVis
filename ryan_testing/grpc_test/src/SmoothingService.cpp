#include <grpcpp/grpcpp.h>
#include "proto/smoothing.grpc.pb.h"
#include "proto/smoothing.pb.h"

#include <H5Cpp.h>
#include <chrono>

#include "Smoothing.h"

class ProcessingImpl : public SmoothingServices::Service {
::grpc::Status computeGuassianBlur(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){
    std::cout << "Called GuassianBlur" << std::endl;

    std::string fileName = "/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/Big.hdf5";
        std::string datasetName = "DATA";                                                                  

        H5::H5File file = H5::H5File(fileName, H5F_ACC_RDONLY);
        H5::Group group = file.openGroup("0");

        // Open the dataset
        H5::DataSet dataset = group.openDataSet(datasetName);

        // Get the dataspace of the dataset
        H5::DataSpace dataspace = dataset.getSpace();

        // Get the dimensions of the dataset
        hsize_t dims[4];
        dataspace.getSimpleExtentDims(dims, NULL);
        int64_t dim1 = dims[0];
        int64_t dim2 = dims[1];
        int64_t width = dims[2];
        int64_t height = dims[3];

        int target_slice = 1;

        hsize_t slice_dims[2] = {static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
        H5::DataSpace memspace(2, slice_dims);

        // Create a buffer to hold the data for the entire slice
        std::vector<float> slice_buffer(width * height);

        // Define hyperslab in the dataset
        hsize_t offset[4] = {0, static_cast<hsize_t>(target_slice), 0, 0};
        hsize_t count[4] = {1, 1, static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
        dataspace.selectHyperslab(H5S_SELECT_SET, count, offset);

        try {
            dataset.read(slice_buffer.data(), H5::PredType::NATIVE_FLOAT, memspace, dataspace);
        } catch (H5::Exception& e) {
            std::cerr << "HDF5 error: " << e.getCDetailMsg() << std::endl;
            return grpc::Status(grpc::StatusCode::INTERNAL, "HDF5 read error");
        }

    int smoothing_factor = 3;
    
    int mask_size = (smoothing_factor - 1) * 2 + 1;
    int64_t kernel_width = (mask_size - 1) / 2;

    int64_t source_width = 10;
    int64_t source_height = 10;
    int64_t dest_width = width - (2 * kernel_width);
    int64_t dest_height = height - (2 * kernel_width);
    std::unique_ptr<float[]> dest_array(new float[dest_width * dest_height]);

    auto start = std::chrono::high_resolution_clock::now();

    carta::GaussianSmooth(slice_buffer.data(), dest_array.get(), source_width, source_height, dest_width, dest_height, smoothing_factor);

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> duration = end - start;
    std::cout << "GaussianSmooth took " << duration.count() << " seconds." << std::endl;

    std::cout << "Completed" << std::endl;

    response->set_value("Completed Guassian Blur");

    return grpc::Status::OK;
}

::grpc::Status computeBlockSmoothing(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){
    std::cout << "Called Block Smoothing" << std::endl;

    response->set_value("Completed Block Smoothing");

    return grpc::Status::OK;
}   
};
void StartServer(int port){
    std::string server_address = "0.0.0.0:" + std::to_string(port);
    ProcessingImpl service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Smoothing Service Ready on " << server_address << std::endl;

    server->Wait();
}

int main(int argc, char** argv){
    if(argc != 2){
        std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
        return 1;
    }

    int port = std::stoi(argv[1]);
    StartServer(port);

    return 0;
}