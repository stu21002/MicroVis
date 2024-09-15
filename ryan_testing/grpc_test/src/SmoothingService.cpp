#include <grpcpp/grpcpp.h>
#include "proto/smoothing.grpc.pb.h"
#include "proto/smoothing.pb.h"

#include <H5Cpp.h>
#include <chrono>
#include <sstream>

#include "Smoothing.h"

class ProcessingImpl : public SmoothingServices::Service {
::grpc::Status computeGuassianBlur(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){

    auto wholeTimeStart = std::chrono::high_resolution_clock::now();

    auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

    int width = request->width();
    int height = request->height();
    int index = request->index();
    const std::string& raw_values = request->data();

    auto now = std::chrono::system_clock::now();
    
    // Convert it to time since epoch, in milliseconds
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    auto last_six_digits = millis % 1000000;

    // Print the milliseconds
    std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

    auto nowEnd = std::chrono::system_clock::now();

    size_t num_floats = raw_values.size() / sizeof(float);

    std::vector<float> float_values(num_floats);
    std:memcpy(float_values.data(), raw_values.data(), raw_values.size());

    auto conversionToVectorEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> conversionDuration = conversionToVectorEnd - conversionToVectorStart;
    //std::cout << "Conversion to vector took " << conversionDuration.count() << " seconds." << std::endl;

    int smoothing_factor = 4;
    
    int mask_size = (smoothing_factor - 1) * 2 + 1;
    int64_t kernel_width = (mask_size - 1) / 2;

    int64_t source_width = width;
    int64_t source_height = height;
    int64_t dest_width = width - (2 * kernel_width);
    int64_t dest_height = height - (2 * kernel_width);
    //std::unique_ptr<float[]> dest_array(new float[dest_width * dest_height]);
    response->mutable_data()->resize(dest_width * dest_height * sizeof(float));
    float* response_array = reinterpret_cast<float*>(response->mutable_data()->data());

    auto start = std::chrono::high_resolution_clock::now();

    carta::GaussianSmooth(float_values.data(), response_array, source_width, source_height, dest_width, dest_height, smoothing_factor);

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> duration = end - start;
    std::cout << "GaussianSmooth took " << duration.count() << " seconds for index: " << index << std::endl;

    response->set_smoothingfactor(smoothing_factor);
    response->set_dest_width(dest_width);
    response->set_dest_height(dest_height);

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}

::grpc::Status computeBlockSmoothing(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){

    auto wholeTimeStart = std::chrono::high_resolution_clock::now();

    auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

    int width = request->width();
    int height = request->height();
    int index = request->index();
    const std::string& raw_values = request->data();

    auto now = std::chrono::system_clock::now();
    
    // Convert it to time since epoch, in milliseconds
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    auto last_six_digits = millis % 1000000;

    // Print the milliseconds
    std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

    auto nowEnd = std::chrono::system_clock::now();

    size_t num_floats = raw_values.size() / sizeof(float);

    std::vector<float> float_values(num_floats);
    std:memcpy(float_values.data(), raw_values.data(), raw_values.size());

    auto conversionToVectorEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> conversionDuration = conversionToVectorEnd - conversionToVectorStart;
    //std::cout << "Conversion to vector took " << conversionDuration.count() << " seconds." << std::endl;
    
    int smoothing_factor = 4;

    bool mean_filter = true;

    const int x = 0;
    const int y = 0;
    const int req_height = height - y;
    const int req_width = width - x;

    // size returned vector
    size_t num_rows_region = std::ceil((float)req_height / smoothing_factor);
    size_t row_length_region = std::ceil((float)req_width / smoothing_factor);
    //std::unique_ptr<float[]> dest_array(new float[num_rows_region * row_length_region]);
    std::vector<float> dest_array;
    dest_array.resize(num_rows_region * row_length_region);

    response->mutable_data()->resize(row_length_region * num_rows_region * sizeof(float));
    float* response_array = reinterpret_cast<float*>(response->mutable_data()->data());

    int num_image_columns = width;
    int num_image_rows = height;

    auto start = std::chrono::high_resolution_clock::now();

    if (mean_filter && smoothing_factor > 1) {
        // Perform down-sampling by calculating the mean for each MIPxMIP block
        carta::BlockSmooth(
            float_values.data(), response_array, num_image_columns, num_image_rows, row_length_region, num_rows_region, x, y, smoothing_factor);
    } else {
        // Nearest neighbour filtering
        carta::NearestNeighbor(float_values.data(), response_array, num_image_columns, row_length_region, num_rows_region, x, y, smoothing_factor);
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> duration = end - start;
    std::cout << "BlockSmoothing took " << duration.count() << " seconds for index:" << index << std::endl;

    size_t dest_width = ceil(double(width) / smoothing_factor);
    size_t dest_height = ceil(double(height) / smoothing_factor);

    response->set_smoothingfactor(smoothing_factor);
    response->set_dest_width(dest_width);
    response->set_dest_height(dest_height);

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}   
};
void StartServer(int port){
    std::string server_address = "0.0.0.0:" + std::to_string(port);
    ProcessingImpl service;
    grpc::ServerBuilder builder;

    builder.SetMaxSendMessageSize(60 * 1024 * 1024); // 15MB
    builder.SetMaxReceiveMessageSize(60 * 1024 * 1024); // 15MB

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