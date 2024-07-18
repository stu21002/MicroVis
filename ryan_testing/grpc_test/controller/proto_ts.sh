#!/bin/bash

PROTO_DIR=../proto
OUT_DIR=proto

protoc --plugin=$(npm root)/.bin/protoc-gen-ts_proto \
--ts_proto_out=$OUT_DIR \
--ts_proto_opt=outputServices=grpc-js \
--ts_proto_opt=esModulesInterop=true \
-I=$PROTO_DIR $PROTO_DIR/*.proto