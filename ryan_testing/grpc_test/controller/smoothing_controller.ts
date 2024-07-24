import * as grpc from "@grpc/grpc-js";
import { SmoothingEmpty } from "./proto/smoothing";
import { SmoothingOutput } from "./proto/smoothing";
import { SmoothingServicesClient } from "./proto/smoothing";

const emptyRequest: SmoothingEmpty = {};

const client1 = new SmoothingServicesClient(
    "localhost:9994",
    grpc.credentials.createInsecure()
) as SmoothingServicesClient;

const client2 = new SmoothingServicesClient(
    "localhost:9993",
    grpc.credentials.createInsecure()
) as SmoothingServicesClient;

const client3 = new SmoothingServicesClient(
    "localhost:9992",
    grpc.credentials.createInsecure()
) as SmoothingServicesClient;

const client4 = new SmoothingServicesClient(
    "localhost:9991",
    grpc.credentials.createInsecure()
) as SmoothingServicesClient;

const client5 = new SmoothingServicesClient(
    "localhost:9990",
    grpc.credentials.createInsecure()
) as SmoothingServicesClient;

function computeGuassianBlur(){

    client1.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Smoothing Output 1: ", response?.value);
        }
    });

    client2.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Smoothing Output 2: ", response?.value);
        }
    });

    client3.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Smoothing Output 3: ", response?.value);
        }
    });

    client4.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Smoothing Output 4: ", response?.value);
        }
    });

    client5.computeGuassianBlur(emptyRequest, (error, response: SmoothingOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Smoothing Output 5: ", response?.value);
        }
    });
}

computeGuassianBlur();