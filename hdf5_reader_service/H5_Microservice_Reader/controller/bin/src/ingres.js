"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ingres = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
const H5ReaderService_1 = require("./bin/src/proto/H5ReaderService");
const util_1 = require("util");
class Ingres {
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
    constructor(address, port = 8079) {
        //Spacital Profiles, getImageData for all X given a Y and visa versa...
        this._connected = false;
        this._readyResolves = [];
        this._rejectResolves = [];
        const WORKER_POOL_URL = `${address}:${port}`;
        const workerPoolConn = new H5ReaderService_1.H5ServicesClient(WORKER_POOL_URL, grpc_js_1.credentials.createInsecure());
        //Linking 
        this.checkStatus = (0, util_1.promisify)(workerPoolConn.checkStatus).bind(workerPoolConn);
        this.getFileInfo = (0, util_1.promisify)(workerPoolConn.getFileInfo).bind(workerPoolConn);
        this.openFile = (0, util_1.promisify)(workerPoolConn.openFile).bind(workerPoolConn);
        this.closeFile = (0, util_1.promisify)(workerPoolConn.closeFile).bind(workerPoolConn);
        // this.getRegionData = promisify<RegionDataRequest, RegionDataResponse>(client.getRegion).bind(client);
        this.getSpectralProfile = (0, util_1.promisify)(workerPoolConn.getSpectralProfile).bind(workerPoolConn);
        this.getSpatialProfile = (0, util_1.promisify)(workerPoolConn.getSpatialProfile).bind(workerPoolConn);
        this.getHistogram = (0, util_1.promisify)(workerPoolConn.getHistogram).bind(workerPoolConn);
        //   this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(workerPoolConn.getHistogramDist).bind(workerPoolConn);
        this.getImageDataStream = (request) => {
            return new Promise((resolve, reject) => {
                const call = workerPoolConn.getImageDataStream(request);
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
        workerPoolConn.waitForReady(Date.now() + 4000, (err) => {
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
exports.Ingres = Ingres;
