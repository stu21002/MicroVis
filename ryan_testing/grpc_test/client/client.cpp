#include <grpcpp/grpcpp.h>
#include "helloworld.grpc.pb.h"
#include "helloworld.pb.h"

#include <iostream>
#include <memory>
#include <string>

void RunClient(const std::string& user) {
    std::string target_str = "localhost:50051";
    auto channel = grpc::CreateChannel(target_str, grpc::InsecureChannelCredentials());
    std::unique_ptr<helloworld::Greeter::Stub> stub_ = helloworld::Greeter::NewStub(channel);

    helloworld::HelloRequest request;
    request.set_name(user);

    helloworld::HelloReply reply;
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
