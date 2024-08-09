//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus
//Provides access to all endpoints of the hdf5 reader microservice 

import { Empty, StatusResponse } from "../proto/defs";
import { FileInfoRequest, FileInfoResponse } from "../proto/FileInfo";
import { ImageDataRequest, ImageDataResponse } from "../proto/ImageData";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "../proto/OpenFile";
import { SpectralProfileReaderRequest, SpectralProfileReaderResponse, SpectralProfileRequest, SpectralProfileResponse } from "../proto/SpectralProfile";
import { HistogramDistRequest, HistogramRequest, HistogramResponse } from "../proto/Histogram";
import { FitsReadersClient } from "../proto/FitsReaderService";

import { credentials } from "@grpc/grpc-js";
import { promisify } from "util";

export class FitsReader {
  readonly checkStatus: (request: Empty) => Promise<StatusResponse>;
  readonly getFileInfo: (request: FileInfoRequest) => Promise<FileInfoResponse>;
  readonly getImageDataStream: (request: ImageDataRequest) => Promise<ImageDataResponse[]>;
  readonly getSpectralProfile: (request: SpectralProfileReaderRequest) => Promise<SpectralProfileResponse>;
  readonly openFile: (request: OpenFileRequest) => Promise<StatusResponse>;
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

  constructor(port: number = 8080) {
    const WORKER_URL = `0.0.0.0:${port}`;
    const client = new FitsReadersClient(WORKER_URL, credentials.createInsecure());

    this.checkStatus = promisify<Empty, StatusResponse>(client.checkStatus).bind(client);
    this.getFileInfo = promisify<FileInfoRequest, FileInfoResponse>(client.getFileInfo).bind(client);
    this.getSpectralProfile = promisify<SpectralProfileReaderRequest, SpectralProfileResponse>(client.getSpectralProfile).bind(client);
    this.openFile = promisify<OpenFileRequest, StatusResponse>(client.openFile).bind(client);
    this.closeFile = promisify<FileCloseRequest, StatusResponse>(client.closeFile).bind(client);

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
        console.error(err);
        this._connected = false;
        for (const reject of this._rejectResolves) {
          reject(err);
        }
      } else {
        this._connected = true;
        for (const resolve of this._readyResolves) {
          resolve();
        }
      }
    });
  }
}
