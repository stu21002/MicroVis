#include <iostream>
#include <memory>
#include <string>
#include <cmath>
#include <chrono>

#include <grpcpp/grpcpp.h>
#include <./../proto/SpectralProfileService.grpc.pb.cc>
#include <./../proto/SpectralProfileService.pb.h>
#include <./../proto/FileService.grpc.pb.cc>
#include <./../proto/FileService.pb.h>

using grpc::Channel;
using grpc::ClientContext;
using grpc::Status;
using grpc::ClientReader;
using proto::FileService;
using proto::ImageDataRequest;
using proto::ImageDataResponse;

using namespace grpc;
using namespace proto;


//Connection to readerService
class FileSerivceClient {
 public:

    SpectralServiceResponse getImageData(const std::string& end_server_address,const string uuid, const RegionInfo region_info, const int depth,const bool hasPerm) {
    auto channel = grpc::CreateChannel(end_server_address, grpc::InsecureChannelCredentials());
    std::unique_ptr<proto::FileService::Stub> stub = proto::FileService::NewStub(channel);

    ClientContext context;
    
    // Initialize the stream

    // Process the stream of ImageDataResponse objects
    int counter = 0;

    auto tempWidth = region_info.controlpoints()[1].x()/2.0;
    auto tempHeight = region_info.controlpoints()[1].y()/2.0;  

    const int startingX = ceil(region_info.controlpoints()[0].x() - tempWidth);
    const int startingY = ceil(region_info.controlpoints()[0].y() - tempHeight);
    const int endingX = floor(region_info.controlpoints()[0].x()  + tempWidth);
    const int endingY = floor(region_info.controlpoints()[0].y()  + tempHeight);
    const int width = endingX-startingX+1;
    const int height = endingY-startingY+1;

    ImageDataRequest request;
    request.set_uuid(uuid);
    request.add_start(startingX);
    request.add_start(startingY);
    request.add_start(0);
    request.add_start(0);
    request.add_count(width);
    request.add_count(height);
    request.add_count(depth);
    request.add_count(1);
    request.set_perm_data(hasPerm);

    ImageDataResponse response;
    std::unique_ptr<ClientReader<ImageDataResponse>> reader(stub->GetImageDataStream(&context, request));

 
    int currentDepth = 0;
    int currentHeight = 0;
    int currentWidth = 0;

    std::vector<float> sum(depth,0);
    std::vector<int> count(depth,0);
    if (hasPerm){
      std::cout<<"Perm data Calculation"<<std::endl;

      while (reader->Read(&response)) {
        
          // std::cout << "Received chunk of size: " << response.raw_values_fp32().size() << " bytes" << std::endl;
          int index = 0;
          int num_pixels = response.raw_values_fp32().size()/sizeof(float);
          std::vector<float> values(num_pixels);
          memcpy(values.data(),response.raw_values_fp32().data(),values.size()*sizeof(float));
          
          while (index<num_pixels)
          {
            if (currentDepth >= depth){
              //reset/next co-ords
              currentDepth=0;
              
              //for mask
              currentHeight++;
              if (currentHeight == height){
                currentWidth++;
                currentHeight=0;
              }
            }
            const float value = values[index++];
              if (std::isfinite(value)){
                sum[currentDepth] += value;
                count[currentDepth]++;
                currentDepth++;
              } 
          }
      }

      SpectralServiceResponse spectral_response;
      spectral_response.mutable_raw_values_fp32()->resize(depth*sizeof(float));
      float* spectral_profile = reinterpret_cast<float*>(spectral_response.mutable_raw_values_fp32()->data());

      for (size_t i = 0; i < depth; i++)
      {
        spectral_profile[i] = sum[i]/count[i]; 
      }

      Status status = reader->Finish();

      if (!status.ok()) {
        std::cerr << "gRPC stream failed: " << status.error_message() << std::endl;
      }


      return spectral_response;
    }
    else{
      std::cout<<"Fits Data Calculation"<<std::endl;
     
      SpectralServiceResponse spectral_response;
      spectral_response.mutable_raw_values_fp32()->resize(depth*sizeof(float));
      float* spectral_profile = reinterpret_cast<float*>(spectral_response.mutable_raw_values_fp32()->data());
      
      while (reader->Read(&response)) {
      
        std::cout << "Received chunk of size : " << response.raw_values_fp32().size() << " bytes" << std::endl;

        int num_pixels = response.raw_values_fp32().size()/sizeof(float);
        std::vector<float> values(num_pixels);
        memcpy(values.data(),response.raw_values_fp32().data(),values.size()*sizeof(float));
       
        int index = 0;

        while (index<num_pixels)
        {

          if (currentWidth >= width){
            //reset/next co-ords
            currentWidth=0;
            
            //for mask
            currentHeight++;
            if (currentHeight >= height){

              spectral_profile[currentDepth]=sum[currentDepth]/count[currentDepth];
              currentDepth++;
              currentHeight=0;         
            }

          }
          const float value = values[index++];
            if (std::isfinite(value)){
              sum[currentDepth] += value;
              count[currentDepth]++;
          } 
          currentWidth++;
        }
      }

      // for (size_t i = 0; i < 5; i++)
      // {
      //  std::cout<<spectral_profile[i]<<std::endl;
      // }
      Status status = reader->Finish();

      if (!status.ok()) {
        std::cerr << "gRPC stream failed: " << status.error_message() << std::endl;
      }

      
      return spectral_response;
    }
  }

 private:
//   std::unique_ptr<FileSerivce::Stub> stub_;
};

//Connection from Ingres
class SpectralServiceImpl final : public SpectralService::Service {
 public:
  // Handles the GetSpectralProfile request by forwarding it to the end server
  Status GetSpectralProfile(ServerContext* context, const SpectralServiceRequest* request, SpectralServiceResponse* reply) override {
    // Forward the request to the end server via the client
    FileSerivceClient client;
    ImageDataRequest data_request;
    data_request.set_uuid(request->uuid());
    
    auto begin = std::chrono::high_resolution_clock::now();
    *reply = client.getImageData("0.0.0.0:8079",request->uuid(),request->region_info(),request->depth(),request->has_perm_data());
    auto end = std::chrono::high_resolution_clock::now();
    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);

      
    std::cout<<duration1.count()<<std::endl;
    
    return Status::OK;
  }

 private:
//   SpectralServiceClient client_;
};

void RunServer() {
  std::string server_address("0.0.0.0:8078"); // Address for the middle server
  // std::string end_server_address("localhost:50052"); // Address of the end server

  SpectralServiceImpl service;

  ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<Server> server(builder.BuildAndStart());
  std::cout << "Middle server listening on " << server_address << std::endl;

  server->Wait();
}

int main(int argc, char** argv) {
  RunServer();
  return 0;
}
