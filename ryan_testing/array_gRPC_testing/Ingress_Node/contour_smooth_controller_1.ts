import * as grpc from "@grpc/grpc-js";
import { ContouringOutput } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";
import { SmoothingOutput } from "./proto/smoothing";
import { SmoothingServicesClient } from "./proto/smoothing";

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
                'grpc.max_send_message_length': 60 * 1024 * 1024, // 15MB
                'grpc.max_receive_message_length': 60 * 1024 * 1024, // 5MB
                'grpc.request_timeout_ms': 60000
            };

            const contourClients = [
                new ContourServicesClient("localhost:9999", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9998", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9997", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9996", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9995", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9994", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9993", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9992", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9991", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9990", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9989", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9988", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9987", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9986", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9985", grpc.credentials.createInsecure(), options),
                new ContourServicesClient("localhost:9984", grpc.credentials.createInsecure(), options),
            ];

            const smoothingClients = [
                new SmoothingServicesClient("localhost:9983", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9982", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9981", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9980", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9979", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9978", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9977", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9976", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9975", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9974", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9973", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9972", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9971", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9970", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9969", grpc.credentials.createInsecure(), options),
                new SmoothingServicesClient("localhost:9968", grpc.credentials.createInsecure(), options)
            ];

            const smoothingMode = parseInt(process.argv[2]) || 0;

            slices.forEach((slice, index) => {
                try {
                    const sliceData = dataset.slice(slice);

                    if (sliceData === null) {
                        console.error(`Slice data for client ${index} is null`);
                        return;
                    }

                    let flatArray;
                    if (sliceData instanceof Float32Array) {
                        flatArray = Array.from(sliceData);
                    } else {
                        console.error('Unsupported sliceData format:', typeof sliceData);
                        return;
                    }

                    console.log(flatArray.length)

                    const smoothingData = {
                        data: flatArray,
                        width: width,
                        height: height,
                        index: index
                    };
                    
                    let contouringArray;
                    let offsetContour;
                    let scaleContour;
                    let dest_width;
                    let dest_height;

                    //console.log("Before Smoothing: ", grpcSmoothStartTime)

                    if(smoothingMode == 0){

                        let contouringData = {
                            data: flatArray,
                            width: width,
                            height: height,
                            offset: 0,
                            scale: 1,
                            index: index,
                        };

                        const grpcContourSendTime = new Date().getTime();

                        contourClients[index].computeContour(contouringData, (error, response: ContouringOutput) => {
                            // Record the time when the response is received (receive time)
                            const grpcContourReceiveTime = new Date().getTime();

                            if (error) {
                                console.error(`Error for clientNA ${index}:`, error);
                            } else {
                                console.log(`Contouring Output for client ${index}: ${response?.value}`);
                            }

                            // Calculate and display the time taken for send and receive separately
                            console.log(`Time grpc data was sent ${index}: ${grpcContourSendTime % 1000000} ms`);
                            console.log(`Total gRPC Time ${index}: ${grpcContourReceiveTime - grpcContourSendTime} ms \n`);
                        });
                    }
                    else if(smoothingMode == 1){

                        const grpcSmoothStartTime = new Date().getTime();

                        smoothingClients[index].computeGuassianBlur(smoothingData, (error, response: SmoothingOutput) => {
                            if (error) {
                                console.error(`Error for client ${index}:`, error);
                            } else {
                                console.log(`Gaussian Smoothing Output for client ${index}: Gaussian Smoothing Complete`);
                                //console.log(`Size of response: `, response.data.length / 4);
    
                                const grpcSmoothEndTime = new Date().getTime();
                                console.log(`Time grpc data was sent ${index}: ${grpcSmoothStartTime % 1000000} ms`);
                                console.log(`Total gRPC Time ${index}: ${grpcSmoothEndTime - grpcSmoothStartTime} ms \n`);
    
                                contouringArray = response.data;
                                offsetContour = response.smoothingFactor - 1;
                                dest_width = response.destWidth;
                                dest_height = response.destHeight;
                                scaleContour = 1;
    
                                const contouringData = {
                                    data: contouringArray,
                                    width: dest_width,
                                    height: dest_height,
                                    offset: offsetContour,
                                    scale: scaleContour,
                                    index: index
                                };
    
                                const grpcContourSendTime = new Date().getTime();

                                contourClients[index].computeContour(contouringData, (error, response: ContouringOutput) => {
                                    // Record the time when the response is received (receive time)
                                    const grpcContourReceiveTime = new Date().getTime();

                                    if (error) {
                                        console.error(`Error for client ${index}:`, error);
                                    } else {
                                        console.log(`Contouring Output for client ${index}: ${response?.value}`);
                                    }

                                    // Calculate and display the time taken for send and receive separately
                                    console.log(`Time grpc data was sent ${index}: ${grpcContourSendTime % 1000000} ms`);
                                    console.log(`Total gRPC Time ${index}: ${grpcContourReceiveTime - grpcContourSendTime} ms \n`);
                                });
                            }    
                        });
                    }
                    else{

                        const grpcSmoothStartTime = new Date().getTime();

                        smoothingClients[index].computeBlockSmoothing(smoothingData, (error, response: SmoothingOutput) => {
                            if(error){
                                console.error(`Error for client ${index}:`, error);
                            }
                            else{
                                console.log(`Block Smoothing Output for client ${index}: Block Smoothing Complete`);
                                //console.log(`Size of response: `, response.data.length / 4);
    
                                const grpcSmoothEndTime = new Date().getTime();
                                console.log(`Time grpc data was sent ${index}: ${grpcSmoothStartTime % 1000000} ms`);
                                console.log(`Total gRPC Time ${index}: ${grpcSmoothEndTime - grpcSmoothStartTime} ms \n`);
    
                                contouringArray = response.data;
                                offsetContour = 0;
                                dest_width = response.destWidth;
                                dest_height = response.destHeight;
                                scaleContour = response.smoothingFactor
    
                                const contouringData = {
                                    data: contouringArray,
                                    width: dest_width,
                                    height: dest_height,
                                    offset: offsetContour,
                                    scale: scaleContour,
                                    index: index
                                };
    
                                const grpcContourStartTime = new Date().getTime();
                                //console.log("Before Contour: ", grpcContourStartTime);
                                //console.log("Size of array: ", contouringArray.length / 4)
    
                                contourClients[index].computeContour(contouringData, (error, response: ContouringOutput) => {
                                    const grpcContourEndTime = new Date().getTime();
                                    if (error) {
                                        console.error(`Error for client ${index}:`, error);
                                    } else {
                                        console.log(`Contouring Output for client ${index}: ${response?.value}`);
                                        
                                    }
                                    console.log(`Time grpc data was sent ${index}: ${grpcContourStartTime % 1000000} ms`);
                                    console.log(`Total gRPC Time ${index}: ${grpcContourEndTime - grpcContourStartTime} ms \n`);
                                });
                            }
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