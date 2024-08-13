cmake_minimum_required(VERSION 3.15)


find_package(Protobuf REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_search_module(GRPC REQUIRED grpc)
pkg_search_module(GRPCPP REQUIRED grpc++>=1.22.0)


set(PROTO_FILES
        ./defs.proto
        ./FileInfo.proto
        ./OpenFile.proto
        ./Histogram.proto
        ./ImageData.proto
        ./Region.proto  
        ./SpatialProfile.proto 
        ./SpectralProfile.proto
        ./SpectralProfileService.proto
        ./FitsReaderService.proto
        ./FileService.proto
        ./H5ReaderService.proto
)

# Add Library target with protobuf sources
add_library(proto_files ${PROTO_FILES})
target_link_libraries(proto_files
        PUBLIC
        protobuf::libprotobuf
        grpc
        grpc++
)

target_include_directories(proto_files PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

protobuf_generate(TARGET proto_files LANGUAGE cpp)
# Old method with manual builds
# get_target_property(grpc_cpp_plugin_location gRPC::grpc_cpp_plugin LOCATION)

protobuf_generate(
        TARGET proto_files 
        LANGUAGE grpc
        GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
        PLUGIN "protoc-gen-grpc=/usr/bin/grpc_cpp_plugin")