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

    private readerConnections:FileServiceConn;
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
        const reader_url = `${address}:${port}`;
        this.readerConnections=new FileServiceConn(address,port);
   

///contouring
///Reading requests////
///Countring...//


     
    }

    public checkStatus(request:Empty):Promise<StatusResponse>{
      
      return this.readerConnections.checkStatus(request);
        
  }
  public getFileInfo(request:FileInfoRequest):Promise<FileInfoResponse>{
   
      return this.readerConnections.getFileInfo(request);
  }

  public openFile(request:OpenFileRequest):Promise<OpenFileACK>{
   
      return this.readerConnections.openFile(request);
  }

  public closeFile(request:FileCloseRequest):Promise<StatusResponse>{
   
      return this.readerConnections.closeFile(request);
  }

  public getSpectralProfile(request:SpectralProfileRequest):Promise<SpectralProfileResponse>{
   
      return this.readerConnections.getSpectralProfile(request);
  }

  public getSpatialProfile(request:SetSpatialReq):Promise<SpatialProfileData>{
   
      return this.readerConnections.getSpatialProfile(request);
  }

  public getHistogram(request:SetHistogramReq):Promise<HistogramResponse>{
   
      return this.readerConnections.getHistogram(request);
  }

  public regionCreate(request:SetRegion):Promise<SetRegionAck>{
   
      return this.readerConnections.regionCreate(request);
  }

  public getImageDataStream(request: ImageDataRequest): Promise<ImageDataResponse[]> {
   
      return this.readerConnections.getImageDataStream(request);
  }
}