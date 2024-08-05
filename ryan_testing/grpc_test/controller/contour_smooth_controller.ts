import * as grpc from "@grpc/grpc-js";
import { ContouringOutput } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";
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
                'grpc.max_receive_message_length': 15 * 1024 * 1024, // 5MB
                'grpc.request_timeout_ms': 60000
            };

            const contourClients = [
                new ContourServicesClient("localhost:9999", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9998", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9997", grpc.credentials.createInsecure(), options),
                // new ContourServicesClient("localhost:9996", grpc.credentials.createInsecure(), options),
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

            const smoothingClients = [
                new SmoothingServicesClient("localhost:9983", grpc.credentials.createInsecure(), options)
            ];

            slices.forEach((slice, index) => {
                try {
                    const sliceData = dataset.slice(slice);

                    if (sliceData === null) {
                        console.error(`Slice data for client ${index} is null`);
                        return;
                    }

                    let flatArray: number[] = [];
                    if (sliceData instanceof Float32Array) {
                        flatArray = Array.from(sliceData);
                    } else {
                        console.error('Unsupported sliceData format:', typeof sliceData);
                        return;
                    }

                    const smoothingData = {
                        data: flatArray,
                        width: width,
                        height: height
                    };
                    
                    const grpcSmoothStartTime = new Date().getTime();

                    let contouringArray;
                    let offsetContour;
                    let scaleContour = 1;
                    let dest_width;
                    let dest_height;

                    smoothingClients[index].computeGuassianBlur(smoothingData, (error, response: SmoothingOutput) => {
                        if (error) {
                            console.error(`Error for client ${index}:`, error);
                        } else {
                            console.log(`Smoothing Output for client ${index}: ${response?.smoothingFactor}`);

                            const grpcSmoothEndTime = new Date().getTime();
                            console.log(`Time taken for Smooth gRPC request ${index}: ${grpcSmoothEndTime - grpcSmoothStartTime} ms`);

                            contouringArray = response.data;
                            offsetContour = response.smoothingFactor - 1;
                            dest_width = response.destWidth;
                            dest_height = response.destHeight;

                            const contouringData = {
                                data: contouringArray,
                                width: dest_width,
                                height: dest_height,
                                offset: offsetContour,
                                scale: scaleContour
                            };

                            const grpcContourStartTime = new Date().getTime();

                            contourClients[index].computeContour(contouringData, (error, response: ContouringOutput) => {
                                if (error) {
                                    console.error(`Error for client ${index}:`, error);
                                } else {
                                    console.log(`Contouring Output for client ${index}: ${response?.value}`);
                                }
                                const grpcContourEndTime = new Date().getTime();
                                console.log(`Time taken for Contour gRPC request ${index}: ${grpcContourEndTime - grpcContourStartTime} ms`);
                            });
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