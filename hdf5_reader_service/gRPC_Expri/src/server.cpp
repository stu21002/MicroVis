#include <grpcpp/grpcpp.h>
#include "proto/hello.grpc.pb.h"
#include "proto/hello.pb.h"

#include <string>
#include <H5Cpp.h>
#include <vector> 

class H5Service : public H5ReaderService::Service {
    H5::H5File _file;
    H5::Group _group;
    H5::DataSet _dataset;
    int _N;
    std::vector<hsize_t> _dims;
    hsize_t _stokes, _depth, _height, _width;

::grpc::Status CheckStatus(::grpc::ServerContext* context, const ::Empty* request, ::StatusResponse* response){
    response->set_status(true);
    response->set_statusmessage("OK");
    return grpc::Status::OK;
}

::grpc::Status OpenFile(::grpc::ServerContext* context, const ::FileOpenRequest* request, ::StatusResponse* response){
    
    try
        { 
        	_file = H5::H5File("./files/"+request->filename(),H5F_ACC_RDONLY); 
            _group = _file.openGroup("0");
            _dataset = _group.openDataSet("DATA");

            auto data_space = _dataset.getSpace();
            _N = data_space.getSimpleExtentNdims();
            _dims.resize(_N);
            data_space.getSimpleExtentDims(_dims.data(), nullptr);

            std::reverse(_dims.begin(), _dims.end());
            _stokes = _N == 4 ? _dims[3] : 1;
            _depth = _N >= 3 ? _dims[2] : 1;
            _height = _dims[1];
            _width = _dims[0];
            response->set_status(true);
            
        }
        catch(const H5::Exception& e)
        {
        	std::cerr << e.getCDetailMsg() << '\n';
        	response->set_status(false);
        }
        
    return grpc::Status::OK;
}


::grpc::Status CloseFile(::grpc::ServerContext* context, const ::FileCloseRequest* request, ::StatusResponse* response){
        try
        {
        	_file.close();
        	response->set_status(true);
        }
        catch(const H5::Exception& e)
        {
        	std::cerr << e.getCDetailMsg() << '\n';
        	response->set_status(false);
        }
    return grpc::Status::OK;
};
::grpc::Status GetFileInfo(::grpc::ServerContext* context, const ::FileInfoRequest* request, ::FileInfoResponse* response){
    try{

    H5::H5File qckFile = H5::H5File("./files/"+request->filename(),H5F_ACC_RDONLY);
    int fileSize = qckFile.getFileSize();
    H5::Group qckGroup = qckFile.openGroup("0");
    H5::DataSet qckdataset = qckGroup.openDataSet("DATA");

    auto qckDataSpace = qckdataset.getSpace();
    int qckN = qckDataSpace.getSimpleExtentNdims();
    std::vector<hsize_t> qckDims;
    qckDims.resize(qckN);
    qckDataSpace.getSimpleExtentDims(qckDims.data(), nullptr);
    std::reverse(qckDims.begin(), qckDims.end());

    response->set_size(fileSize);   
     for (int i = 0; i < qckN; i++) {
                // std::cout << qckDims[i] << " ";
                response->add_dimensions(qckDims[i]); 
            }
    response->set_success(true);
    }
    catch (const H5::Exception& e){
        	std::cerr << e.getCDetailMsg() << '\n';
        	response->set_success(false);
    }
    
    return grpc::Status::OK;
};


::grpc::Status ReadRegion(::grpc::ServerContext* context, const ::ReadRegionRequest* request, ::ReadRegionResponse* response){
    std::vector<float> result;

    //Starting points in each dimension
    std::vector<hsize_t> h5_start;

    //Number of pixels selected per dimension
    std::vector<hsize_t> h5_count;

    hsize_t result_size = 1;

    std::vector<hsize_t> start(request->start().begin(),request->start().end());
    std::vector<hsize_t> end(request->end().begin(),request->end().end());   

    for (int d = 0; d < 4; d++) {

        h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
        h5_count.insert(h5_count.begin(), d < start.size() ? end[d] - start[d] : 1);

        result_size *= d < start.size()? end[d] - start[d]: 1;
        // result_size *= end[d] - start[d];

    }

    result.resize(result_size);
    H5::DataSpace mem_space(1, &result_size);

    auto file_space = _dataset.getSpace();
    file_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());
    _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, file_space);
    for (float value : result) {

      response->add_region(value);
    }
    return grpc::Status::OK;
};
};
int main(){
    H5Service service;
    grpc::ServerBuilder builder;
    builder.AddListeningPort("0.0.0.0:9999", grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    
    std::cout << "Server Running!" << std::endl;

    server->Wait(); 
    return 0;
}