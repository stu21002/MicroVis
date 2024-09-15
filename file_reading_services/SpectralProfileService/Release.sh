#!/bin/bash compiling C++ code in release mode

BUILD_TYPE=Release

cmake -S . -B build -DCMAKE_BUILD_TYPE=$BUILD_TYPE

cmake --build build

# ./build/server
