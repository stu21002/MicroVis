#include <grpcpp/grpcpp.h>
#include "H5ReaderServices.grpc.pb.h"

#include <iostream>
#include <memory>
#include <string>

class GreeterServiceImpl final : public H5ReaderServices::Greeter::Service {
public:
    grpc::Status SayHello(grpc::ServerContext* context, const H5ReaderServices::HelloRequest* request, H5ReaderServices::HelloReply* reply) override {
        std::string prefix("Hello ");
        reply->set_message(prefix + request->name());
        return grpc::Status::OK;
    }
};

void RunServer() {
    std::string server_address("0.0.0.0:50051");
    GreeterServiceImpl service;

    grpc::ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);
    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Server listening on " << server_address << std::endl;
    server->Wait();
}

int main(int argc, char** argv) {
    RunServer();
    return 0;
}
