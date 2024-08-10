import { credentials } from "@grpc/grpc-js";
import { promisify } from "util";

// import { H5ServicesClient } from "./proto/H5ReaderService";
//Protos
import { FileInfoRequest, FileInfoResponse } from "./proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./proto/OpenFile";
import { Empty, FileType, StatusResponse } from "./proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse } from "./proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./proto/Histogram";
import { SetRegion, SetRegionAck } from "./proto/Region";
import { FileSerivceClient } from "./proto/FileService";
import { FileServiceConn } from "./FileServiceConn";
import { error } from "console";
// import { FitsServicesClient } from "./proto/FitsReaderService";
export class Ingres {

    // readonly checkStatus: (request: Empty) => Promise<StatusResponse>;
    // readonly getFileInfo: (request: FileInfoRequest) => Promise<FileInfoResponse>;
    // // readonly getImageDataStream: (request: ImageDataRequest) => Promise<ImageDataResponse[]>;
    
    // readonly getSpectralProfile: (request: SpectralProfileRequest) => Promise<SpectralProfileResponse>;
    // readonly getSpatialProfile:(request:SetSpatialReq)=> Promise<SpatialProfileData>;
    // readonly getHistogram: (request: SetHistogramReq) =>Promise<HistogramResponse>;
    // // readonly getHistogramDist: (request: HistogramDistRequest) =>Promise<HistogramResponse>;

    // readonly openFile: (request: OpenFileRequest) => Promise<OpenFileACK>;
    // readonly closeFile: (request: FileCloseRequest) => Promise<StatusResponse>;
    // readonly CreateRegion:(Request:SetRegion)=>Promise<SetRegionAck>;
    private _connected = false;
    private _readyResolves: (() => void)[] = [];
    private _rejectResolves: ((err: Error) => void)[] = [];

    private readerConnections: Map<FileType, FileServiceConn> = new Map();
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
        const H5_WORKER_POOL_URL = `${address}:${port}`;
        this.readerConnections.set(FileType.HDF5,new FileServiceConn("0.0.0.0",8079));
        // const h5WorkerPoolConn = new FitsServicesClient(H5_WORKER_POOL_URL, credentials.createInsecure());
      //   const h5WorkerPoolConn = new FileSerivceClient(H5_WORKER_POOL_URL, credentials.createInsecure());
        // this.checkStatus = promisify<Empty, StatusResponse>();
        // this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(h5WorkerPoolConn.getFileInfo);
        // this.openFile = promisify<OpenFileRequest, OpenFileACK>(h5WorkerPoolConn.openFile);
        // this.closeFile = promisify<FileCloseRequest, StatusResponse>(h5WorkerPoolConn.closeFile);
        // this.getSpectralProfile = promisify<SpectralProfileRequest, SpectralProfileResponse>(h5WorkerPoolConn.getSpectralProfile);
        // this.getSpatialProfile = promisify<SetSpatialReq, SpatialProfileData>(h5WorkerPoolConn.getSpatialProfile);
        // this.getHistogram = promisify<SetHistogramReq, HistogramResponse>(h5WorkerPoolConn.getHistogram);
        // this.CreateRegion = promisify<SetRegion,SetRegionAck>(h5WorkerPoolConn.createRegion);
        //   this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(h5WorkerPoolConn.getHistogramDist).bind(h5WorkerPoolConn);

      //   this.getImageDataStream = (request: ImageDataRequest) => {
      //     return new Promise<ImageDataResponse[]>((resolve, reject) => {
      //       const call = h5WorkerPoolConn.getImageDataStream(request);
      //       const imageDataResponses:ImageDataResponse[] = [];
      //       call.on('data', (response: ImageDataResponse) => {
      //         //Possible Conditions
      //           imageDataResponses.push(response)
              
      //       });
        
      //       call.on('end', () => {
      //         resolve(imageDataResponses);
      //       });
        
      //       call.on('error', (err) => {
      //         reject(err);
      //       });
      //     });
      //   };

      // h5WorkerPoolConn.waitForReady(Date.now() + 4000, (err) => {
      //   if (err) {
      //     console.log(port + " : false")
      //     console.error(err);
      //     this._connected = false;
      //     for (const reject of this._rejectResolves) {
      //       reject(err);
      //     }
      //   } else {
      //     this._connected = true;
      //     console.log("Connected to workerpool");

      //     for (const resolve of this._readyResolves) {
      //       resolve();
      //     }
      //   }
      // });

///contouring
///Reading requests////
///Countring...//


      //Add other services...
      //
    }

    public checkStatus(request:Empty):Promise<StatusResponse>{
      const fileType = request
      const caller = this.readerConnections.get(FileType.HDF5)
      if (!caller){
        throw error("File Service Down");
      }
      return caller.checkStatus(request);
        
  }
  public getFileInfo(request:FileInfoRequest):Promise<FileInfoResponse>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.getFileInfo(request);
  }

  public openFile(request:OpenFileRequest):Promise<OpenFileACK>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.openFile(request);
  }

  public closeFile(request:FileCloseRequest):Promise<StatusResponse>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.closeFile(request);
  }

  public getSpectralProfile(request:SpectralProfileRequest):Promise<SpectralProfileResponse>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.getSpectralProfile(request);
  }

  public getSpatialProfile(request:SetSpatialReq):Promise<SpatialProfileData>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.getSpatialProfile(request);
  }

  public getHistogram(request:SetHistogramReq):Promise<HistogramResponse>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.getHistogram(request);
  }

  public regionCreate(request:SetRegion):Promise<SetRegionAck>{
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.regionCreate(request);
  }

  public getImageDataStream(request: ImageDataRequest): Promise<ImageDataResponse[]> {
    const caller = this.readerConnections.get(FileType.HDF5)
    if (!caller){
      throw error("File Service Down");
    }
      return caller.getImageDataStream(request);
  }
}