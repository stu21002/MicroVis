import * as grpc from "@grpc/grpc-js";
import { Empty } from "./proto/contouring";
import { Output } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";

const client = new ContourServicesClient(
    "localhost:9999",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

function computeContour(){
    const emptyRequest: Empty = {};

    client.computeContour(emptyRequest, (error, response: Output) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output: ", response?.value);
        }
    });
}

computeContour();