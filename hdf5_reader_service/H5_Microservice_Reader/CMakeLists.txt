cmake_minimum_required(VERSION 3.20)
project(H5Microservice)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(Protobuf CONFIG REQUIRED)
find_package(gRPC CONFIG REQUIRED)

find_package(HDF5 REQUIRED COMPONENTS CXX)
find_package(fmt)
include_directories(${HDF5_INCLUDE_DIRS})

INCLUDE_DIRECTORIES(${PROTOBUF_INCLUDE_DIR})


# set(PROTO_FILES //DOESNT WORK :(
#         proto/submessage.proto
#         proto/H5ReaderServices.proto
# )
# add_library(protolib  ${PROTO_FILES})

add_library(protolib proto/H5ReaderServices.proto)



target_link_libraries(protolib gRPC::grpc++)



target_include_directories(protolib PUBLIC ${CMAKE_CURRENT_BINARY_DIR})
protobuf_generate(TARGET protolib LANGUAGE cpp)

get_target_property(grpc_cpp_plugin_location gRPC::grpc_cpp_plugin LOCATION)

protobuf_generate(
        TARGET protolib 
        LANGUAGE grpc
        GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
        PLUGIN "protoc-gen-grpc=${grpc_cpp_plugin_location}")


add_executable(H5Service 
src/main.cpp
src/H5Service.cpp
src/H5Service.h)

set(LINK_LIBS
        ${LINK_LIBS}
        ${HDF5_LIBRARIES}
        protolib
        fmt
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(H5Service  ${LINK_LIBS})