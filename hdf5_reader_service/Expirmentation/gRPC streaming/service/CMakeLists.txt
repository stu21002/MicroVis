cmake_minimum_required(VERSION 3.20)
project(TestStreamService)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)


# find_package(HDF5 REQUIRED COMPONENTS CXX)
find_package(fmt)
# include_directories(${HDF5_INCLUDE_DIRS})

add_executable(StreamService 
stream.cpp
)

set(LINK_LIBS
        ${LINK_LIBS}
        fmt
        streamproto
        
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(StreamService   
        ${LINK_LIBS}
        )