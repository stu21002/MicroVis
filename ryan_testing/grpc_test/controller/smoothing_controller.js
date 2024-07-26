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
const client1 = new smoothing_1.SmoothingServicesClient("localhost:9994", grpc.credentials.createInsecure());
const client2 = new smoothing_1.SmoothingServicesClient("localhost:9993", grpc.credentials.createInsecure());
const client3 = new smoothing_1.SmoothingServicesClient("localhost:9992", grpc.credentials.createInsecure());
const client4 = new smoothing_1.SmoothingServicesClient("localhost:9991", grpc.credentials.createInsecure());
const client5 = new smoothing_1.SmoothingServicesClient("localhost:9990", grpc.credentials.createInsecure());
function computeGuassianBlur() {
    client1.computeGuassianBlur(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Smoothing Output 1: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client2.computeGuassianBlur(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Smoothing Output 2: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client3.computeGuassianBlur(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Smoothing Output 3: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client4.computeGuassianBlur(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Smoothing Output 4: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
    client5.computeGuassianBlur(emptyRequest, (error, response) => {
        if (error) {
            console.error("Error: ", error);
        }
        else {
            console.log("Smoothing Output 5: ", response === null || response === void 0 ? void 0 : response.value);
        }
    });
}
computeGuassianBlur();
