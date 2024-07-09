cmake_minimum_required(VERSION 3.20)
project(grpc_example)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)

find_package(fmt)

add_executable(Server 
./server.cpp)

set(LINK_LIBS
        ${LINK_LIBS}
        fmt
        helloworldproto
        
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(Server   
        ${LINK_LIBS}
        )