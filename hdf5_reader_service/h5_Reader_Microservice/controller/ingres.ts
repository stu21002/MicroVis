// import { credentials } from "@grpc/grpc-js";
// import { promisify } from "util";

// // import { H5ServicesClient } from "./src/proto/H5ReaderService";
// //Protos
// import { FileInfoRequest, FileInfoResponse } from "./src/proto/FileInfo";
// import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./src/proto/OpenFile";
// import { Empty, StatusResponse } from "./src/proto/defs";
// import { ImageDataRequest, ImageDataResponse } from "./src/proto/ImageData";
// import { SpectralProfileRequest, SpectralProfileResponse } from "./src/proto/SpectralProfile";
// import { SetSpatialReq, SpatialProfileData } from "./src/proto/SpatialProfile";
// import { HistogramResponse, SetHistogramReq } from "./src/proto/Histogram";
// import { SetRegion, SetRegionAck } from "./src/proto/Region";
// import { FileServiceClient } from "./src/proto/FileService";
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

//         //Connection to HDF5 File reading services
//         const H5_WORKER_POOL_URL = `${address}:${port}`;
//         const h5WorkerPoolConn = new FileServiceClient(H5_WORKER_POOL_URL, credentials.createInsecure());
//         this.checkStatus = promisify<Empty, StatusResponse>(h5WorkerPoolConn.checkStatus).bind(h5WorkerPoolConn);
//         this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(h5WorkerPoolConn.getFileInfo).bind(h5WorkerPoolConn);
//         this.openFile = promisify<OpenFileRequest, OpenFileACK>(h5WorkerPoolConn.openFile).bind(h5WorkerPoolConn);
//         this.closeFile = promisify<FileCloseRequest, StatusResponse>(h5WorkerPoolConn.closeFile).bind(h5WorkerPoolConn);
//         this.getSpectralProfile = promisify<SpectralProfileRequest, SpectralProfileResponse>(h5WorkerPoolConn.getSpectralProfile).bind(h5WorkerPoolConn);
//         this.getSpatialProfile = promisify<SetSpatialReq, SpatialProfileData>(h5WorkerPoolConn.getSpatialProfile).bind(h5WorkerPoolConn);
//         this.getHistogram = promisify<SetHistogramReq, HistogramResponse>(h5WorkerPoolConn.getHistogram).bind(h5WorkerPoolConn);
//         this.CreateRegion = promisify<SetRegion,SetRegionAck>(h5WorkerPoolConn.createRegion).bind(h5WorkerPoolConn);
//         //   this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(h5WorkerPoolConn.getHistogramDist).bind(h5WorkerPoolConn);

//         this.getImageDataStream = (request: ImageDataRequest) => {
//           return new Promise<ImageDataResponse[]>((resolve, reject) => {
//             const call = h5WorkerPoolConn.getImageDataStream(request);
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

//       h5WorkerPoolConn.waitForReady(Date.now() + 4000, (err) => {
//         if (err) {
//           console.log(port + " : false")
//           console.error(err);
//           this._connected = false;
//           for (const reject of this._rejectResolves) {
//             reject(err);
//           }
//         } else {
//           this._connected = true;
//           for (const resolve of this._readyResolves) {
//             resolve();
//           }
//         }
//       });


//       //Add other services...
//       //
//     }
// }