"use strict";
//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus
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
exports.Hdf5WorkerPool = void 0;
const uuid_1 = require("uuid");
const H5Reader_1 = require("./H5Reader");
const H5Readers_1 = require("../../bin/src/proto/H5Readers");
const arrays_1 = require("../utils/arrays");
class Hdf5WorkerPool {
    ready() {
        return Promise.all(this.readers.map((reader) => reader.ready()));
    }
    constructor(numReaders = 4, address, startPort = 8080) {
        this.fileDims = new Map();
        if (numReaders < 1) {
            throw new Error("reader count must be at least 1");
        }
        this.readers = [];
        for (let i = 0; i < numReaders; i++) {
            this.readers.push(new H5Reader_1.H5Reader(address, startPort + i));
        }
    }
    get connectedreaders() {
        return this.readers.filter((reader) => reader.connected);
    }
    get allConnected() {
        return this.readers.every(w => w.connected);
    }
    get primaryreader() {
        return this.readers[0];
    }
    get firstConnectedreader() {
        return this.readers.find((reader) => reader.connected);
    }
    get randomConnectedreader() {
        var _a;
        return (_a = this.connectedreaders) === null || _a === void 0 ? void 0 : _a[Math.floor(Math.random() * this.connectedreaders.length)];
    }
    checkStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.primaryreader.checkStatus({});
        });
    }
    openFile() {
        return __awaiter(this, arguments, void 0, function* (directory = "./files/", file, hdu = "") {
            //TODO Create map with uuid including important headers
            const uuid = (0, uuid_1.v4)();
            const promises = this.readers.map((reader) => reader.openFile({ directory, file, hdu, uuid }));
            const extendedInfo = (yield promises[0]).fileInfoExtended;
            if (!extendedInfo) {
                //Should return false, meaning error with opening the file
                throw new Error("Extended file info is undefined");
            }
            const dimensionValues = {
                width: extendedInfo.width,
                height: extendedInfo.height,
                depth: extendedInfo.depth,
                stokes: extendedInfo.stokes,
                dims: extendedInfo.dimensions
            };
            // console.log(dimensionValues);
            this.fileDims.set(uuid, dimensionValues);
            return Promise.all(promises).then(responses => {
                return responses.every(res => res.success) ? { uuid } : undefined;
            });
        });
    }
    closeFile(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = this.readers.map((reader) => reader.closeFile({ uuid }));
            return Promise.all(promises).then(responses => {
                return responses.every(res => res.status);
            });
        });
    }
    getFileInfo(uuid, directory, file, hdu) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return (_a = this.primaryreader) === null || _a === void 0 ? void 0 : _a.getFileInfo({ uuid, directory, file, hdu });
        });
    }
    // async getImageData(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {
    //   const reader = readerIndex !== undefined ? this.readers[readerIndex] : this.randomConnectedreader;
    //   return reader?.getRegionData({ uuid, start, count,regionType});
    // }
    //Refine Method
    getImageDataStream(uuid, regionType, start, count, readerIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            //possbly add data type
            const promises = new Array;
            if (count.length <= 2) {
                promises.push(this.randomConnectedreader.getImageDataStream({ uuid, start, count, regionType: H5Readers_1.RegionType.RECTANGLE }));
            }
            else {
                //Handling distributed reading
                for (let dim3 = start[2]; dim3 < start[2] + count[2]; dim3++) {
                    const tempStart = [start[0], start[1], dim3];
                    const tempCount = [start[0], start[1], 1];
                    console.log("Reader Pushed");
                    promises.push(this.randomConnectedreader.getImageDataStream({ uuid, start: tempStart, count: tempCount, regionType: H5Readers_1.RegionType.RECTANGLE }));
                }
            }
            return promises;
            return Promise.all(promises);
        });
    }
    //Relook at this
    getSpatial(uuid, x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (this.readers.length = 1){
            // const promises = new Array<Promise<{xProfile:number[],yProfile:number[]}>>();
            const dims = this.fileDims.get(uuid);
            if (!dims) {
                //Should return false, meaning file no longer open
                throw new Error("Extended file info is undefined");
            }
            const promises = new Array;
            if (this.readers.length == 1) {
                //y
                promises.push((this.readers[0].getImageDataStream({ uuid, regionType: H5Readers_1.RegionType.LINE, start: [x, 0, 0, 0], count: [1, dims.height, 1, 1] })));
                //x
                promises.push((this.readers[0].getImageDataStream({ uuid, regionType: H5Readers_1.RegionType.LINE, start: [0, y, 0, 0], count: [dims.width, 1, 1, 1] })));
            }
            else {
                //y
                promises.push((this.readers[0].getImageDataStream({ uuid, regionType: H5Readers_1.RegionType.LINE, start: [x, 0, 0, 0], count: [1, dims.height, 1, 1] })));
                //x
                promises.push((this.readers[1].getImageDataStream({ uuid, regionType: H5Readers_1.RegionType.LINE, start: [0, y, 0, 0], count: [dims.width, 1, 1, 1] })));
            }
            return Promise.all(promises).then(([yImageData, xImageData]) => {
                const profiles = [];
                let xStart = 0;
                for (const profile of xImageData) {
                    const xEnd = xStart + profile.numPixels;
                    profiles.push({ coordinate: "x", rawValuesFp32: profile.rawValuesFp32, start: xStart, end: xEnd });
                    xStart = xEnd;
                }
                let yStart = 0;
                for (const profile of yImageData) {
                    const yEnd = yStart + profile.numPixels;
                    profiles.push({ coordinate: "y", rawValuesFp32: profile.rawValuesFp32, start: yStart, end: yEnd });
                    yStart = yEnd;
                }
                return { profiles };
            });
        });
    }
    getHistogram(uuid, x, y, z, width, height, depth) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = this.randomConnectedreader;
            return reader.getHistogram({ uuid, start: [x, y, 0, 0], count: [width, height, 1, 1] });
        });
    }
    //Cube Hist?? Mostly fits
    getSpectralProfileStream(uuid_2, x_1, y_1, z_1, numPixels_1) {
        return __awaiter(this, arguments, void 0, function* (uuid, x, y, z, numPixels, width = 1, height = 1, regionType, diameter, numWorkers) {
            if (!numWorkers) {
                numWorkers = this.readers.length;
            }
            const pixelsPerWorker = Math.floor(width / numWorkers);
            const promises = new Array();
            for (let i = 0; i < numWorkers; i++) {
                const xStart = x + i * pixelsPerWorker;
                const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
                const reader = this.readers[i % this.readers.length];
                // promises.push(reader.getSpectralProfileStream({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));
                promises.push(reader.getSpectralProfile({ uuid, regionType: H5Readers_1.RegionType.RECTANGLE, x: xStart, y, z, width: numPixelsInChunk, height, numPixels }));
            }
            const spectralData = new Float64Array(numPixels);
            const statistic = new Float64Array(numPixels).fill(0);
            const counts = Array(numPixels).fill(0);
            return Promise.all(promises).then(res => {
                //Adding values as they come in, avoids heap error
                for (const response of res) {
                    const values = (0, arrays_1.bytesToFloat32)(response.rawValuesFp32);
                    const count = (0, arrays_1.bytesToInt32)(response.counts);
                    for (let index = 0; index < numPixels; index++) {
                        statistic[index] += values[index];
                        counts[index] += count[index];
                    }
                }
                for (let index = 0; index < numPixels; index++) {
                    console.log(statistic);
                    console.log(counts);
                    spectralData[index] = statistic[index] / counts[index];
                }
                return { spectralData };
            });
        });
    }
}
exports.Hdf5WorkerPool = Hdf5WorkerPool;
function getMask(startX, startY, numX, numY, diameter) {
    let mask = [];
    const pow_radius = Math.pow(diameter / 2.0, 2);
    const centerX = (diameter - 1) / 2.0;
    const centerY = (diameter - 1) / 2.0;
    let index = 0;
    for (let y = startY; y < startY + numY; y++) {
        const pow_y = Math.pow(y - centerY, 2);
        for (let x = startX; x < startX + numX; x++) {
            mask[index++] = (pow_y + Math.pow(x - centerX, 2) <= pow_radius);
        }
    }
    return mask;
}
