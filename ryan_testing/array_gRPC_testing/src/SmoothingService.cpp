#include <grpcpp/grpcpp.h>
#include "proto/smoothing.grpc.pb.h"
#include "proto/smoothing.pb.h"

#include <H5Cpp.h>
#include <chrono>
#include <sstream>

#include "Smoothing.h"

class ProcessingImpl : public SmoothingServices::Service {
::grpc::Status computeGuassianBlur(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){
    //std::cout << "Called GuassianBlur" << std::endl;

//     std::string fileName = "/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/Big.hdf5";
//         std::string datasetName = "DATA";                                                                  

//         H5::H5File file = H5::H5File(fileName, H5F_ACC_RDONLY);
//         H5::Group group = file.openGroup("0");

//         // Open the dataset
//         H5::DataSet dataset = group.openDataSet(datasetName);

//         // Get the dataspace of the dataset
//         H5::DataSpace dataspace = dataset.getSpace();

//         // Get the dimensions of the dataset
//         hsize_t dims[4];
//         dataspace.getSimpleExtentDims(dims, NULL);
//         int64_t dim1 = dims[0];
//         int64_t dim2 = dims[1];
//         int64_t width = dims[2];
//         int64_t height = dims[3];

//         int target_slice = 1;

//         hsize_t slice_dims[2] = {static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
//         H5::DataSpace memspace(2, slice_dims);

//         // Create a buffer to hold the data for the entire slice
//         std::vector<float> slice_buffer(width * height);

//         // Define hyperslab in the dataset
//         hsize_t offset[4] = {0, static_cast<hsize_t>(target_slice), 0, 0};
//         hsize_t count[4] = {1, 1, static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
//         dataspace.selectHyperslab(H5S_SELECT_SET, count, offset);

//         try {
//             dataset.read(slice_buffer.data(), H5::PredType::NATIVE_FLOAT, memspace, dataspace);
//         } catch (H5::Exception& e) {
//             std::cerr << "HDF5 error: " << e.getCDetailMsg() << std::endl;
//             return grpc::Status(grpc::StatusCode::INTERNAL, "HDF5 read error");
//         }

    google::protobuf::RepeatedField<float> data = request->data();

    // auto after_receieved_contoruing = std::chrono::high_resolution_clock::now();

    // std::cout << "After data recieved Smoothing: " << after_receieved_contoruing.max << std::endl;
    auto wholeTimeStart = std::chrono::high_resolution_clock::now();

    auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

    int width = request->width();
    int height = request->height();
    int index = request->index();
    //const std::string& raw_values = request->data();

    auto now = std::chrono::system_clock::now();
    
    // Convert it to time since epoch, in milliseconds
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    auto last_six_digits = millis % 100000;

    // Print the milliseconds
    std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

    auto nowEnd = std::chrono::system_clock::now();

    // size_t num_floats = raw_values.size() / sizeof(float);

    // std::vector<float> float_values(num_floats);
    // std:memcpy(float_values.data(), raw_values.data(), raw_values.size());

        // Convert to std::vector<float>
    // std::vector<float> vectorData(data.begin(), data.end());

    // auto conversionToVectorEnd = std::chrono::high_resolution_clock::now();
    // std::chrono::duration<double> conversionDuration = conversionToVectorEnd - conversionToVectorStart;
    // std::cout << "Conversion to vector took " << conversionDuration.count() << " seconds." << std::endl;

    int smoothing_factor = 4;
    
    int mask_size = (smoothing_factor - 1) * 2 + 1;
    int64_t kernel_width = (mask_size - 1) / 2;

    int64_t source_width = width;
    int64_t source_height = height;
    int64_t dest_width = width - (2 * kernel_width);
    int64_t dest_height = height - (2 * kernel_width);
    std::unique_ptr<float[]> dest_array(new float[dest_width * dest_height]);
    std::cout << dest_width * dest_height << std::endl;
    // response->mutable_data()->resize(dest_width * dest_height * sizeof(float));
    // float* response_array = reinterpret_cast<float*>(response->mutable_data()->data());

    auto start = std::chrono::high_resolution_clock::now();

    //std::cout << float_values.size() << std::endl;
    //std::cout << dest_array << std::endl;

    carta::GaussianSmooth(const_cast<float*>(data.data()), dest_array.get(), source_width, source_height, dest_width, dest_height, smoothing_factor);

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> duration = end - start;
    std::cout << "GaussianSmooth took " << duration.count() << " seconds for index: " << index << std::endl;

    // std::cout << dest_width * dest_height << std::endl;

    // float final = 0;
    // for(int i = 0; i < dest_width * dest_height; i++){
    //     if(std::isnan(response_array[i])){
    //         continue;
    //     }
    //     else{
    //         final = final + response_array[i];
    //     }
    // }

    // std::cout << final << std::endl;

    // auto startConversionDest = std::chrono::high_resolution_clock::now();
    
    for (int64_t i = 0; i < dest_width * dest_height; ++i) {
        response->add_data(dest_array[i]);
    }

    //std::memcpy(response_array, dest_array.get(), dest_width * dest_height * sizeof(float));

    // auto endConversionDest = std::chrono::high_resolution_clock::now();
    // std::chrono::duration<double> durationConversionDest = endConversionDest - startConversionDest;
    // std::cout << "Coversion to send data took " << durationConversionDest.count() << " seconds." << std::endl;

    response->set_smoothingfactor(smoothing_factor);
    response->set_dest_width(dest_width);
    response->set_dest_height(dest_height);

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}

::grpc::Status computeBlockSmoothing(::grpc::ServerContext* context, const ::SmoothingEmpty *request, ::SmoothingOutput *response){
    std::cout << "Called Block Smoothing" << std::endl;

//     std::string fileName = "/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/Big.hdf5";
//         std::string datasetName = "DATA";                                                                  

//         H5::H5File file = H5::H5File(fileName, H5F_ACC_RDONLY);
//         H5::Group group = file.openGroup("0");

//         // Open the dataset
//         H5::DataSet dataset = group.openDataSet(datasetName);

//         // Get the dataspace of the dataset
//         H5::DataSpace dataspace = dataset.getSpace();

//         // Get the dimensions of the dataset
//         hsize_t dims[4];
//         dataspace.getSimpleExtentDims(dims, NULL);
//         int64_t dim1 = dims[0];
//         int64_t dim2 = dims[1];
//         int64_t width = dims[2];
//         int64_t height = dims[3];

//         int target_slice = 1;

//         hsize_t slice_dims[2] = {static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
//         H5::DataSpace memspace(2, slice_dims);

//         // Create a buffer to hold the data for the entire slice
//         std::vector<float> slice_buffer(width * height);

//         // Define hyperslab in the dataset
//         hsize_t offset[4] = {0, static_cast<hsize_t>(target_slice), 0, 0};
//         hsize_t count[4] = {1, 1, static_cast<hsize_t>(width), static_cast<hsize_t>(height)};
//         dataspace.selectHyperslab(H5S_SELECT_SET, count, offset);

//         try {
//             dataset.read(slice_buffer.data(), H5::PredType::NATIVE_FLOAT, memspace, dataspace);
//         } catch (H5::Exception& e) {
//             std::cerr << "HDF5 error: " << e.getCDetailMsg() << std::endl;
//             return grpc::Status(grpc::StatusCode::INTERNAL, "HDF5 read error");
//         }

    google::protobuf::RepeatedField<float> data = request->data();

    auto wholeTimeStart = std::chrono::high_resolution_clock::now();

    auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

    int width = request->width();
    int height = request->height();
    int index = request->index();
    //const std::string& raw_values = request->data();

    auto now = std::chrono::system_clock::now();
    
    // Convert it to time since epoch, in milliseconds
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    auto last_six_digits = millis % 100000;

    // Print the milliseconds
    std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

    auto nowEnd = std::chrono::system_clock::now();

    // size_t num_floats = raw_values.size() / sizeof(float);

    // std::vector<float> float_values(num_floats);
    // std:memcpy(float_values.data(), raw_values.data(), raw_values.size());

        // Convert to std::vector<float>
    // std::vector<float> vectorData(data.begin(), data.end());

    // auto conversionToVectorEnd = std::chrono::high_resolution_clock::now();
    // std::chrono::duration<double> conversionDuration = conversionToVectorEnd - conversionToVectorStart;
    // std::cout << "Conversion to vector took " << conversionDuration.count() << " seconds." << std::endl;
    
    int smoothing_factor = 4;

    bool mean_filter = true;

    const int x = 0;
    const int y = 0;
    const int req_height = height - y;
    const int req_width = width - x;

    // size returned vector
    size_t num_rows_region = std::ceil((float)req_height / smoothing_factor);
    size_t row_length_region = std::ceil((float)req_width / smoothing_factor);
    //std::unique_ptr<float[]> dest_array(new float[num_rows_region * row_length_region]);
    std::vector<float> dest_array;
    dest_array.resize(num_rows_region * row_length_region);

    // response->mutable_data()->resize(row_length_region * num_rows_region * sizeof(float));
    // float* response_array = reinterpret_cast<float*>(response->mutable_data()->data());

    int num_image_columns = width;
    int num_image_rows = height;

    auto start = std::chrono::high_resolution_clock::now();

    if (mean_filter && smoothing_factor > 1) {
        // Perform down-sampling by calculating the mean for each MIPxMIP block
        carta::BlockSmooth(
            const_cast<float*>(data.data()), dest_array.data(), num_image_columns, num_image_rows, row_length_region, num_rows_region, x, y, smoothing_factor);
    } else {
        // Nearest neighbour filtering
        carta::NearestNeighbor(const_cast<float*>(data.data()), dest_array.data(), num_image_columns, row_length_region, num_rows_region, x, y, smoothing_factor);
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> duration = end - start;
    std::cout << "BlockSmoothing took " << duration.count() << " seconds for index:" << index << std::endl;

    size_t dest_width = ceil(double(width) / smoothing_factor);
    size_t dest_height = ceil(double(height) / smoothing_factor);

    response->set_smoothingfactor(smoothing_factor);
    response->set_dest_width(dest_width);
    response->set_dest_height(dest_height);
    for (int64_t i = 0; i < num_rows_region * row_length_region; ++i) {
        response->add_data(dest_array[i]);
    }

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}   
};
void StartServer(int port){
    std::string server_address = "0.0.0.0:" + std::to_string(port);
    ProcessingImpl service;
    grpc::ServerBuilder builder;

    builder.SetMaxSendMessageSize(60 * 1024 * 1024); // 15MB
    builder.SetMaxReceiveMessageSize(60 * 1024 * 1024); // 15MB

    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Smoothing Service Ready on " << server_address << std::endl;

    server->Wait();
}

int main(int argc, char** argv){
    if(argc != 2){
        std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
        return 1;
    }

    int port = std::stoi(argv[1]);
    StartServer(port);

    return 0;
}