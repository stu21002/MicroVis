import { credentials, ServiceError } from "@grpc/grpc-js";
import { FileServiceClient } from "./proto/FileService";
import { promisify } from "util";
import { Empty, StatusResponse } from "./proto/defs";
import { resolve } from "path";
import { rejects } from "assert";
import { FileInfoRequest, FileInfoResponse } from "./proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./proto/OpenFile";
import { SpectralProfileRequest, SpectralProfileResponse } from "./proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./proto/Histogram";
import { SetRegion, SetRegionAck } from "./proto/Region";
import { ImageDataRequest, ImageDataResponse } from "./proto/ImageData";


export class FileServiceConn{
    private client:FileServiceClient;
    public _connected = false;
    private _readyResolves: (() => void)[] = [];
    private _rejectResolves: ((err: Error) => void)[] = [];

    constructor(address:string,port: number = 8079){
        
        const READER_SERVICE_URL = `${address}:${port}`;
        this.client = new FileServiceClient(READER_SERVICE_URL,credentials.createInsecure());
        
        this.client.waitForReady(Date.now() + 4000, (err) => {
            if (err) {
              console.log(port + " : false")
              console.error(err);
              this._connected = false;
              for (const reject of this._rejectResolves) {
                reject(err);
              }
            } else {
              this._connected = true;
              console.log("Connected to Worker Pool : ", port);
        
              for (const resolve of this._readyResolves) {
                resolve();
              }
            }
          });
    }

    public checkStatus(request:Empty):Promise<StatusResponse>{
        return new Promise((resolve,reject)=>{
            this.client.checkStatus(request,(error: ServiceError| null, response: StatusResponse) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }
    public getFileInfo(request:FileInfoRequest):Promise<FileInfoResponse>{
        return new Promise((resolve,reject)=>{
            this.client.getFileInfo(request,(error: ServiceError| null, response: FileInfoResponse) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public openFile(request:OpenFileRequest):Promise<OpenFileACK>{
        return new Promise((resolve,reject)=>{
            this.client.openFile(request,(error: ServiceError| null, response: OpenFileACK) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public closeFile(request:FileCloseRequest):Promise<StatusResponse>{
        return new Promise((resolve,reject)=>{
            this.client.closeFile(request,(error: ServiceError| null, response: StatusResponse) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public getSpectralProfile(request:SpectralProfileRequest):Promise<SpectralProfileResponse>{
        return new Promise((resolve,reject)=>{
            this.client.getSpectralProfile(request,(error: ServiceError| null, response: SpectralProfileResponse) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public getSpatialProfile(request:SetSpatialReq):Promise<SpatialProfileData>{
        return new Promise((resolve,reject)=>{
            this.client.getSpatialProfile(request,(error: ServiceError| null, response: SpatialProfileData) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public getHistogram(request:SetHistogramReq):Promise<HistogramResponse>{
        return new Promise((resolve,reject)=>{
            this.client.getHistogram(request,(error: ServiceError| null, response: HistogramResponse) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public regionCreate(request:SetRegion):Promise<SetRegionAck>{
        return new Promise((resolve,reject)=>{
            this.client.createRegion(request,(error: ServiceError| null, response: SetRegionAck) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(response);
                }
              });
        })
    }

    public getImageDataStream(request: ImageDataRequest): Promise<ImageDataResponse[]> {
        return new Promise<ImageDataResponse[]>((resolve, reject) => {
          const call = this.client.getImageDataStream(request);
          const imageDataResponses: ImageDataResponse[] = [];
    
          call.on('data', (response: ImageDataResponse) => {
            imageDataResponses.push(response);
          });
    
          call.on('end', () => {
            resolve(imageDataResponses);
          });
    
          call.on('error', (err: ServiceError) => {
            reject(err);
          });
        });
    }
 
}