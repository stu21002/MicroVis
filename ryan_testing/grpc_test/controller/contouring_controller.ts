import * as grpc from "@grpc/grpc-js";
import { ContouringEmpty } from "./proto/contouring";
import { ContouringOutput } from "./proto/contouring";
import { ContourServicesClient } from "./proto/contouring";

const client = new ContourServicesClient(
    "localhost:9999",
    grpc.credentials.createInsecure()
) as ContourServicesClient;

function computeContour(){
    const emptyRequest: ContouringEmpty = {};

    client.computeContour(emptyRequest, (error, response: ContouringOutput) => {
        if(error){
            console.error("Error: ", error);
        } else {
            console.log("Contour Output: ", response?.value);
        }
    });
}

computeContour();