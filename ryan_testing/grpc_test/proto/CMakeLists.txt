cmake_minimum_required(VERSION 3.15)

find_package(Protobuf REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_search_module(GRPC REQUIRED grpc)
pkg_search_module(GRPCPP REQUIRED grpc++>=1.22.0)

set(PROTO_FILES
        ./helloworld.proto
)

add_library(helloworldproto ${PROTO_FILES})
target_link_libraries(helloworldproto
        PUBLIC
        protobuf::libprotobuf
        grpc
        grpc++
)

target_include_directories(helloworldproto PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

protobuf_generate(TARGET helloworldproto LANGUAGE cpp)

protobuf_generate(
        TARGET helloworldproto
        LANGUAGE grpc
        GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc 
        PLUGIN "protoc-gen-grpc=/usr/bin/grpc_cpp_plugin"
)