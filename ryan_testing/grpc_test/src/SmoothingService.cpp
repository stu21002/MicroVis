#include <grpcpp/grpcpp.h>
#include "proto/smoothing.grpc.pb.h"
#include "proto/smoothing.pb.h"

#include "Smoothing.h"

class ProcessingImpl : public SmoothingServices::Service {
::grpc::Status computeGuassianBlur(::grpc::ServerContext* context, const ::Empty *request, ::Output *response){
    std::cout << "Called GuassianBlur" << std::endl;
    
    // Smooth the image from cache
    int mask_size = (2 - 1) * 2 + 1;
    int64_t kernel_width = (mask_size - 1) / 2;

    int64_t source_width = 10;
    int64_t source_height = 10;
    int64_t dest_width = 10 - (2 * kernel_width);
    int64_t dest_height = 10 - (2 * kernel_width);
    std::unique_ptr<float[]> dest_array(new float[dest_width * dest_height]);

    std::vector<float> image(10 * 10);
        for (int i = 0; i < 10 * 10; ++i) {
            image[i] = static_cast<float>(i); // Simulated data filling
        }

    carta::GaussianSmooth(image.data(), dest_array.get(), source_width, source_height, dest_width, dest_height, 2);

    std::cout << "Completed" << std::endl;

    response->set_value("Completed Guassian Blur");

    return grpc::Status::OK;
}

::grpc::Status computeBlockSmoothing(::grpc::ServerContext* context, const ::Empty *request, ::Output *response){
    std::cout << "Called Block Smoothing" << std::endl;

    response->set_value("Completed Block Smoothing");

    return grpc::Status::OK;
}   
};

int main(){
    ProcessingImpl service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort("0.0.0.0:9998", grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Smoothing Service Ready" << std::endl;

    server->Wait();

    return 0;
}