cmake_minimum_required(VERSION 3.15)


find_package(Protobuf CONFIG REQUIRED)
find_package(gRPC CONFIG REQUIRED)


set(PROTO_FILES
        ./dumy.proto
        ./H5ReaderServices.proto
)

# Add Library target with protobuf sources
add_library(h5proto ${PROTO_FILES})
target_link_libraries(h5proto
        PUBLIC
        protobuf::libprotobuf
        grpc
        grpc++
)
target_include_directories(h5proto PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

protobuf_generate(TARGET h5proto LANGUAGE cpp)
get_target_property(grpc_cpp_plugin_location gRPC::grpc_cpp_plugin LOCATION)
protobuf_generate(
        TARGET h5proto 
        LANGUAGE grpc
        GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
        PLUGIN "protoc-gen-grpc=${grpc_cpp_plugin_location}")