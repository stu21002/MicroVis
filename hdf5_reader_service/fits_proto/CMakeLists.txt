cmake_minimum_required(VERSION 3.15)

FIND_PACKAGE(Protobuf REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_search_module(GRPC REQUIRED grpc)
pkg_search_module(GRPCPP REQUIRED grpc++>=1.22.0)

set(PROTO_FILES
        ../controller/src/utils/uuid.cpp
        ../controller/src/utils/uuid.h
        
        ./defs.proto
        ./FileInfo.proto
        ./OpenFile.proto
        ./Histogram.proto
        ./ImageData.proto
        ./Region.proto  
        ./SpatialProfile.proto 
        ./SpectralProfile.proto
        ./FitsReaderService.proto
)

# Add Library target with protobuf sources
add_library(fitsReaderProto ${PROTO_FILES})
target_link_libraries(fitsReaderProto
        PUBLIC
        protobuf::libprotobuf
        grpc
        grpc++
)
target_include_directories(fitsReaderProto PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

protobuf_generate(TARGET fitsReaderProto LANGUAGE cpp)
protobuf_generate(TARGET fitsReaderProto LANGUAGE grpc GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc PLUGIN "protoc-gen-grpc=/usr/bin/grpc_cpp_plugin")