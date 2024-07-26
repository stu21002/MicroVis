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
const emptyRequest = {};
const client1 = new contouring_1.ContourServicesClient("localhost:9999", grpc.credentials.createInsecure());
const client2 = new contouring_1.ContourServicesClient("localhost:9998", grpc.credentials.createInsecure());
const client3 = new contouring_1.ContourServicesClient("localhost:9997", grpc.credentials.createInsecure());
const client4 = new contouring_1.ContourServicesClient("localhost:9996", grpc.credentials.createInsecure());
const client5 = new contouring_1.ContourServicesClient("localhost:9995", grpc.credentials.createInsecure());
function computeContour() {
    client1.computeContour(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Contour Output 1: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client2.computeContour(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Contour Output 2: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client3.computeContour(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Contour Output 3: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client4.computeContour(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Contour Output 4: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client5.computeContour(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Contour Output 5: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
}
computeContour();
