#ifndef H5SERVICE_H
#define H5SERVICE_H

#include <grpcpp/grpcpp.h> 
#include "proto/H5ReaderServices.grpc.pb.h"
#include "proto/H5ReaderServices.pb.h"

#include <H5Cpp.h>
#include <vector>



class H5Service final : public H5ReaderServices::Service
{
    protected:
        //Can change to a list of file pointers
        H5::H5File _file;
        H5::Group _group;
        H5::DataSet _dataset;
        
        std::vector<hsize_t> _dims;
        hsize_t _stokes, _depth, _height, _width;
        bool open = false;
        int _N;

    public:
        virtual ::grpc::Status CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response);
        virtual ::grpc::Status OpenFile(::grpc::ServerContext *context, const ::FileOpenRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response);
        virtual ::grpc::Status ReadRegion(::grpc::ServerContext *context, const ::ReadRegionRequest *request, ::ReadRegionResponse *response);
        virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileRequest* request, ::SpectralProfileResponse* response);    
        std::vector<float> readRegion(const H5::DataSet &dataset,std::vector<hsize_t> &start,std::vector<hsize_t> &dimCount,hsize_t totalPixels);
        std::vector<std::vector<bool>> getMask(RegionType regionType,int width);
        void appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr);
};
#endif  // H5SERVICE_H
