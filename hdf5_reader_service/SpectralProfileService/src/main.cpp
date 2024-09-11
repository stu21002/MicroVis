#include <grpcpp/grpcpp.h>
#include "Service/SpectralProfileService.h"
#include <fmt/core.h> 
#include <cstdio> 

int main(int argc, char** argv) {
     
    int port = argc > 1 ? std::stoi(argv[1]) : 8078;
    std::string server_address = fmt::format("localhost:{}", port);

  SpectralServiceImpl service(port);

  grpc::ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
  std::cout << "["<<port<<"] Spectral Service Running" << std::endl;

  server->Wait();
    return 0;
}