cmake_minimum_required(VERSION 3.15)
project(fits_read)

set(CMAKE_CXX_STANDARD 20)

include(FindProtobuf)
FIND_PACKAGE(PkgConfig REQUIRED)
find_package(fmt)

FIND_PACKAGE(CFITSIO QUIET)
if (CFITSIO_FOUND)
    message(STATUS "Found cfitsio using find_package")
else ()
    PKG_SEARCH_MODULE(CFITSIO REQUIRED cfitsio)
    if (CFITSIO_FOUND)
        message(STATUS "Found cfitsio using pkg-config")
        include_directories(${CFITSIO_INCLUDE_DIRS})
    else ()
        message(FATAL_ERROR "Could not find cfitsio")
    endif ()
endif ()
set(LINK_LIBS
        ${LINK_LIBS}
        ${CFITSIO_LIBRARIES}
        fmt
        
)

add_executable(fits_read
        src/main.cpp
        src/services/ReaderService.cpp
        src/services/ReaderService.h
        src/util/fits_util.cpp
        src/util/fits_util.h)

target_link_libraries(fits_read
        ${LINK_LIBS}
        proto_files
)
