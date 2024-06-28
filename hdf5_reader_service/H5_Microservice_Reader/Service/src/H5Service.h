#ifndef H5SERVICE_H
#define H5SERVICE_H

#include <grpcpp/grpcpp.h> 
#include "./../proto/H5ReaderServices.grpc.pb.h"
#include "./../proto/H5ReaderServices.pb.h"
#include <H5Cpp.h>
#include <vector>

using namespace proto;

class H5Service final : public H5ReaderServices::Service
{
    protected:
        //TODO Investigate pointers, how they are used, if they are needed
        struct Hdf5_File {
            H5::H5File _file;
            H5::Group _group;
            //Can possibly include datasets
        };
    
        std::unordered_map<std::string, Hdf5_File> hdf5_files;


    public:
        virtual ::grpc::Status CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response);
        virtual ::grpc::Status OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response);
        virtual ::grpc::Status GetRegion(::grpc::ServerContext* context, const ::RegionDataRequest* request, ::RegionDataResponse* response);
        virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileRequest* request, ::SpectralProfileResponse* response);    
        std::vector<float> readRegion(const H5::DataSet &dataset,std::vector<hsize_t> &start,std::vector<hsize_t> &dimCount,hsize_t totalPixels);
        std::vector<std::vector<bool>> getMask(RegionType regionType,int width);
        void appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr);
};

#endif  // H5SERVICE_H
