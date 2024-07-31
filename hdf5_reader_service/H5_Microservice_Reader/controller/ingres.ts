import { credentials } from "@grpc/grpc-js";
import { FileInfoRequest, FileInfoResponse } from "./bin/src/proto/FileInfo";
import { Empty, H5ServicesClient, HistogramResponse, ImageDataRequest, ImageDataResponse, SetHistogramReq, SetSpatialReq, SpatialProfileData, SpectralProfileRequest, SpectralProfileResponse, StatusResponse } from "./bin/src/proto/H5ReaderService";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./bin/src/proto/OpenFile";
import { promisify } from "util";
export class Ingres {
    readonly checkStatus: (request: Empty) => Promise<StatusResponse>;
    readonly getFileInfo: (request: FileInfoRequest) => Promise<FileInfoResponse>;
    readonly getImageDataStream: (request: ImageDataRequest) => Promise<ImageDataResponse[]>;
    
    readonly getSpectralProfile: (request: SpectralProfileRequest) => Promise<SpectralProfileResponse>;
    readonly getSpatialProfile:(request:SetSpatialReq)=> Promise<SpatialProfileData>;
    readonly getHistogram: (request: SetHistogramReq) =>Promise<HistogramResponse>;
    // readonly getHistogramDist: (request: HistogramDistRequest) =>Promise<HistogramResponse>;

    readonly openFile: (request: OpenFileRequest) => Promise<OpenFileACK>;
    readonly closeFile: (request: FileCloseRequest) => Promise<StatusResponse>;
    
    private _connected = false;
    private _readyResolves: (() => void)[] = [];
    private _rejectResolves: ((err: Error) => void)[] = [];
  
    get connected() {
      return this._connected;
    }
  
    ready() {
      return new Promise<void>((resolve, reject) => {
        if (this._connected) {
          resolve();
          return;
        }
        
        this._readyResolves.push(resolve);
        this._rejectResolves.push(reject);
      });
    }
  
    constructor(address:string,port: number = 8079) {

        //Connection to HDF5 File reading services
        const WORKER_POOL_URL = `${address}:${port}`;
        const workerPoolConn = new H5ServicesClient(WORKER_POOL_URL, credentials.createInsecure());
    
        this.checkStatus = promisify<Empty, StatusResponse>(workerPoolConn.checkStatus).bind(workerPoolConn);
        this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(workerPoolConn.getFileInfo).bind(workerPoolConn);
        this.openFile = promisify<OpenFileRequest, OpenFileACK>(workerPoolConn.openFile).bind(workerPoolConn);
        this.closeFile = promisify<FileCloseRequest, StatusResponse>(workerPoolConn.closeFile).bind(workerPoolConn);
        this.getSpectralProfile = promisify<SpectralProfileRequest, SpectralProfileResponse>(workerPoolConn.getSpectralProfile).bind(workerPoolConn);
        this.getSpatialProfile = promisify<SetSpatialReq, SpatialProfileData>(workerPoolConn.getSpatialProfile).bind(workerPoolConn);
        this.getHistogram = promisify<SetHistogramReq, HistogramResponse>(workerPoolConn.getHistogram).bind(workerPoolConn);

        //   this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(workerPoolConn.getHistogramDist).bind(workerPoolConn);

        this.getImageDataStream = (request: ImageDataRequest) => {
          return new Promise<ImageDataResponse[]>((resolve, reject) => {
            const call = workerPoolConn.getImageDataStream(request);
            const imageDataResponses:ImageDataResponse[] = [];
            call.on('data', (response: ImageDataResponse) => {
              //Possible Conditions
                imageDataResponses.push(response)
              
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
          console.log(port + " : false")

          console.error(err);
          this._connected = false;
          for (const reject of this._rejectResolves) {
            reject(err);
          }
        } else {
          // console.log(port + " : true")

          this._connected = true;
          for (const resolve of this._readyResolves) {
            resolve();
          }
        }
      });


      //Add other services...
      //
    }
}