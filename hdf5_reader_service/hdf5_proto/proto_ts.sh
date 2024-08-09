#!/bin/bash
echo "Compiling..."


# Define the proto files directory
PROTO_DIR="hdf5_proto"

# Print the proto files to be compiled
echo "Proto files to be compiled:"
# ls $PROTO_DIR/*.proto


protoc --plugin=$(npm root)/.bin/protoc-gen-ts_proto \
 --ts_proto_out=src/proto \
 --ts_proto_opt=outputServices=grpc-js \
 --ts_proto_opt=esModuleInterop=true \
 -I=hdf5_proto  $PROTO_DIR/*.proto

echo "Files will be ready shortly"

