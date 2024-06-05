#!/bin/bash

# Run CMake
cmake -S . -B build

# Build the project
cmake --build build

# Run the program
./build/hdf5_file_reader