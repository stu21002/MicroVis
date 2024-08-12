import * as grpc from "@grpc/grpc-js";
import { CompressionEmpty } from "./proto/compression";
import { CompressionOutput } from "./proto/compression";
import { CompressionServicesClient } from "./proto/compression";
import { NanEncodingMessage } from "./proto/compression";
import { NanEncodingResponse } from "./proto/compression";


(async () => {
    const h5wasm = await import('h5wasm/node');
    await h5wasm.ready;

    const startTime = new Date().getTime();

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

            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 2; col++) {
                    slices.push([
                        [0, 1, null], 
                        [0, 1, null],
                        [col * halfWidth, (col + 1) * halfWidth, null],
                        [row * halfHeight, (row + 1) * halfHeight, null]
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
                        width: halfWidth,
                        height: halfHeight,
                        precision: 32,
                        offset: 0
                    }

                    let NanEncodingrequest = {
                        data: flatArray,
                        width: halfWidth,
                        height: halfHeight,
                        offset: 0
                    }

                    
                    compressionClients[index].computeCompression(compressionRequest, (error, response: CompressionOutput) => {
                        if (error) {
                            console.error(`Error: ${error}`);
                        } else {
                            console.log(`Compression Output ${index + 1}:`);
                        }
                    });

                    compressionClients[index].computeNanEncodingsBlock(NanEncodingrequest, (error, response: NanEncodingResponse) => {
                        if (error) {
                            console.error(`Error: ${error}`);
                        } else {
                            console.log(`NanEncoding Output ${index + 1}: ${response?.success}`);
                        }
                    });

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

    const endTime = new Date().getTime();
    console.log(`Total time taken: ${endTime - startTime} ms`);

    file.close();
})();
                    

// function computeNanEncodingsBlock() {
//     clients.forEach((client, index) => {
//         client.computeNanEncodingsBlock(emptyRequest, (error, response: CompressionOutput) => {
//             if (error) {
//                 console.error(`Error: ${error}`);
//             } else {
//                 console.log(`GetNanEncodingsBlock Output ${index + 1}: ${response?.value}`);
//             }
//         });
//     });
// }
