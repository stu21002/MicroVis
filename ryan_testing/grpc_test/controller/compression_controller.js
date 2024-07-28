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
const compression_1 = require("./proto/compression");
const emptyRequest = {};
const clients = [
    new compression_1.CompressionServicesClient("localhost:9989", grpc.credentials.createInsecure()),
    new compression_1.CompressionServicesClient("localhost:9988", grpc.credentials.createInsecure()),
    new compression_1.CompressionServicesClient("localhost:9987", grpc.credentials.createInsecure()),
    new compression_1.CompressionServicesClient("localhost:9986", grpc.credentials.createInsecure()),
    new compression_1.CompressionServicesClient("localhost:9985", grpc.credentials.createInsecure()),
];
function computeCompression() {
    clients.forEach((client, index) => {
        client.computeCompression(emptyRequest, (error, response) => {
            if (error) {
                console.error(`Error: ${error}`);
            }
            else {
                console.log(`Compression Output ${index + 1}: ${response === null || response === void 0 ? void 0 : response.value}`);
            }
        });
    });
}
function computeNanEncodingsBlock() {
    clients.forEach((client, index) => {
        client.computeNanEncodingsBlock(emptyRequest, (error, response) => {
            if (error) {
                console.error(`Error: ${error}`);
            }
            else {
                console.log(`GetNanEncodingsBlock Output ${index + 1}: ${response === null || response === void 0 ? void 0 : response.value}`);
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
    }
    else if (command === "1") {
        computeNanEncodingsBlock();
    }
    else {
        console.error("Invalid command. Use either '0' or '1' for Compression and GetNanEncodingsBlock");
        process.exit(1);
    }
}
main();
