#ifndef READERSERVICE_H
#define READERSERVICE_H

#include <./../fits_proto/FitsReaderService.grpc.pb.h>
#include <./../fits_proto/FitsReaderService.pb.h>
#include <fitsio.h>

using namespace fits_proto;
class ReaderService final : public FitsReaders::Service {
 protected:
  std::unordered_map<std::string, fitsfile*> fits_files;
  int port;
 public:
ReaderService ( int port);
  virtual ::grpc::Status CheckStatus(::grpc::ServerContext* context, const ::fits_proto::Empty* request,
                                     ::fits_proto::StatusResponse* response) override;

  virtual ::grpc::Status OpenFile(grpc::ServerContext* context, const fits_proto::OpenFileRequest* request,
                                  fits_proto::StatusResponse* response) override;
                                  
  virtual grpc::Status CloseFile(grpc::ServerContext* context, const fits_proto::FileCloseRequest* request,
                                 fits_proto::StatusResponse* response) override;

  virtual ::grpc::Status GetFileInfo(::grpc::ServerContext* context, const ::fits_proto::FileInfoRequest* request,
                                     ::fits_proto::FileInfoResponse* response) override;

  virtual ::grpc::Status GetImageDataStream(::grpc::ServerContext* context, const ::fits_proto::ImageDataRequest* request,
                                      ::grpc::ServerWriter< ::ImageDataResponse>* writer) override;
   

  virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::fits_proto::SpectralProfileReaderRequest* request, ::fits_proto::SpectralProfileResponse* response) override;

  virtual  void ServicePrint(std::string msg);


};

#endif  // READERSERVICE_H
