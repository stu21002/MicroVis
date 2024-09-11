import { credentials, ServiceError } from "@grpc/grpc-js";
import { promisify } from "util";

// import { H5ServicesClient } from "./proto/H5ReaderService";
//Protos
import { FileInfoRequest, FileInfoResponse } from "./proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./proto/OpenFile";
import { Empty, FileType, StatusResponse } from "./proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse, SpectralServiceRequest } from "./proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./proto/Histogram";
import { SetRegion, SetRegionAck } from "./proto/Region";
import { FileServiceClient } from "./proto/FileService";
import { FileServiceConn } from "./FileServiceConn";
import { error } from "console";
import { SpectralServiceClient, SpectralServiceResponse } from "./proto/SpectralProfileService";
// import { FitsServicesClient } from "./proto/FitsReaderService";
export class Ingres {

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

  public spectralService(request: SpectralServiceRequest):Promise<SpectralServiceResponse>{
    // const SERVICE_URL = `${address}:${port}`;
    const SERVICE_URL = `${"0.0.0.0"}:${8078}`;

    const spectralServiceConn = new SpectralServiceClient(SERVICE_URL,credentials.createInsecure());

    return new Promise((resolve, reject) => {
      spectralServiceConn.waitForReady(Date.now() + 5000, (err) => {
          if (err) {
              reject(`Not Spectral Service ready`); //${err.message}
          } else {
              spectralServiceConn.getSpectralProfile(request, (error: ServiceError | null, response: SpectralServiceResponse) => {
                  if (error) {
                      reject(error);
                  } else {
                      resolve(response);
                  }
              });
          }
      });
  });
  
  }
}