#ifndef H5SERVICE_H
#define H5SERVICE_H

#include <grpcpp/grpcpp.h> 
#include "./../hdf5_proto/H5ReaderService.grpc.pb.h"
#include "./../hdf5_proto/H5ReaderService.pb.h"
#include <H5Cpp.h>
#include <vector>

using namespace hdf5_proto;

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
        virtual ::grpc::Status GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request, ::grpc::ServerWriter< ::ImageDataResponse>* writer);
        
        virtual ::grpc::Status GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileReaderResponse* response);
        virtual ::grpc::Status GetSpectralProfileStream(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::grpc::ServerWriter< ::SpectralProfileReaderResponse>* writer);
        virtual ::grpc::Status GetHistogram(::grpc::ServerContext* context, const ::HistogramRequest* request, ::HistogramResponse* response);
        virtual ::grpc::Status GetHistogramDist(::grpc::ServerContext* context, const ::HistogramDistRequest* request, ::HistogramResponse* response);


        
        void appendAttribute(FileInfoExtended *extendedFileInfo,H5::Attribute attr);
        void ServicePrint(std::string msg);

        //Old methods 
        std::vector<float> readRegion(const H5::DataSet &dataset,std::vector<hsize_t> &start,std::vector<hsize_t> &dimCount,hsize_t totalPixels);
        std::vector<bool> getMask(RegionInfo region_info,int startX,int startY,int numX, int numY);

};

#endif  // H5SERVICE_H
