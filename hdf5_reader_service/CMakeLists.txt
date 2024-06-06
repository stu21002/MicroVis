cmake_minimum_required(VERSION 3.10)

project(HDF5FileReader LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

find_package(HDF5 REQUIRED COMPONENTS CXX)

if (HDF5_FOUND)
    include_directories(${HDF5_INCLUDE_DIRS})
    #add_executable(hdf5_file_reader hdf5_file_reader.cpp)
    #target_link_libraries(hdf5_file_reader ${HDF5_LIBRARIES})
 
    
	add_executable(HDF5Reader H5Reader.cpp)
	target_link_libraries(HDF5Reader ${HDF5_LIBRARIES})
else ()
    message(FATAL_ERROR "Could not find HDF5.")
endif ()
