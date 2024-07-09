#include <grpcpp/grpcpp.h>
#include "H5ReaderServices.grpc.pb.h"

#include <iostream>
#include <memory>
#include <string>

void RunClient(const std::string& user) {
    auto channel = grpc::CreateChannel("localhost:50051", grpc::InsecureChannelCredentials());
    std::unique_ptr<H5ReaderServices::Greeter::Stub> stub_ = H5ReaderServices::Greeter::NewStub(channel);

    H5ReaderServices::HelloRequest request;
    request.set_name(user);

    H5ReaderServices::HelloReply reply;
    grpc::ClientContext context;

    grpc::Status status = stub_->SayHello(&context, request, &reply);

    if (status.ok()) {
        std::cout << "Greeter received: " << reply.message() << std::endl;
    } else {
        std::cerr << "RPC failed" << std::endl;
    }
}

int main(int argc, char** argv) {
    std::string user("world");
    if (argc > 1) {
        user = argv[1];
    }
    RunClient(user);
    return 0;
}
