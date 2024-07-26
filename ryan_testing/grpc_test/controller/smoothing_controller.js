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
const smoothing_1 = require("./proto/smoothing");
const emptyRequest = {};
const clients = [
    new smoothing_1.SmoothingServicesClient("localhost:9994", grpc.credentials.createInsecure()),
    new smoothing_1.SmoothingServicesClient("localhost:9993", grpc.credentials.createInsecure()),
    new smoothing_1.SmoothingServicesClient("localhost:9992", grpc.credentials.createInsecure()),
    new smoothing_1.SmoothingServicesClient("localhost:9991", grpc.credentials.createInsecure()),
    new smoothing_1.SmoothingServicesClient("localhost:9990", grpc.credentials.createInsecure()),
];
function computeGaussianBlur() {
    clients.forEach((client, index) => {
        client.computeGuassianBlur(emptyRequest, (error, response) => {
            if (error) {
                console.error(`Error: ${error}`);
            }
            else {
                console.log(`Smoothing Output ${index + 1}: ${response === null || response === void 0 ? void 0 : response.value}`);
            }
        });
    });
}
function computeBlockSmoothing() {
    clients.forEach((client, index) => {
        client.computeBlockSmoothing(emptyRequest, (error, response) => {
            if (error) {
                console.error(`Error: ${error}`);
            }
            else {
                console.log(`Smoothing Output ${index + 1}: ${response === null || response === void 0 ? void 0 : response.value}`);
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
    }
    else if (command === "1") {
        computeBlockSmoothing();
    }
    else {
        console.error("Invalid command. Use either '0' or '1' for GuassianBlur and BlockSmoothing");
        process.exit(1);
    }
}
main();
