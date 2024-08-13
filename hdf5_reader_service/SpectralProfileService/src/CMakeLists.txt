cmake_minimum_required(VERSION 3.20)
project(SpectralMicroService)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)


# find_package(HDF5 REQUIRED COMPONENTS CXX)
find_package(fmt)
# include_directories(${HDF5_INCLUDE_DIRS})

add_executable(Spectral 
# main.cpp
Service/SpectralProfileService.cpp
# Service/SpectralProfileService.h
)

set(LINK_LIBS
        ${LINK_LIBS}
        fmt
        proto_files
)

# target_link_libraries(H5Service protolib)
# target_link_libraries(H5Service ${HDF5_LIBRARIES})

target_link_libraries(Spectral   
        ${LINK_LIBS}
        )