cmake_minimum_required(VERSION 3.20)
project(H5MicroService)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)


find_package(HDF5 REQUIRED COMPONENTS CXX)
find_package(fmt)
include_directories(${HDF5_INCLUDE_DIRS})

add_executable(H5Service 
src/main.cpp
src/H5Service.cpp
src/H5Service.h)

set(LINK_LIBS
        ${LINK_LIBS}
        ${HDF5_LIBRARIES}
        fmt
        h5proto
        
        
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(H5Service   
        ${LINK_LIBS}
        )