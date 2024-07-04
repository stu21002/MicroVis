#include <grpcpp/grpcpp.h>
#include "H5Service.h"
#include <fmt/core.h> 
#include <cstdio> 

int main(int argc, char** argv)
{
    int port = argc > 1 ? std::stoi(argv[1]) : 9999;
    H5Service service(port);
    grpc::ServerBuilder builder;
    
    const auto server_address =fmt::format("localhost:{}", port);
    
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << fmt::format("HDF5 Microsrvice Reader, port {} is running", port) << std::endl;
    server->Wait();

    return 0;
}