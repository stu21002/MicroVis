#ifndef SPECTRALPROFILESERVICE_H
#define SPECTRALPROFILESERVICE_H

#include <iostream>
#include <memory>
#include <string>
#include <vector>
#include <cmath>
#include <chrono>
#include <grpcpp/grpcpp.h>
#include "./../proto/SpectralProfileService.grpc.pb.h"
#include "./../proto/SpectralProfileService.pb.h"
#include "./../proto/FileService.grpc.pb.h"
#include "./../proto/FileService.pb.h"

using grpc::Channel;
using grpc::ClientContext;
using grpc::Status;
using grpc::ClientReader;
using proto::FileService;
using proto::ImageDataRequest;
using proto::ImageDataResponse;
using proto::SpectralServiceResponse;
using proto::RegionInfo;

class FileSerivceClient {
 public:

    SpectralServiceResponse getImageData(const std::string& end_server_address, const std::string& uuid, const RegionInfo& region_info, int depth, bool hasPerm);

 private:
    std::vector<bool> getMask(const RegionInfo& region_info);
};

class SpectralServiceImpl final : public proto::SpectralService::Service {
protected:
    int port;

 public:
    SpectralServiceImpl ( int port);

    Status GetSpectralProfile(grpc::ServerContext* context, const proto::SpectralServiceRequest* request, proto::SpectralServiceResponse* reply) override;
    void ServicePrint(std::string msg);

};

#endif // SPECTRALPROFILESERVICE_H
