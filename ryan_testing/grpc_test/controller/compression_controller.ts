import * as grpc from "@grpc/grpc-js";
import { CompressionEmpty } from "./proto/compression";
import { CompressionOutput } from "./proto/compression";
import { CompressionServicesClient } from "./proto/compression";

const emptyRequest: CompressionEmpty = {};

const clients = [
    new CompressionServicesClient("localhost:9989", grpc.credentials.createInsecure()),
    new CompressionServicesClient("localhost:9988", grpc.credentials.createInsecure()),
    new CompressionServicesClient("localhost:9987", grpc.credentials.createInsecure()),
    new CompressionServicesClient("localhost:9986", grpc.credentials.createInsecure()),
    new CompressionServicesClient("localhost:9985", grpc.credentials.createInsecure()),
];

function computeCompression() {
    clients.forEach((client, index) => {
        client.computeCompression(emptyRequest, (error, response: CompressionOutput) => {
            if (error) {
                console.error(`Error: ${error}`);
            } else {
                console.log(`Compression Output ${index + 1}: ${response?.value}`);
            }
        });
    });
}

function computeNanEncodingsBlock() {
    clients.forEach((client, index) => {
        client.computeNanEncodingsBlock(emptyRequest, (error, response: CompressionOutput) => {
            if (error) {
                console.error(`Error: ${error}`);
            } else {
                console.log(`GetNanEncodingsBlock Output ${index + 1}: ${response?.value}`);
            }
        });
    });
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Usage: node smoothing_controller.js <0|1> for Compression and GetNanEncodingsBlock");
        process.exit(1);
    }

    const command = args[0];
    if (command === "0") {
        computeCompression();
    } else if (command === "1") {
        computeNanEncodingsBlock();
    } else {
        console.error("Invalid command. Use either '0' or '1' for Compression and GetNanEncodingsBlock");
        process.exit(1);
    }
}

main();