#include <grpcpp/grpcpp.h>
#include "proto/contouring.grpc.pb.h"
#include "proto/contouring.pb.h"

#include <H5Cpp.h>
#include <chrono>

#include "Contouring.h"

void ContourCallback(double scale, double offset, const std::vector<float> &partial_vertex_data, const std::vector<int> &partial_index_data)
    {
        // std::cout << "Scale: " << scale << ", Offset: " << offset << std::endl;
        // std::cout << "Partial vertex data size: " << partial_vertex_data.size() << std::endl;
        // std::cout << "Partial index data size: " << partial_index_data.size() << std::endl;
    }

class ProcessingImpl : public ContourServices::Service {
::grpc::Status computeContour(::grpc::ServerContext* context, const ::ContouringEmpty *request, ::ContouringOutput *response){
    std::cout << "Called!" << std::endl;

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

        std::vector<double> levels = {-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03};

        std::vector<std::vector<float>> vertex_data;
        std::vector<std::vector<int32_t>> index_data;

        int chunk_size = 100;

        carta::ContourCallback callback = ContourCallback;

        auto start = std::chrono::high_resolution_clock::now();

        carta::TraceContours(slice_buffer.data(), static_cast<int>(height), static_cast<int>(width), 1.0, 0.0, levels, vertex_data, index_data, chunk_size, callback);

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> duration = end - start;
        std::cout << "TraceContours took " << duration.count() << " seconds." << std::endl;

        response->set_value("Contour processing complete");

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
    std::cout << "Contouring Service Ready on " << server_address << std::endl;

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