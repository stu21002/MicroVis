#ifndef H5SERVICE_H
#define H5SERVICE_H

#include <grpcpp/grpcpp.h> 
#include "./../proto/H5ReaderService.grpc.pb.h"
#include "./../proto/H5ReaderService.pb.h"
#include <H5Cpp.h>
#include <vector>

using namespace proto;

class H5Service final : public H5Readers::Service
{
    

    protected:
        //TODO Investigate pointers, how they are used, if they are needed
        struct Hdf5_File {
            H5::H5File _file;
            H5::Group _group;
            //Can possibly include datasets
        };
    
        std::unordered_map<std::string, Hdf5_File> hdf5_files;
        int port;

    public:
        H5Service ( int port);
        virtual ::grpc::Status CheckStatus(::grpc::ServerContext *context, const ::Empty *request, ::StatusResponse *response);
        virtual ::grpc::Status OpenFile(::grpc::ServerContext *context, const ::OpenFileRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status CloseFile(::grpc::ServerContext *context, const ::FileCloseRequest *request, ::StatusResponse *response);
        virtual ::grpc::Status GetFileInfo(::grpc::ServerContext *context, const ::FileInfoRequest *request, ::FileInfoResponse *response);
        virtual ::grpc::Status GetImageDataStream(::grpc::ServerContext* context, const ::proto::ImageDataRequest* request, ::grpc::ServerWriter< ::proto::ImageDataResponse>* writer);
        
        virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::proto::SpectralProfileRequest* request, ::SpectralProfileResponse* response);
        virtual ::grpc::Status GetSpectralProfileStream(::grpc::ServerContext* context, const ::proto::SpectralProfileRequest* request, ::grpc::ServerWriter< ::proto::SpectralProfileResponse>* writer);
        virtual ::grpc::Status GetHistogram(::grpc::ServerContext* context, const ::proto::HistogramRequest* request, ::proto::HistogramResponse* response);
        virtual ::grpc::Status GetHistogramDist(::grpc::ServerContext* context, const ::proto::HistogramDistRequest* request, ::proto::HistogramResponse* response);


        
        void appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr);
        void ServicePrint(std::string msg);

        //Old methods 
        std::vector<float> readRegion(const H5::DataSet &dataset,std::vector<hsize_t> &start,std::vector<hsize_t> &dimCount,hsize_t totalPixels);
        std::vector<std::vector<bool>> getMask(RegionType regionType,int width);

};

#endif  // H5SERVICE_H
