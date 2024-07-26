import * as grpc from "@grpc/grpc-js";
import { SmoothingEmpty } from "./proto/smoothing";
import { SmoothingOutput } from "./proto/smoothing";
import { SmoothingServicesClient } from "./proto/smoothing";

const emptyRequest: SmoothingEmpty = {};

const clients = [
    new SmoothingServicesClient("localhost:9994", grpc.credentials.createInsecure()),
    new SmoothingServicesClient("localhost:9993", grpc.credentials.createInsecure()),
    new SmoothingServicesClient("localhost:9992", grpc.credentials.createInsecure()),
    new SmoothingServicesClient("localhost:9991", grpc.credentials.createInsecure()),
    new SmoothingServicesClient("localhost:9990", grpc.credentials.createInsecure()),
];

function computeGaussianBlur() {
    clients.forEach((client, index) => {
        client.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
            if (error) {
                console.error(`Error: ${error}`);
            } else {
                console.log(`Smoothing Output ${index + 1}: ${response?.value}`);
            }
        });
    });
}

function computeBlockSmoothing() {
    clients.forEach((client, index) => {
        client.computeBlockSmoothing(emptyRequest, (error, response: SmoothingOutput) => {
            if (error) {
                console.error(`Error: ${error}`);
            } else {
                console.log(`Smoothing Output ${index + 1}: ${response?.value}`);
            }
        });
    });
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Usage: node smoothing_controller.js <0|1> for GuassianBlur and BlockSmoothing");
        process.exit(1);
    }

    const command = args[0];
    if (command === "0") {
        computeGaussianBlur();
    } else if (command === "1") {
        computeBlockSmoothing();
    } else {
        console.error("Invalid command. Use either '0' or '1' for GuassianBlur and BlockSmoothing");
        process.exit(1);
    }
}

main();
