// import { credentials } from "@grpc/grpc-js";
// import { promisify } from "util";

// // import { FitsServicesClient } from "./proto/FitsReaderService";
// //Protos
// import { FileInfoRequest, FileInfoResponse } from "./proto/FileInfo";
// import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./proto/OpenFile";
// import { Empty, StatusResponse } from "./proto/defs";
// import { ImageDataRequest, ImageDataResponse } from "./proto/ImageData";
// import { SpectralProfileRequest, SpectralProfileResponse } from "./proto/SpectralProfile";
// import { SetSpatialReq, SpatialProfileData } from "./proto/SpatialProfile";
// import { HistogramResponse, SetHistogramReq } from "./proto/Histogram";
// import { SetRegion, SetRegionAck } from "./proto/Region";
// export class Ingres {
//     readonly checkStatus: (request: Empty) => Promise<StatusResponse>;
//     readonly getFileInfo: (request: FileInfoRequest) => Promise<FileInfoResponse>;
//     readonly getImageDataStream: (request: ImageDataRequest) => Promise<ImageDataResponse[]>;
    
//     readonly getSpectralProfile: (request: SpectralProfileRequest) => Promise<SpectralProfileResponse>;
//     readonly getSpatialProfile:(request:SetSpatialReq)=> Promise<SpatialProfileData>;
//     readonly getHistogram: (request: SetHistogramReq) =>Promise<HistogramResponse>;
//     // readonly getHistogramDist: (request: HistogramDistRequest) =>Promise<HistogramResponse>;

//     readonly openFile: (request: OpenFileRequest) => Promise<OpenFileACK>;
//     readonly closeFile: (request: FileCloseRequest) => Promise<StatusResponse>;
//     readonly CreateRegion:(Request:SetRegion)=>Promise<SetRegionAck>;
//     private _connected = false;
//     private _readyResolves: (() => void)[] = [];
//     private _rejectResolves: ((err: Error) => void)[] = [];
  
//     get connected() {
//       return this._connected;
//     }
  
//     ready() {
//       return new Promise<void>((resolve, reject) => {
//         if (this._connected) {
//           resolve();
//           return;
//         }
        
//         this._readyResolves.push(resolve);
//         this._rejectResolves.push(reject);
//       });
//     }
  
//     constructor(address:string,port: number = 8079) {

//         //Connection to fits File reading services
//         const FITS_WORKER_POOL_URL = `${address}:${port}`;
//         const fitsWorkerPoolConn = new FitsServicesClient(FITS_WORKER_POOL_URL, credentials.createInsecure());
//         this.checkStatus = promisify<Empty, StatusResponse>(fitsWorkerPoolConn.checkStatus).bind(fitsWorkerPoolConn);
//         this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(fitsWorkerPoolConn.getFileInfo).bind(fitsWorkerPoolConn);
//         this.openFile = promisify<OpenFileRequest, OpenFileACK>(fitsWorkerPoolConn.openFile).bind(fitsWorkerPoolConn);
//         this.closeFile = promisify<FileCloseRequest, StatusResponse>(fitsWorkerPoolConn.closeFile).bind(fitsWorkerPoolConn);
//         this.getSpectralProfile = promisify<SpectralProfileRequest, SpectralProfileResponse>(fitsWorkerPoolConn.getSpectralProfile).bind(fitsWorkerPoolConn);
//         this.getSpatialProfile = promisify<SetSpatialReq, SpatialProfileData>(fitsWorkerPoolConn.getSpatialProfile).bind(fitsWorkerPoolConn);
//         this.getHistogram = promisify<SetHistogramReq, HistogramResponse>(fitsWorkerPoolConn.getHistogram).bind(fitsWorkerPoolConn);
//         this.CreateRegion = promisify<SetRegion,SetRegionAck>(fitsWorkerPoolConn.createRegion).bind(fitsWorkerPoolConn);
//         //   this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(fitsWorkerPoolConn.getHistogramDist).bind(fitsWorkerPoolConn);

//         this.getImageDataStream = (request: ImageDataRequest) => {
//           return new Promise<ImageDataResponse[]>((resolve, reject) => {
//             const call = fitsWorkerPoolConn.getImageDataStream(request);
//             const imageDataResponses:ImageDataResponse[] = [];
//             call.on('data', (response: ImageDataResponse) => {
//               //Possible Conditions
//                 imageDataResponses.push(response)
              
//             });
        
//             call.on('end', () => {
//               resolve(imageDataResponses);
//             });
        
//             call.on('error', (err) => {
//               reject(err);
//             });
//           });
//         };

//       fitsWorkerPoolConn.waitForReady(Date.now() + 4000, (err) => {
//         if (err) {
//           console.log(port + " : false")
//           console.error(err);
//           this._connected = false;
//           for (const reject of this._rejectResolves) {
//             reject(err);
//           }
//         } else {
//           this._connected = true;
//           console.log("WE ARE CONNECTED")

//           for (const resolve of this._readyResolves) {
//             resolve();
//           }
//         }
//       });


//       //Add other services...
//       //
//     }
// }