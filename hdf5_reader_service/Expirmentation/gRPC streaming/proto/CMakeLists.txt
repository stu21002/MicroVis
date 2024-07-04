cmake_minimum_required(VERSION 3.15)


find_package(Protobuf REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_search_module(GRPC REQUIRED grpc)
pkg_search_module(GRPCPP REQUIRED grpc++>=1.22.0)


set(PROTO_FILES
        ./stream.proto
)

# Add Library target with protobuf sources
add_library(streamproto ${PROTO_FILES})
target_link_libraries(streamproto
        PUBLIC
        protobuf::libprotobuf
        grpc
        grpc++
)

target_include_directories(streamproto PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

protobuf_generate(TARGET streamproto LANGUAGE cpp)
# Old method with manual builds
# get_target_property(grpc_cpp_plugin_location gRPC::grpc_cpp_plugin LOCATION)

protobuf_generate(
        TARGET streamproto 
        LANGUAGE grpc
        GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
        PLUGIN "protoc-gen-grpc=/usr/bin/grpc_cpp_plugin")