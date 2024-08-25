cmake_minimum_required(VERSION 3.20)

project(ContourTracer)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(OpenMP REQUIRED)
find_package(HDF5 REQUIRED COMPONENTS CXX)
find_package(ZFP CONFIG REQUIRED)

include_directories(${ZFP_INCLUDE_DIRS})
link_directories(${ZFP_INCLUDE_DIRS})

include_directories(${HDF5_INCLUDE_DIRS})
link_directories(${HDF5_LIBRARY_DIRS})

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS} -mssse3")

# Set C++ standard
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Add the executable
add_executable(Contouring Contouring.cpp)
target_link_libraries(Contouring ${HDF5_LIBRARIES})

add_executable(Smoothing Smoothing.cpp)
target_link_libraries(Smoothing ${HDF5_LIBRARIES})

add_executable(Compression Compression.cpp)
target_link_libraries(Compression ${HDF5_LIBRARIES} ${ZFP_LIBRARIES})

