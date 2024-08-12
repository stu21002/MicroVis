#include <grpcpp/grpcpp.h>
#include "proto/contouring.grpc.pb.h"
#include "proto/contouring.pb.h"

#include <H5Cpp.h>
#include <chrono>

#include "Contouring.h"

void ContourCallback(double level, double progress, const std::vector<float> &partial_vertex_data, const std::vector<int> &partial_index_data)
    {
        static std::map<double, int> vertex_count_map;

        // Add the number of vertices for this callback invocation
        vertex_count_map[level] += partial_vertex_data.size() / 2; // Each vertex has two coordinates (x, y)

        // If the progress is 1.0, we have completed this level
        if (progress == 1.0)
        {
            std::cout << "Level: " << level << " Total Vertices: " << vertex_count_map[level] << std::endl;

            // Optionally, clear the entry for this level if you don't need it afterward
            vertex_count_map.erase(level);
        }
    }

class ProcessingImpl : public ContourServices::Service {
::grpc::Status computeContour(::grpc::ServerContext* context, const ::ContouringEmpty *request, ::ContouringOutput *response){
    //std::cout << "Called Contouring Service" << std::endl;

        //const google::protobuf::RepeatedField<float>& data = request->data();

        int width = request->width();
        int height = request->height();

        auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

        const std::string& raw_values = request->data();

        size_t num_floats = raw_values.size() / sizeof(float);

        std::vector<float> float_values(num_floats);
        std:memcpy(float_values.data(), raw_values.data(), raw_values.size());

        // Convert to std::vector<float>
        //std::vector<float> vectorData(data.begin(), data.end());

        auto conversionToVectorEnd = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> conversionDuration = conversionToVectorEnd - conversionToVectorStart;
        std::cout << "Conversion to vector took " << conversionDuration.count() << " seconds." << std::endl;

        std::vector<double> levels = {-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03};

        std::vector<std::vector<float>> vertex_data;
        std::vector<std::vector<int32_t>> index_data;

        int chunk_size = 100;
        float scale = request->scale();
        float offset = request->offset();

        carta::ContourCallback callback = ContourCallback;

        //std::cout << float_values.size() << std::endl;

        auto start = std::chrono::high_resolution_clock::now();

        carta::TraceContours(float_values.data(), width, height, scale, offset, levels, vertex_data, index_data, chunk_size, callback);

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

    builder.SetMaxSendMessageSize(5 * 1024 * 1024); // 5MB
    builder.SetMaxReceiveMessageSize(15 * 1024 * 1024); // 15MB

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