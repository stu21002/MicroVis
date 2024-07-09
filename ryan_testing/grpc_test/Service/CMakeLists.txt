cmake_minimum_required(VERSION 3.20)
project(GreeterService)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)


find_package(fmt)

add_executable(HelloworldService 
src/client.cpp
src/server.cpp)

set(LINK_LIBS
        ${LINK_LIBS}
        
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(HelloworldService   
        ${LINK_LIBS}
        )