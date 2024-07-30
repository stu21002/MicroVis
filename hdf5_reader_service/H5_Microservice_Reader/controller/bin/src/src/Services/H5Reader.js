"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.H5Reader = void 0;
//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus
//Provides access to all endpoints of the hdf5 reader microservice 
const H5Readers_1 = require("../../bin/src/proto/H5Readers");
const grpc_js_1 = require("@grpc/grpc-js");
const util_1 = require("util");
class H5Reader {
    get connected() {
        return this._connected;
    }
    ready() {
        return new Promise((resolve, reject) => {
            if (this._connected) {
                resolve();
                return;
            }
            this._readyResolves.push(resolve);
            this._rejectResolves.push(reject);
        });
    }
    constructor(address, port = 8080) {
        //Spacital Profiles, getImageData for all X given a Y and visa versa...
        this._connected = false;
        this._readyResolves = [];
        this._rejectResolves = [];
        const WORKER_URL = `${address}:${port}`;
        const client = new H5Readers_1.H5ReadersClient(WORKER_URL, grpc_js_1.credentials.createInsecure());
        //Linking 
        this.checkStatus = (0, util_1.promisify)(client.checkStatus).bind(client);
        this.getFileInfo = (0, util_1.promisify)(client.getFileInfo).bind(client);
        // this.getRegionData = promisify<RegionDataRequest, RegionDataResponse>(client.getRegion).bind(client);
        this.getSpectralProfile = (0, util_1.promisify)(client.getSpectralProfile).bind(client);
        this.openFile = (0, util_1.promisify)(client.openFile).bind(client);
        this.closeFile = (0, util_1.promisify)(client.closeFile).bind(client);
        this.getHistogram = (0, util_1.promisify)(client.getHistogram).bind(client);
        this.getHistogramDist = (0, util_1.promisify)(client.getHistogramDist).bind(client);
        this.getImageDataStream = (request) => {
            return new Promise((resolve, reject) => {
                const call = client.getImageDataStream(request);
                const imageDataResponses = [];
                call.on('data', (response) => {
                    //Possible Conditions
                    imageDataResponses.push(response);
                });
                call.on('end', () => {
                    resolve(imageDataResponses);
                });
                call.on('error', (err) => {
                    reject(err);
                });
            });
        };
        // this.getSpectralProfileStream = (request: SpectralProfileRequest) => {
        //   return new Promise<{statistic:Float64Array,counts:Number[]}>((resolve, reject) => {
        //     const call = client.getSpectralProfileStream(request);
        //     // const responses: SpectralProfileResponse[] = [];
        //     const statistic = new Float64Array(request.numPixels).fill(0);
        //     const counts = Array(request.numPixels).fill(0);
        //     call.on('data', (response: SpectralProfileResponse) => {
        //       // responses.push(response);
        //       response.data.forEach((value,index) =>{
        //         if (isFinite(value)){
        //           statistic[index]=value;
        //         }
        //       })
        //       response.count.forEach((value,index) =>{
        //         if (isFinite(value)){
        //           counts[index]=value;
        //         }
        //       })
        //     });
        //     call.on('end', () => {
        //       resolve({statistic,counts});
        //     });
        //     call.on('error', (err) => {
        //       reject(err);
        //     });
        //   });
        // };
        client.waitForReady(Date.now() + 4000, (err) => {
            if (err) {
                console.log(port + " : false");
                console.error(err);
                this._connected = false;
                for (const reject of this._rejectResolves) {
                    reject(err);
                }
            }
            else {
                // console.log(port + " : true")
                this._connected = true;
                for (const resolve of this._readyResolves) {
                    resolve();
                }
            }
        });
    }
}
exports.H5Reader = H5Reader;
