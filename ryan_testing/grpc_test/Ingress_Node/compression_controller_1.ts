import * as grpc from "@grpc/grpc-js";
import { CompressionEmpty } from "./proto/compression";
import { CompressionOutput } from "./proto/compression";
import { CompressionServicesClient } from "./proto/compression";
import { NanEncodingMessage } from "./proto/compression";
import { NanEncodingResponse } from "./proto/compression";


(async () => {
    const h5wasm = await import('h5wasm/node');
    await h5wasm.ready;

    const file = new h5wasm.File("/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/Big.hdf5", "r");

    const datasetName = '0/DATA';
    const dataset = file.get(datasetName);

    if (dataset && dataset instanceof h5wasm.Dataset) {
        // Get dataset metadata
        const metadata = dataset.metadata;

        const maxshape = metadata.maxshape;
        if (maxshape) {
            // Extract width and height from maxshape
            const width = maxshape[2];
            const height = maxshape[3];

            const halfWidth = Math.floor(width / 2);
            const halfHeight = Math.floor(height / 2);

            const quarterWidth = Math.floor(width / 4);
            const quarterHeight = Math.floor(height / 4);

            const slices: [number, number | null, number | null][][] = [];

            for (let row = 0; row < 1; row++) {
                for (let col = 0; col < 1; col++) {
                    slices.push([
                        [0, 1, null], 
                        [0, 1, null],
                        [col * width, (col + 1) * width, null],
                        [row * height, (row + 1) * height, null]
                    ]);
                }
            }

            const options = {
                'grpc.max_send_message_length': 15 * 1024 * 1024, // 15MB
                'grpc.max_receive_message_length': 15 * 1024 * 1024, // 5MB
                'grpc.request_timeout_ms': 60000
            };

            const compressionClients = [
                new CompressionServicesClient("localhost:9966", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9965", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9964", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9963", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9962", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9961", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9960", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9959", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9958", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9957", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9956", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9955", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9954", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9953", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9952", grpc.credentials.createInsecure(), options),
                new CompressionServicesClient("localhost:9951", grpc.credentials.createInsecure(), options),
            ];

            slices.forEach((slice, index) => {
                try {
                    const sliceData = dataset.slice(slice);

                    if (sliceData === null) {
                        console.error(`Slice data for client ${index} is null`);
                        return;
                    }

                    let flatArray;
                    if (sliceData instanceof Float32Array) {
                        flatArray = Buffer.from(sliceData.buffer);
                    } else {
                        console.error('Unsupported sliceData format:', typeof sliceData);
                        return;
                    }

                    let compressionRequest = {
                        data: flatArray,
                        width: width,
                        height: height,
                        precision: 32,
                        offset: 0,
                        index: index
                    }

                    let NanEncodingrequest = {
                        data: flatArray,
                        width: width,
                        height: height,
                        offset: 0,
                        index: index
                    }

                    const compressionMode = parseInt(process.argv[2]) || 0;

                    if(compressionMode == 0){

                        const grpcCompressionStartTime = new Date().getTime();

                        compressionClients[index].computeCompression(compressionRequest, (error, response: CompressionOutput) => {
                            const grpcCompressionEndTime = new Date().getTime();
                            if (error) {
                                console.error(`Error: ${error}`);
                            } else {
                                console.log(`Compression Output ${index + 1}:`);
                            }
                            console.log(`Time grpc data was sent ${index}: ${grpcCompressionStartTime % 1000000} ms`);
                            console.log(`Total gRPC Time ${index}: ${grpcCompressionEndTime - grpcCompressionStartTime} ms \n`);
                        });
                    }
                    else if(compressionMode == 2){

                        const grpcNanEncodingStartTime = new Date().getTime();

                        compressionClients[index].computeNanEncodingsBlock(NanEncodingrequest, (error, response: NanEncodingResponse) => {
                            const grpcNanEncodingEndTime = new Date().getTime();
                            if (error) {
                                console.error(`Error: ${error}`);
                            } else {
                                console.log(`NanEncoding Output ${index + 1}: ${response?.success}`);
                            }
                            console.log(`Time grpc data was sent ${index}: ${grpcNanEncodingStartTime % 1000000} ms`);
                            console.log(`Total gRPC Time ${index}: ${grpcNanEncodingEndTime - grpcNanEncodingStartTime} ms \n`);
                        });
                    }
                    else if(compressionMode == 1){
                        const grpcDecompressionStartTime = new Date().getTime();

                        compressionClients[index].computeDecompression(compressionRequest, (error, response: CompressionOutput) => {
                            const grpcCompressionEndTime = new Date().getTime();
                            if (error) {
                                console.error(`Error: ${error}`);
                            } else {
                                console.log(`Decompression Output ${index + 1}:`);
                            }
                            console.log(`Time grpc data was sent ${index}: ${grpcDecompressionStartTime % 1000000} ms`);
                            console.log(`Total gRPC Time ${index}: ${grpcCompressionEndTime - grpcDecompressionStartTime} ms \n`);
                        });
                    }

                } catch (error) {
                    console.error(`Error processing slice for client ${index}:`, error);
                }
            });

        } else {
            console.error('maxshape is null or undefined');
        }
    } else {
        console.error('Dataset not found or is not a Dataset');
    }

    file.close();
})();
