#ifndef SPECTRALPROFILE_H
#define SPECTRALPROFILE_H

#include <grpcpp/grpcpp.h> 
#include <./../proto/SpectralProfileService.grpc.pb.cc>
#include <./../proto/SpectralProfileService.pb.h>
#include <./../proto/FileService.grpc.pb.cc>
#include <./../proto/FileService.pb.h>
#include <string>

class SpectralServiceClient {
 public:
//   SpectralServiceClient(std::shared_ptr<grpc::Channel> channel);

//   std::string getSpectralProfile(const std::string& user);
//   std::string getSpectralProfilePerm(const std::string& user);

//  private:
//   std::unique_ptr<proto::FileService::Stub> stub_;
};

#endif //SPECTRALPROFILE_H