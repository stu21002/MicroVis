#ifndef READERSERVICE_H
#define READERSERVICE_H
//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus
#include <./../proto/FitsReaderService.grpc.pb.h>
#include <./../proto/FitsReaderService.pb.h>
#include <fitsio.h>

using namespace proto;
class ReaderService final : public FitsReaders::Service {
 protected:
  std::unordered_map<std::string, fitsfile*> fits_files;
  int port;
 public:
ReaderService ( int port);
  virtual ::grpc::Status CheckStatus(::grpc::ServerContext* context, const ::Empty* request,
                                     ::StatusResponse* response) override;

  virtual ::grpc::Status OpenFile(grpc::ServerContext* context, const::OpenFileRequest* request,
                              ::StatusResponse* response) override;
                                  
  virtual grpc::Status CloseFile(grpc::ServerContext* context, const::FileCloseRequest* request,
                              ::StatusResponse* response) override;

  virtual ::grpc::Status GetFileInfo(::grpc::ServerContext* context, const ::FileInfoRequest* request,
                                     ::FileInfoResponse* response) override;

  virtual ::grpc::Status GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request,
                                      ::grpc::ServerWriter< ::ImageDataResponse>* writer) override;
   

  virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileResponse* response) override;

  virtual  void ServicePrint(std::string msg);
  virtual std::vector<bool> getMask(RegionInfo region_info,int startX,int startY,int numX, int numY);

};

#endif  // READERSERVICE_H
