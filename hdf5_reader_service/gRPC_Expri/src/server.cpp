#include <grpcpp/grpcpp.h>
#include "proto/hello.grpc.pb.h"
#include "proto/hello.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector> 

class H5Service : public H5ReaderService::Service {
H5::H5File _file;
int _N;

::grpc::Status CheckStatus(::grpc::ServerContext* context, const ::Empty* request, ::StatusResponse* response){
    response->set_status(true);
    response->set_statusmessage("OK");
    return grpc::Status::OK;
}

::grpc::Status OpenFile(::grpc::ServerContext* context, const ::FileOpenRequest* request, ::StatusResponse* response){
    
    try
        {
            std::string s = "./files/";
            std::cout << request->filename() << std::endl;
                    
            std::cout << s+request->filename() << std::endl;  
        	_file = H5::H5File(request->filename(),H5F_ACC_RDONLY);
            response->set_status(true);
        }
        catch(const H5::Exception& e)
        {
        	std::cerr << e.getCDetailMsg() << '\n';
        	response->set_status(false);
        }
        
    return grpc::Status::OK;
}
::grpc::Status CloseFile(::grpc::ServerContext* context, const ::FileCloseRequest* request, ::StatusResponse* response){
    return grpc::Status::OK;
};
::grpc::Status GetFileInfo(::grpc::ServerContext* context, const ::FileInfoRequest* request, ::FileInfoResponse* response){
    return grpc::Status::OK;
};
};


int main(){
    H5Service service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort("0.0.0.0:9999", grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    
    std::cout << "Server Running!" << std::endl;
    // char cwd[PATH_MAX];
    // if (getcwd(cwd, sizeof(cwd)) != nullptr) {
    //     std::cout << "Current working directory: " << cwd << std::endl;
    // } else {
    //     perror("getcwd() error");
    // }

    server->Wait(); 
    return 0;
}