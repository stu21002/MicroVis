#include <grpcpp/grpcpp.h>
#include "proto/contouring.grpc.pb.h"
#include "proto/contouring.pb.h"

#include <H5Cpp.h>

#include "Contouring.h"

void ContourCallback(double scale, double offset, const std::vector<float> &partial_vertex_data, const std::vector<int> &partial_index_data)
    {
        std::cout << "Scale: " << scale << ", Offset: " << offset << std::endl;
        std::cout << "Partial vertex data size: " << partial_vertex_data.size() << std::endl;
        std::cout << "Partial index data size: " << partial_index_data.size() << std::endl;
    }

class ProcessingImpl : public ContourServices::Service {
::grpc::Status computeContour(::grpc::ServerContext* context, const ::ContouringEmpty *request, ::ContouringOutput *response){
    std::cout << "Called!" << std::endl;

    std::string fileName = "/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/example.hdf5"; // Correct the path as needed
        std::string datasetName = "DATA";                                                                  // Replace with the actual dataset name

        // Open the HDF5 file
        H5::H5File file = H5::H5File(fileName, H5F_ACC_RDONLY);
        H5::Group group = file.openGroup("0");

        // Open the dataset
        H5::DataSet dataset = group.openDataSet(datasetName);

        // Get the dataspace of the dataset
        H5::DataSpace dataspace = dataset.getSpace();

        // Get the dimensions of the dataset
        hsize_t dims[2];
        dataspace.getSimpleExtentDims(dims, NULL);
        int64_t width = dims[1];
        int64_t height = dims[0];

        // Create a buffer to hold the data
        std::vector<float> image(width * height);

        // Read the data into the buffer
        dataset.read(image.data(), H5::PredType::NATIVE_FLOAT);

        // std::vector<float> image(10 * 10);
        //     for (int i = 0; i < 10 * 10; ++i) {
        //         image[i] = static_cast<float>(i); // Simulated data filling
        //     }

        // Define contour levels
        std::vector<double> levels = {0.1, 0.2, 0.3};

        // Containers for the results
        std::vector<std::vector<float>> vertex_data;
        std::vector<std::vector<int32_t>> index_data;

        // Define a chunk size
        int chunk_size = 1;

        // Define a callback function
        carta::ContourCallback callback = ContourCallback;

        // Call the TraceContours function
        carta::TraceContours(image.data(), 10, 10, 1.0, 0.0, levels, vertex_data, index_data, chunk_size, callback);

    std::string result = "";
    std::string filler = " ";

    for(int i = 0; i < 10 * 10; ++i){
        result += std::to_string(image[i]) + filler;
    }

    response->set_value(result);

    return grpc::Status::OK;
}
};

int main(){
    ProcessingImpl service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort("0.0.0.0:9999", grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Contouring Service Ready" << std::endl;

    server->Wait();

    return 0;
}