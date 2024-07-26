import * as grpc from "@grpc/grpc-js";
import { ContouringEmpty } from "./proto/contouring";
import { ContouringOutput } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";

const emptyRequest: ContouringEmpty = {};

const client1 = new ContourServicesClient(
    "localhost:9999",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

const client2 = new ContourServicesClient(
    "localhost:9998",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

const client3 = new ContourServicesClient(
    "localhost:9997",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

const client4 = new ContourServicesClient(
    "localhost:9996",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

const client5 = new ContourServicesClient(
    "localhost:9995",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

function computeContour(){

    client1.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output 1: ", response?.value);
        }
    });

    client2.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output 2: ", response?.value);
        }
    });

    client3.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output 3: ", response?.value);
        }
    });

    client4.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output 4: ", response?.value);
        }
    });

    client5.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output 5: ", response?.value);
        }
    });
}

computeContour();