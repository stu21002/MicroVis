//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus
//Provides access to all endpoints of the hdf5 reader microservice 
import {
Empty, 
H5ReadersClient,
HistogramDistRequest,
HistogramRequest,
HistogramResponse,
ImageDataRequest,
ImageDataResponse,
SpectralProfileRequest, SpectralProfileResponse,
StatusResponse,
} from "../../bin/src/proto/H5ReaderService";
import { FileInfoRequest, FileInfoResponse } from "../../bin/src/proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "../../bin/src/proto/OpenFile";

import { credentials } from "@grpc/grpc-js";
import { promisify } from "util";



  export class H5Reader {
    
    readonly checkStatus: (request: Empty) => Promise<StatusResponse>;
    readonly getFileInfo: (request: FileInfoRequest) => Promise<FileInfoResponse>;
    readonly getImageDataStream: (request: ImageDataRequest) => Promise<ImageDataResponse[]>;
    // readonly getSpectralProfileStream: (request: SpectralProfileRequest) =>Promise<{statistic:Float64Array,counts:Number[]}>;
    
    readonly getSpectralProfile: (request: SpectralProfileRequest) => Promise<SpectralProfileResponse>;
    // readonly getRegionData: (request: RegionDataRequest) => Promise<RegionDataResponse>;
    readonly getHistogram: (request: HistogramRequest) =>Promise<HistogramResponse>;
    readonly getHistogramDist: (request: HistogramDistRequest) =>Promise<HistogramResponse>;

    readonly openFile: (request: OpenFileRequest) => Promise<OpenFileACK>;
    readonly closeFile: (request: FileCloseRequest) => Promise<StatusResponse>;
    //Spacital Profiles, getImageData for all X given a Y and visa versa...
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
  
    constructor(address:string,port: number = 8080) {
      const WORKER_URL = `${address}:${port}`;
      const client = new H5ReadersClient(WORKER_URL, credentials.createInsecure());
  
      //Linking 
      this.checkStatus = promisify<Empty, StatusResponse>(client.checkStatus).bind(client);
      this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(client.getFileInfo).bind(client);
      // this.getRegionData = promisify<RegionDataRequest, RegionDataResponse>(client.getRegion).bind(client);
      this.getSpectralProfile = promisify<SpectralProfileRequest, SpectralProfileResponse>(client.getSpectralProfile).bind(client);
      this.openFile = promisify<OpenFileRequest, OpenFileACK>(client.openFile).bind(client);
      this.closeFile = promisify<FileCloseRequest, StatusResponse>(client.closeFile).bind(client);

      this.getHistogram = promisify<HistogramRequest, HistogramResponse>(client.getHistogram).bind(client);
      this.getHistogramDist = promisify<HistogramDistRequest, HistogramResponse>(client.getHistogramDist).bind(client);

      this.getImageDataStream = (request: ImageDataRequest) => {
        return new Promise<ImageDataResponse[]>((resolve, reject) => {
          const call = client.getImageDataStream(request);
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

      client.waitForReady(Date.now() + 4000, (err) => {
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
    }
  }