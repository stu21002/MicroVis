#!/bin/bash
echo "Compiling..."

protoc --plugin=$(npm root)/.bin/protoc-gen-ts_proto \
 --ts_proto_out=bin/src/proto \
 --ts_proto_opt=outputServices=grpc-js \
 --ts_proto_opt=esModuleInterop=true \
 -I=proto proto/*.proto

echo "Files will be ready shortly"

