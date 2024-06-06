#ifndef HDF5READER_H
#define HDF5READER_H

#include <string>
#include <H5Cpp.h>
#include <vector> 
class H5Reader {
  
        
 public:
    H5Reader(const std::string& fileName);
    bool Openfile();
    bool Closefile();
    void getFileInfo();
    void getImageData();
    void getRegion();
    void getSpectralProfile();

    protected:
    std::string _fileName;
    H5::H5File _file;
    H5::DataSet _dataset;
    H5::Group _group;
    H5::DataSpace _dspace;
     
 
};

#endif  // HDF5READER_H


  // protected:
    // std::unordered_map<std::string, fitsfile*> fits_files;

    // public:
    // virtual ::grpc::Status CheckStatus(::grpc::ServerContext* context, const ::fitsReaderProto::Empty* request,
    //                                     ::fitsReaderProto::StatusResponse* response) override;
    // virtual ::grpc::Status OpenFile(grpc::ServerContext* context, const fitsReaderProto::FileOpenRequest* request,
    //                                 fitsReaderProto::StatusResponse* response) override;
    // virtual grpc::Status CloseFile(grpc::ServerContext* context, const fitsReaderProto::FileCloseRequest* request,
    //                                 fitsReaderProto::StatusResponse* response) override;

    // virtual ::grpc::Status GetFileInfo(::grpc::ServerContext* context, const ::fitsReaderProto::FileInfoRequest* request,
    //                                     ::fitsReaderProto::FileInfoResponse* response) override;
    // virtual ::grpc::Status GetImageData(::grpc::ServerContext* context, const ::fitsReaderProto::ImageDataRequest* request,
    //                                     ::fitsReaderProto::ImageDataResponse* response) override;
    // virtual ::grpc::Status GetSpectralProfile(grpc::ServerContext* context, const fitsReaderProto::SpectralProfileRequest* request,
    //                                         fitsReaderProto::SpectralProfileResponse* response) override;
