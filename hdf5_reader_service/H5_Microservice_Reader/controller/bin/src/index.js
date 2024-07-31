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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const H5ReaderService_1 = require("./bin/src/proto/H5ReaderService");
const ingres_1 = require("./ingres");
const H5Services_1 = require("./src/Services/H5Services");
const Hdf5WorkerPool_1 = require("./src/Services/Hdf5WorkerPool");
const arrays_1 = require("./src/utils/arrays");
const coord_1 = require("./src/utils/coord");
// const args = process.argv.slice(2); // slice(2) removes the first two elements which are 'node' and the script name
// if (args.length === 0) {
//   console.log("No arguments provided.");
// } else {
//   console.log("Command line arguments:", args);
// }
// const numbers = args.map(arg => Number(arg));
// // Example: Accessing specific arguments
// const arg1 = numbers[0];
// const arg2 = numbers[1];
// const arg3 = numbers[2];
// const arg4 = numbers[3];
// const arg5 = numbers[4];
const { startingX, startingY, adjustedWidth, adjustedHeight } = (0, coord_1.getCoords)(600, 600, 400, 400);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const numWorkers = 1;
        const workerPool = new Hdf5WorkerPool_1.Hdf5WorkerPool(numWorkers, "0.0.0.0", 8080);
        yield workerPool.ready();
        console.log({ startingX, startingY, adjustedWidth, adjustedHeight });
        console.log();
        console.time("getStatus");
        yield workerPool.checkStatus();
        console.timeEnd("getStatus");
        console.log();
        console.time("OpenFile");
        let fileOpenResponse = yield workerPool.openFile("/home/stuart/", "Small.hdf5", "0");
        if (!(fileOpenResponse === null || fileOpenResponse === void 0 ? void 0 : fileOpenResponse.uuid)) {
            console.error("no uuid");
            return false;
        }
        console.timeEnd("OpenFile");
        console.log();
        console.time("Hist");
        const histRes = yield workerPool.getHistogram(fileOpenResponse.uuid, startingX, startingY, 0, adjustedWidth, adjustedHeight, 0);
        console.timeEnd("Hist");
        console.log(histRes.bins.slice(0, 6));
        console.log();
        console.time("Spectral Profile");
        const respones1 = yield workerPool.getSpectralProfile(fileOpenResponse.uuid, startingX, startingY, 0, 5, adjustedWidth, adjustedHeight);
        // console.log("Main First five values : " + respones1.spectralData.subarray(0,5));
        console.timeEnd("Spectral Profile");
        console.log();
        console.time("ImageData");
        const respones2 = yield workerPool.getImageDataStream(fileOpenResponse.uuid, H5ReaderService_1.RegionType.RECTANGLE, [200, 200, 0], [200, 200, 10]);
        // console.log(respones2[0].rawValuesFp32.buffer)
        // console.log(bytesToFloat32(respones2[0].rawValuesFp32));
        console.timeEnd("ImageData");
        console.log();
        try {
            for (var _d = true, respones2_1 = __asyncValues(respones2), respones2_1_1; respones2_1_1 = yield respones2_1.next(), _a = respones2_1_1.done, !_a; _d = true) {
                _c = respones2_1_1.value;
                _d = false;
                const iterator = _c;
                console.log(yield iterator);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = respones2_1.return)) yield _b.call(respones2_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // console.time("Spatial");
        // const respones3 = await workerPool.getSpatial(fileOpenResponse.uuid,400,400);
        // // console.log(respones3);
        // console.timeEnd("Spatial");
        // console.log();
        workerPool.closeFile(fileOpenResponse.uuid);
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        const h5Services = new H5Services_1.H5Services("0.0.0.0", 8079, 4);
        yield h5Services.workerPool.ready();
        const ingres = new ingres_1.Ingres("0.0.0.0", 8079);
        const fileOpenResponse = yield ingres.openFile({ uuid: "", file: "Small.hdf5", directory: "/home/stuart/", hdu: "0" });
        const uuid1 = fileOpenResponse.message;
        if (!uuid1) {
            console.error("no uuid");
            return false;
        }
        const histgram_request = H5ReaderService_1.SetHistogramReq.create();
        histgram_request.x = startingX;
        histgram_request.y = startingY;
        histgram_request.z = 0;
        histgram_request.width = adjustedWidth;
        histgram_request.height = adjustedHeight;
        histgram_request.depth = 0;
        histgram_request.uuid = uuid1;
        console.time("Hist");
        const histRes = yield ingres.getHistogram(histgram_request);
        console.timeEnd("Hist");
        console.log(histRes.bins.slice(0, 6));
        console.log();
        const spectral_request = H5ReaderService_1.SpectralProfileRequest.create();
        spectral_request.x = startingX;
        spectral_request.y = startingY;
        spectral_request.z = 0;
        spectral_request.height = adjustedHeight;
        spectral_request.width = adjustedWidth;
        spectral_request.numPixels = 1917;
        spectral_request.uuid = uuid1;
        spectral_request.regionType = H5ReaderService_1.RegionType.RECTANGLE;
        console.time("Spectral Profile");
        const spec_res = yield ingres.getSpectralProfile(spectral_request);
        console.log("Ingres First five values : " + (0, arrays_1.bytesToFloat32)(spec_res.rawValuesFp32).subarray(0, 5));
        console.timeEnd("Spectral Profile");
        console.log();
        const image_request = H5ReaderService_1.ImageDataRequest.create();
        image_request.uuid = uuid1;
        image_request.start = [400, 400, 0];
        image_request.count = [200, 200, 4];
        image_request.regionType = H5ReaderService_1.RegionType.RECTANGLE;
        console.time("ImageData");
        const image_res = yield ingres.getImageDataStream(image_request);
        console.log(image_res);
        // console.log(image_res(respones2[0].rawValuesFp32));
        console.timeEnd("ImageData");
        console.log();
        const spatial_request = H5ReaderService_1.SetSpatialReq.create();
        spatial_request.uuid = uuid1;
        spatial_request.x = 200;
        spatial_request.y = 200;
        console.time("Spatial");
        const respones3 = yield ingres.getSpatialProfile(spatial_request);
        console.log(respones3);
        console.timeEnd("Spatial");
        console.log();
        ingres.closeFile({ uuid: uuid1 });
    });
}
// main()
test();
function main2() {
    const diameter = 5;
    const full = getMask(0, 0, diameter, diameter, diameter);
    console.log(full);
    // let space = "";
    // for (let i = 0; i < 5; i++) {
    //   const length = 2;
    //   const diameter = 30;
    //   const mask = getMask(i*2,0,2,10,10);
    //   const full = getMask(0,0,diameter,diameter,diameter);
    // console.log(mask);
    // for (let i = 0; i < mask.length; i += length) {
    //   const row = mask.slice(i, i + length);
    //   // console.log(row.length);
    //   console.log(space+ row.join(' '));
    // }
    // for (let i = 0; i < full.length; i += diameter) {
    //   const row = full.slice(i, i + diameter);
    //   console.log(row.join(' '));
    // }
    // space=space+"    ";
    // for (let y = 0; y < diameter; y++) {
    //   for (let x = 0; x < diameter; x++) {
    //     const index = y * diameter + x;
    //     console.log(mask[index]);
    //   }
    // }
    // }
}
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
// main2()
