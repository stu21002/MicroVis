#include <grpcpp/grpcpp.h>
#include "proto/compression.grpc.pb.h"
#include "proto/compression.pb.h"

#include <H5Cpp.h>
#include <chrono>

#include "Compression.h"

class ProcessingImpl : public CompressionServices::Service {
::grpc::Status computeCompression(::grpc::ServerContext* context, const ::CompressionEmpty *request, ::CompressionOutput *response){

        auto wholeTimeStart = std::chrono::high_resolution_clock::now();

        auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

        int width = request->width();
        int height = request->height();
        int precision = request->precision();
        int offset = request->offset();
        int index = request->index();

        //const std::string& raw_values = request->data();
        google::protobuf::RepeatedField<float> data = request->data();

        auto now = std::chrono::system_clock::now();
        std::vector<float> vectorData(data.begin(), data.end());
    
        // Convert it to time since epoch, in milliseconds
        auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

        auto last_six_digits = millis % 100000;

        // Print the milliseconds
        std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

        auto nowEnd = std::chrono::system_clock::now();

        std::vector<char> compression_buffer;
        size_t compressed_size;

        auto start = std::chrono::high_resolution_clock::now();

        int success = carta::Compress(vectorData, offset, compression_buffer, compressed_size, width, height, precision);

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> duration = end - start;

        std::cout << compressed_size << std::endl;
        if(success == 0){
            std::cout << "Compression took " << duration.count() << " seconds for index: " << index << std::endl;
        }
        else{
            std::cout << "Compression failed " << std::endl;
        }

        //std::string byteArray(reinterpret_cast<const char*>(compression_buffer.data()), compression_buffer.size() * sizeof(int32_t));

    response->set_success("Compression processing complete");

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}

::grpc::Status computeDecompression(::grpc::ServerContext* context, const ::CompressionEmpty *request, ::CompressionOutput *response){

    auto wholeTimeStart = std::chrono::high_resolution_clock::now();

    int width = request->width();
    int height = request->height();
    int precision = request->precision();
    int offset = request->offset();
    int index = request->index();

    //const std::string& raw_values = request->data();

    google::protobuf::RepeatedField<float> data = request->data();

    auto now = std::chrono::system_clock::now();
    std::vector<float> vectorData(data.begin(), data.end());
    
        // Convert it to time since epoch, in milliseconds
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

    auto last_six_digits = millis % 100000;

    // Print the milliseconds
    std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

    auto nowEnd = std::chrono::system_clock::now();

    std::vector<char> compression_buffer;
    size_t compressed_size;

    int compressionSuccess = carta::Compress(vectorData, offset, compression_buffer, compressed_size, width, height, precision);

    if(compressionSuccess == 0){
        std::vector<float> decompressed_array;

        auto start = std::chrono::high_resolution_clock::now();

        int decomopressionSuccess = carta::Decompress(decompressed_array, compression_buffer, width, height, precision);

        std::cout << decompressed_array.size() << std::endl;

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> duration = end - start;

        if(decomopressionSuccess == 0){
            std::cout << "Decompression took " << duration.count() << " seconds for index: " << index << std::endl;
        }
        else{
            std::cout << "Decompression failed " << std::endl;
        }
    }
    else{
        std::cout << "Compression failed " << std::endl;
    }

    response->set_success("Compression processing complete");

    auto wholeTimeEnd = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> wholeTimeDuration = wholeTimeEnd - wholeTimeStart - (nowEnd - now);
    std::cout << "Whole time took " << wholeTimeDuration.count() << " seconds for index: " << index << std::endl;

    return grpc::Status::OK;
}


::grpc::Status computeNanEncodingsBlock(::grpc::ServerContext* context, const ::NanEncodingMessage *request, ::NanEncodingResponse *response){

        auto wholeTimeStart = std::chrono::high_resolution_clock::now();
        auto conversionToVectorStart = std::chrono::high_resolution_clock::now();

        int width = request->width();
        int height = request->height();
        int offset = request->offset();
        int index = request->index();

        //const std::string& raw_values = request->data();

        google::protobuf::RepeatedField<float> data = request->data();

        auto now = std::chrono::system_clock::now();
        std::vector<float> vectorData(data.begin(), data.end());
    
        // Convert it to time since epoch, in milliseconds
        auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

        auto last_six_digits = millis % 100000;

        // Print the milliseconds
        std::cout << "Time gRPC data was recieved for index: " << index << ": " << last_six_digits << " ms" << std::endl;

        auto nowEnd = std::chrono::system_clock::now();

        auto start = std::chrono::high_resolution_clock::now();

        std::vector<int32_t> responseArray = carta::GetNanEncodingsBlock(vectorData, offset, width, height);

        std::cout << responseArray.size() << std::endl;

        float final2 = 0;
        for(int i = 0; i < responseArray.size(); i++){
            final2 = final2 + responseArray[i];
        }
        std::cout << final2 << std::endl;

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> duration = end - start;
        //std::cout << responseArray.size() << ":" << width * height << std::endl;
        
        std::cout << "Getting NanEncodingsBlock took " << duration.count() << " seconds for index: " << index << std::endl;

        response->set_success("NanEncoding Complete");

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

    builder.SetMaxSendMessageSize(5 * 1024 * 1024); // 5MB
    builder.SetMaxReceiveMessageSize(15 * 1024 * 1024); // 15MB

    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Compression Service Ready on " << server_address << std::endl;

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