#include <grpcpp/grpcpp.h>
#include "../proto/stream.grpc.pb.h"
#include "../proto/stream.pb.h"
#include <vector>
#include <cstdlib>
#include <ctime>

class StreamerService final : public Streamer::Service{
    virtual ::grpc::Status getNums(::grpc::ServerContext* context, const ::StreamRequest* request, ::grpc::ServerWriter< ::StreamResponse2>* writer){
        int x = request->x();
        int y = request->y();
        int size = x*y;
        std::vector<int> values(size);
        std::srand(std::time(0));
        for (size_t i = 0; i < size; i++)
        {
           values[i] = std::rand()%100;
        //    std::cout<<values[i]<<" ";

        }
        int offset = 0;
        std::cout<<x<< " "<< y << " " << size <<std::endl;
        for (size_t i = 0; i < x; i++)
        {
            ::StreamResponse2 response;
            for (size_t j = 0; j < y; j++)
            {
                
                response.add_val(values[offset+j]);
                std::cout<<offset+j<< " ";
            }
            // std::cout<<std::endl;
            offset += y;
            response.set_progress(offset/(float)size);
            
            writer->Write(response);


        }
        

        return ::grpc::Status::OK;
    }
    virtual ::grpc::Status getNums2(::grpc::ServerContext* context, const ::StreamRequest* request, ::StreamResponse2* response){
       int x = request->x();
        int y = request->y();
        int size = x*y;
        // std::cout<<size<<std::endl;
        std::vector<int> values(size);
        std::srand(std::time(0));
        for (size_t i = 0; i < size; i++)
        {
           response->add_val(std::rand()%100);
        }
        
        return ::grpc::Status::OK;
    }
};

void RunServer() {
    std::string server_address("0.0.0.0:9999");
    StreamerService service;

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