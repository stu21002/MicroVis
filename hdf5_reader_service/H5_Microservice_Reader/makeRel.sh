
#!/bin/bash

BUILD_TYPE=Release



# Run CMake with the specified build type
cmake -S . -B build -DCMAKE_BUILD_TYPE=$BUILD_TYPE

# Build the project
cmake --build build

# Run the program (uncomment to execute the built program)
# ./build/server

