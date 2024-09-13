#ifndef H5SERVICE_H
#define H5SERVICE_H

#include <grpcpp/grpcpp.h> 
#include "./../proto/H5ReaderService.grpc.pb.h"
#include "./../proto/H5ReaderService.pb.h"
#include <H5Cpp.h>
#include <vector>

using namespace proto;


// Class for HDF5 Reader inheriting from the gRPC service definition

class H5Service final : public H5Readers::Service
{
    

    protected:
        struct Hdf5_File {
            H5::H5File _file;
            H5::Group _group;
        };
    
        std::unordered_map<std::string, Hdf5_File> hdf5_files;
        int port;

    public:
        //Constuctor initializing to a port
        H5Service ( int port);

        //gRPC services
        virtual ::grpc::Status CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response);
        virtual ::grpc::Status OpenFile(::grpc::ServerContext *context, const ::OpenFileRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response);
        virtual ::grpc::Status GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request, ::grpc::ServerWriter< ::ImageDataResponse>* writer);
        virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileReaderResponse* response);
        virtual ::grpc::Status GetHistogram(::grpc::ServerContext* context, const ::HistogramRequest* request, ::HistogramResponse* response);

        //Method for file info
        void appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr);
        //Method for printing
        void ServicePrint(std::string msg);

        std::vector<bool> getMask(RegionInfo region_info,int startX,int startY,int numX, int numY);

};

#endif  //H5SERVICE_H
