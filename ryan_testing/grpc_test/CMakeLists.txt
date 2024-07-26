cmake_minimum_required(VERSION 3.20)
project(GreeterService)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(OpenMP REQUIRED)
find_package(HDF5 REQUIRED COMPONENTS CXX)
include_directories(${HDF5_INCLUDE_DIRS})
link_directories(${HDF5_LIBRARY_DIRS})
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS} -msse3")

# message(STATUS "HDF5_INCLUDE_DIRS: ${HDF5_INCLUDE_DIRS}")
# message(STATUS "HDF5_LIBRARIES: ${HDF5_LIBRARIES}")
# message(STATUS "HDF5_LIBRARY_DIRS: ${HDF5_LIBRARY_DIRS}")

find_package(Protobuf CONFIG REQUIRED)
find_package(gRPC CONFIG REQUIRED)

add_library(protolibContour proto/contouring.proto)
add_library(protolibSmooth proto/smoothing.proto)

target_link_libraries(protolibContour gRPC::grpc++)
target_link_libraries(protolibSmooth gRPC::grpc++)

target_include_directories(protolibContour PUBLIC ${CMAKE_CURRENT_BINARY_DIR})
target_include_directories(protolibSmooth PUBLIC ${CMAKE_CURRENT_BINARY_DIR})

get_target_property(grpc_cpp_plugin_location gRPC::grpc_cpp_plugin LOCATION)

protobuf_generate(TARGET protolibContour LANGUAGE cpp)
protobuf_generate(TARGET protolibContour LANGUAGE grpc
    GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
    PLUGIN "protoc-gen-grpc=${grpc_cpp_plugin_location}"    
)
protobuf_generate(TARGET protolibSmooth LANGUAGE cpp)
protobuf_generate(TARGET protolibSmooth LANGUAGE grpc
    GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
    PLUGIN "protoc-gen-grpc=${grpc_cpp_plugin_location}"
)

add_executable(ContouringService src/ContouringService.cpp src/Contouring.cpp)
target_link_libraries(ContouringService protolibContour ${HDF5_LIBRARIES})

add_executable(SmoothingService src/SmoothingService.cpp src/Smoothing.cpp)
target_link_libraries(SmoothingService protolibSmooth ${HDF5_LIBRARIES})


