"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const grpc = __importStar(require("@grpc/grpc-js"));
const contouring_1 = require("./proto/contouring");
(async () => {
    const h5wasm = await import('h5wasm/node');
    await h5wasm.ready;
    const startTime = new Date().getTime();
    const file = new h5wasm.File("/home/ryanlekker/Honors_Project/Git_Repo/MicroVis/ryan_testing/grpc_test/files/Big.hdf5", "r");
    const keys = file.keys();
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
            const quarterWidth = Math.floor(width / 4);
            const quarterHeight = Math.floor(height / 4);
            const slices = [
                [[0, 1, null], [0, 1, null], [0, quarterWidth, null], [0, quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [quarterWidth, 2 * quarterWidth, null], [0, quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [2 * quarterWidth, 3 * quarterWidth, null], [0, quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [3 * quarterWidth, width, null], [0, quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [0, quarterWidth, null], [quarterHeight, 2 * quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [quarterWidth, 2 * quarterWidth, null], [quarterHeight, 2 * quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [2 * quarterWidth, 3 * quarterWidth, null], [quarterHeight, 2 * quarterHeight, null]],
                [[0, 1, null], [0, 1, null], [3 * quarterWidth, width, null], [quarterHeight, 2 * quarterHeight, null]]
            ];
            const options = {
                'grpc.max_send_message_length': 5 * 1024 * 1024,
                'grpc.max_receive_message_length': 5 * 1024 * 1024 // 5MB
            };
            const clients = [
                new contouring_1.ContourServicesClient("localhost:9999", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9998", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9997", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9996", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9995", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9994", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9993", grpc.credentials.createInsecure(), options),
                new contouring_1.ContourServicesClient("localhost:9992", grpc.credentials.createInsecure(), options),
            ];
            slices.forEach((slice, index) => {
                try {
                    const sliceData = dataset.slice(slice);
                    if (sliceData === null) {
                        console.error(`Slice data for client ${index} is null`);
                        return;
                    }
                    let flatArray = [];
                    if (sliceData instanceof Float32Array) {
                        flatArray = Array.from(sliceData);
                        console.log("Flat Array: ", flatArray);
                    }
                    else {
                        console.error('Unsupported sliceData format:', typeof sliceData);
                        return;
                    }
                    const requestData = {
                        data: flatArray,
                        width: quarterWidth,
                        height: quarterHeight
                    };
                    const grpcStartTime = new Date().getTime();
                    clients[index].computeContour(requestData, (error, response) => {
                        if (error) {
                            console.error(`Error for client ${index}:`, error);
                        }
                        else {
                            console.log(`Contouring Output for client ${index}: ${response?.value}`);
                        }
                        const grpcEndTime = new Date().getTime();
                        console.log(`Time taken for gRPC request ${index}: ${grpcEndTime - grpcStartTime} ms`);
                    });
                }
                catch (error) {
                    console.error(`Error processing slice for client ${index}:`, error);
                }
            });
        }
        else {
            console.error('maxshape is null or undefined');
        }
    }
    else {
        console.error('Dataset not found or is not a Dataset');
    }
    const endTime = new Date().getTime();
    console.log(`Total time taken: ${endTime - startTime} ms`);
    file.close();
})();
// const clients = [
//     new ContourServicesClient("localhost:9999", grpc.credentials.createInsecure()),
//     new ContourServicesClient("localhost:9998", grpc.credentials.createInsecure()),
//     new ContourServicesClient("localhost:9997", grpc.credentials.createInsecure()),
//     new ContourServicesClient("localhost:9996", grpc.credentials.createInsecure()),
//     new ContourServicesClient("localhost:9995", grpc.credentials.createInsecure()),
// ];
// function computeContour() {
//     clients.forEach((client, index) => {
//         client.computeContour(emptyRequest, (error, response: ContouringOutput) => {
//             if (error) {
//                 console.error(`Error: ${error}`);
//             } else {
//                 console.log(`Contouring Output ${index + 1}: ${response?.value}`);
//             }
//         });
//     });
// }
// function main() {
//     computeContour();
// }
//main();
