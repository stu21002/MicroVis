//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { FitsReader } from "./fitsReader";
import { bytesToFloat32 } from "../utils/arrays";
import { RegionInfo, RegionType } from "../proto/defs";
import { ImageDataResponse } from "../proto/ImageData";
import { SpatialProfile } from "../proto/SpatialProfile";
import { SpectralProfileReaderResponse, SpectralProfileResponse } from "../proto/SpectralProfile";

export class FitsWorkerPool {
  readonly readers: FitsReader[];


  ready() {
    return Promise.all(this.readers.map((reader) => reader.ready()));
  }

  constructor(numReaders = 4,address:string , startPort = 8080) {
    if (numReaders < 1) {
      throw new Error("reader count must be at least 1");
    }
 
    this.readers = [];
    for (let i = 0; i < numReaders; i++) {
      this.readers.push(new FitsReader(startPort + i));
    }
  }

  get connectedreaders() {
    return this.readers.filter((reader) => reader.connected);
  }

  get allConnected() {
    return this.readers.every(w => w.connected);
  }

  get primaryreader() {
    return this.readers[0];
  }

  get firstConnectedreader() {
    return this.readers.find((reader) => reader.connected);
  }

  get randomConnectedreader() {
    return this.connectedreaders?.[Math.floor(Math.random() * this.connectedreaders.length)];
  }

  async checkStatus() {
    return this.primaryreader.checkStatus({});
  }

  async openFile(directory: string,file: string, hdu: string = "") {
    const uuid = uuidv4();
    const promises = this.readers.map((reader) => reader.openFile({ directory, file, hdu, uuid }));  
    return Promise.all(promises).then(responses => {
      return responses.every(res => res.status) ? { uuid } : undefined;
    });
  }

  async closeFile(uuid: string) {
    const promises = this.readers.map((reader) => reader.closeFile({ uuid }));
    return Promise.all(promises).then(responses => {
      return responses.every(res => res.status);
    });
  }

  async getFileInfo(uuid: string,directory:string,file:string,hdu:string) {
    return this.primaryreader?.getFileInfo({ uuid ,directory ,file ,hdu });
  }
  

  //Handling image data streaming
  async getImageDataStream(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {

    
    const promises = new Array<Promise<ImageDataResponse[]>>
    if (this.readers.length==1){
      //Single reader
      promises.push(this.primaryreader.getImageDataStream({uuid, start, count, regionType: RegionType.RECTANGLE, permData: false
      }));

    }
    else{
      //Multi reader
      //Split across the Z dimension if Z greater than 1
      if (count[2]>1){
      const numWorkers = this.readers.length;
      const pixelsPerWorker = Math.floor(count[2] / numWorkers);
        for (let i = 0; i < this.readers.length; i++) {
          
          const zStart = start[2] + i * pixelsPerWorker;
          const numPixelsInChunk = (i === numWorkers - 1) ? count[2] - i * pixelsPerWorker : pixelsPerWorker;
          const reader = this.readers[i % this.readers.length];
          const tempStart = [start[0],start[1],zStart,1]
          const tempCount = [count[0],count[1],numPixelsInChunk,1]
          promises.push(reader.getImageDataStream({
            uuid, start: tempStart, count: tempCount, regionType: RegionType.RECTANGLE,
            permData: false
          }));
        }
      }else{
        //Splt across the Y dimension
        const numWorkers = this.readers.length;
        const pixelsPerWorker = Math.floor(count[1] / numWorkers);
        for (let i = 0; i < this.readers.length; i++) {
          
          const yStart = start[1] + i * pixelsPerWorker;
          const numPixelsInChunk = (i === numWorkers - 1) ? count[1] - i * pixelsPerWorker : pixelsPerWorker;
          const reader = this.readers[i % this.readers.length];
          const tempStart = [start[0],yStart,start[2],1]
          const tempCount = [count[0],numPixelsInChunk,1,1]
          if (tempCount.reduce((accumulator, currentValue) => accumulator * currentValue, 1)>0){
            promises.push(reader.getImageDataStream({ uuid,permData:false,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}));
          }
        }
      }
    }
  
    return promises;

  }

  //Spatial profile service
  async getSpatial(uuid:string,x:number,y:number,width:number,height:number){

      const promises = new Array<Promise<ImageDataResponse[]>>


      if (this.readers.length==1){
        //Single reader
        //y
        promises.push(( this.readers[0].getImageDataStream({
          uuid, regionType: RegionType.LINE, start: [x+1, 1, 1, 1], count: [1, height, 1, 1],
          permData: false
        })))
        //x
        promises.push(( this.readers[0].getImageDataStream({
          uuid, regionType: RegionType.LINE, start: [1, y+1, 1, 1], count: [width, 1, 1, 1],
          permData: false
        })))
      }
      else{
        //Multi reader
        //y
        promises.push(( this.readers[0].getImageDataStream({
          uuid, regionType: RegionType.LINE, start: [x+1, 1, 1, 1], count: [1, height, 1, 1],
          permData: false
        })))
        //x
        promises.push(( this.readers[1].getImageDataStream({
          uuid, regionType: RegionType.LINE, start: [1, y+1, 1, 1], count: [width, 1, 1, 1],
          permData: false
        })))
      }
     
      //Creating profiles response 
      return Promise.all(promises).then(
        ([yImageData, xImageData]) => {
          const profiles:SpatialProfile[]=[];

          let xStart = 0;
          for (const profile of xImageData){
            const xEnd = xStart + profile.numPixels;
            profiles.push({coordinate:"x",rawValuesFp32:profile.rawValuesFp32,start:xStart,end:xEnd});
            xStart=xEnd;
          }

          let yStart = 0;
          for (const profile of yImageData){
            const yEnd = yStart + profile.numPixels;
            profiles.push({coordinate:"y",rawValuesFp32:profile.rawValuesFp32,start:yStart,end:yEnd});
            yStart=yEnd;
          }
          
          return { profiles };
        }
      )
  }

  //Spectral Profile service
  async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,region_info:RegionInfo,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }
    //Workload distribution
    const pixelsPerWorker = Math.floor(numPixels / numWorkers);
    const promises = new Array<Promise<SpectralProfileResponse>>();
    for (let i = 0; i < numWorkers; i++) {
      const zStart = z + i * pixelsPerWorker;
      const numPixelsInChunk = (i === numWorkers - 1) ? numPixels - i * pixelsPerWorker : pixelsPerWorker;

      const worker = this.readers[i % this.readers.length];
      promises.push(worker.getSpectralProfile({ uuid,regionInfo:region_info, x, y, z: zStart, width, height, numPixels: numPixelsInChunk }));
    }

    //Array concant
    return Promise.all(promises).then(res => {
      const spectralData = new Float32Array(numPixels);
      let offset = 0;
      for (const response of res) {
        const chunk = bytesToFloat32(response.rawValuesFp32);
        spectralData.set(chunk, offset);
        offset += chunk.length;
      }
      return { spectralData };
    });
  }
 }
