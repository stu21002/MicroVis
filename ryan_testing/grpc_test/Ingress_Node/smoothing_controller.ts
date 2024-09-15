
// const emptyRequest: SmoothingEmpty = {};

// const clients = [
//     new SmoothingServicesClient("localhost:9994", grpc.credentials.createInsecure()),
//     new SmoothingServicesClient("localhost:9993", grpc.credentials.createInsecure()),
//     new SmoothingServicesClient("localhost:9992", grpc.credentials.createInsecure()),
//     new SmoothingServicesClient("localhost:9991", grpc.credentials.createInsecure()),
//     new SmoothingServicesClient("localhost:9990", grpc.credentials.createInsecure()),
// ];

// function computeGaussianBlur() {
//     clients.forEach((client, index) => {
//         client.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
//             if (error) {
//                 console.error(`Error: ${error}`);
//             } else {
//                 console.log(`Smoothing Output ${index + 1}: ${response?.value}`);
//             }
//         });
//     });
// }

// function computeBlockSmoothing() {
//     clients.forEach((client, index) => {
//         client.computeBlockSmoothing(emptyRequest, (error, response: SmoothingOutput) => {
//             if (error) {
//                 console.error(`Error: ${error}`);
//             } else {
//                 console.log(`Smoothing Output ${index + 1}: ${response?.value}`);
//             }
//         });
//     });
// }

// function main() {
//     const args = process.argv.slice(2);
//     if (args.length !== 1) {
//         console.error("Usage: node smoothing_controller.js <0|1> for GuassianBlur and BlockSmoothing");
//         process.exit(1);
//     }

//     const command = args[0];
//     if (command === "0") {
//         computeGaussianBlur();
//     } else if (command === "1") {
//         computeBlockSmoothing();
//     } else {
//         console.error("Invalid command. Use either '0' or '1' for GuassianBlur and BlockSmoothing");
//         process.exit(1);
//     }
// }

// main();

import * as grpc from "@grpc/grpc-js";
import { SmoothingOutput } from "./proto/smoothing";
import { SmoothingServicesClient } from "./proto/smoothing";

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
                'grpc.max_receive_message_length': 15 * 1024 * 1024 // 5MB
            };

            const clients = [
                new SmoothingServicesClient("localhost:9983", grpc.credentials.createInsecure(), options),
                // new SmoothingServicesClient("localhost:9998", grpc.credentials.createInsecure(), options),
                // new SmoothingServicesClient("localhost:9997", grpc.credentials.createInsecure(), options),
                // new SmoothingServicesClient("localhost:9996", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9995", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9994", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9993", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9992", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9991", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9990", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9989", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9988", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9987", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9986", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9985", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9984", grpc.credentials.createInsecure(), options),
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

                    console.log(flatArray.length)

                    let requestData = {
                        data: flatArray,
                        width: width,
                        height: height,
                        index: index
                    };

                    const grpcStartTime = new Date().getTime();

                    clients[index].computeGuassianBlur(requestData, (error, response: SmoothingOutput) => {
                        if (error) {
                            console.error(`Error for client ${index}:`, error);
                        } else {
                            console.log(`Completed GaussianBlur for client ${index}: ${response.smoothingFactor}`);
                            console.log(`Size of response: `, response.data.length / 4)
                        }
                        const grpcEndTime = new Date().getTime();
                        console.log(`Time taken for gRPC request ${index}: ${grpcEndTime - grpcStartTime} ms`);
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

