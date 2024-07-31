"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.H5Services = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
const H5ReaderService_1 = require("../../bin/src/proto/H5ReaderService");
const OpenFile_1 = require("../../bin/src/proto/OpenFile");
const Hdf5WorkerPool_1 = require("./Hdf5WorkerPool");
class H5Services {
    constructor(address, port = 8080, numWorkers = 1) {
        this.fileDims = new Map();
        this.serviceImp = {
            openFile: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                // Implement your logic here
                console.log("Open file called");
                const { directory, file, hdu } = call.request;
                const openFileAck = OpenFile_1.OpenFileACK.create();
                const fileOpenResponse = yield this.workerPool.openFile(directory, file, hdu);
                if (!(fileOpenResponse === null || fileOpenResponse === void 0 ? void 0 : fileOpenResponse.uuid)) {
                    console.error("no uuid");
                    openFileAck.success = false;
                    openFileAck.message = "Failed to open file";
                    callback(null, openFileAck);
                }
                else {
                    //Get to not require dir/file;
                    const fileInfoResponse = yield this.workerPool.getFileInfo(fileOpenResponse.uuid, directory, file, hdu);
                    if (!fileInfoResponse.fileInfoExtended) {
                        openFileAck.success = false;
                        openFileAck.message = "No file info";
                        callback(null, openFileAck);
                    }
                    else {
                        openFileAck.success = true;
                        openFileAck.message = fileOpenResponse.uuid;
                        openFileAck.fileInfo = fileInfoResponse.fileInfo;
                        openFileAck.fileInfoExtended = fileInfoResponse.fileInfoExtended;
                        const dimensionValues = {
                            width: fileInfoResponse.fileInfoExtended.width,
                            height: fileInfoResponse.fileInfoExtended.height,
                            depth: fileInfoResponse.fileInfoExtended.depth,
                            stokes: fileInfoResponse.fileInfoExtended.stokes,
                            dims: fileInfoResponse.fileInfoExtended.dimensions
                        };
                        this.fileDims.set(fileOpenResponse.uuid, dimensionValues);
                        callback(null, openFileAck);
                    }
                }
            }),
            checkStatus: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                console.log("Status called");
                const res = yield this.workerPool.checkStatus();
                callback(null, res);
            }),
            closeFile: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                console.log("Close file called");
                const response = H5ReaderService_1.StatusResponse.create();
                response.status = yield this.workerPool.closeFile(call.request.uuid);
                callback(null, response);
            }),
            getFileInfo: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                // Implement your logic here
                console.log("File Info called");
                callback(null, yield this.workerPool.getFileInfo(call.request.uuid, call.request.directory, call.request.file, call.request.hdu));
            }),
            getImageDataStream: (call) => __awaiter(this, void 0, void 0, function* () {
                let { uuid, start, count, regionType } = call.request;
                if (!regionType) {
                    regionType = H5ReaderService_1.RegionType.RECTANGLE;
                }
                const responses = this.workerPool.getImageDataStream(uuid, regionType, start, count);
                for (const response of (yield responses)) {
                    for (const chunk of (yield response)) {
                        call.write(chunk);
                    }
                }
                call.end();
            }),
            getSpatialProfile: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                // Implement your logic here
                console.log("Spatial Profile called");
                const { uuid, x, y } = call.request;
                const dimensions = this.fileDims.get(uuid);
                if (!dimensions) {
                    console.log("File Not Found");
                }
                else {
                    const spatial_profiles = yield this.workerPool.getSpatial(uuid, x, y, dimensions === null || dimensions === void 0 ? void 0 : dimensions.width, dimensions === null || dimensions === void 0 ? void 0 : dimensions.height);
                    const spatial_profile_data = H5ReaderService_1.SpatialProfileData.create();
                    spatial_profile_data.uuid = uuid;
                    spatial_profiles.profiles.forEach(profile => {
                        spatial_profile_data.profiles.push(profile);
                    });
                    callback(null, spatial_profile_data);
                }
            }),
            getSpectralProfile: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                console.log("Spectral Profile called");
                const { uuid, x, y, z, width, height, numPixels } = call.request;
                const spectral_profile = yield this.workerPool.getSpectralProfile(uuid, x, y, z, numPixels, width, height, H5ReaderService_1.RegionType.RECTANGLE);
                const spectral_profile_response = H5ReaderService_1.SpectralProfileResponse.create();
                // spectral_profile_response.rawValuesFp32 = float32ToBytes(spectral_profile.spectralData);
                spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
                callback(null, spectral_profile_response);
            }),
            getHistogram: (call, callback) => __awaiter(this, void 0, void 0, function* () {
                console.log("Histogram called");
                const { uuid, x, y, z, width, height, depth } = call.request;
                callback(null, yield this.workerPool.getHistogram(uuid, x, y, z, width, height, depth));
            })
        };
        const SERVICE_URL = `${address}:${port}`;
        this.workerPool = new Hdf5WorkerPool_1.Hdf5WorkerPool(numWorkers, "0.0.0.0", 8080);
        const server = new grpc_js_1.Server();
        server.addService(H5ReaderService_1.H5ServicesService, this.serviceImp);
        server.bindAsync(SERVICE_URL, grpc_js_1.ServerCredentials.createInsecure(), (error, port) => {
            if (error) {
                throw error;
            }
            console.log("server is running on", SERVICE_URL);
        });
        //Linking 
    }
}
exports.H5Services = H5Services;
