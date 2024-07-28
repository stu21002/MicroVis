import * as grpc from "@grpc/grpc-js";
import { ContouringEmpty } from "./proto/contouring";
import { ContouringOutput } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";

const emptyRequest: ContouringEmpty = {};

const clients = [
    new ContourServicesClient("localhost:9994", grpc.credentials.createInsecure()),
    new ContourServicesClient("localhost:9993", grpc.credentials.createInsecure()),
    new ContourServicesClient("localhost:9992", grpc.credentials.createInsecure()),
    new ContourServicesClient("localhost:9991", grpc.credentials.createInsecure()),
    new ContourServicesClient("localhost:9990", grpc.credentials.createInsecure()),
];

function computeContour() {
    clients.forEach((client, index) => {
        client.computeContour(emptyRequest, (error, response: ContouringOutput) => {
            if (error) {
                console.error(`Error: ${error}`);
            } else {
                console.log(`Contouring Output ${index + 1}: ${response?.value}`);
            }
        });
    });
}

function main() {
    computeContour()
}

main();