//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { FitsReader } from "./fitsReader";
import { bytesToFloat32 } from "../utils/arrays";
import { RegionInfo, RegionType } from "../proto/defs";
import { ImageDataResponse } from "../proto/ImageData";
import { SpatialProfile } from "../proto/SpatialProfile";
import { SpectralProfileReaderResponse, SpectralProfileResponse } from "../proto/SpectralProfile";
// import { bytesToFloat32 } from "../utils/arrays";

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
  

  async getImageDataStream(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {

    
    const promises = new Array<Promise<ImageDataResponse[]>>
    // const promises = [];
    if (this.readers.length==1){
      
      console.log("single")
      promises.push(this.primaryreader.getImageDataStream({uuid, start, count, regionType: RegionType.RECTANGLE, permData: false
      }));

    }
    else{
      //Handling distributed reading
      console.log("multi")
 
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
    }
  
    return promises;

  }

  
  async getSpatial(uuid:string,x:number,y:number,width:number,height:number){

      const promises = new Array<Promise<ImageDataResponse[]>>


      if (this.readers.length==1){
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

  // async getHistogram(uuid:string,x:number,y:number,z:number,width:number,height:number,depth:number){
  //   const reader = this.randomConnectedreader;
  //   return reader.getHistogram({uuid,start:[x,y,0,0],count:[width,height,1,1]});
  // }

  //Cube Hist?? Mostly fits
  
  async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }
    const pixelsPerWorker = Math.floor(numPixels / numWorkers);
    const promises = new Array<Promise<SpectralProfileResponse>>();
    for (let i = 0; i < numWorkers; i++) {
      const zStart = z + i * pixelsPerWorker;
      console.log(zStart);
      console.log(pixelsPerWorker);
      // Last worker gets the remainder
      const numPixelsInChunk = (i === numWorkers - 1) ? numPixels - i * pixelsPerWorker : pixelsPerWorker;
      console.log(numPixelsInChunk);

      const worker = this.readers[i % this.readers.length];
      promises.push(worker.getSpectralProfile({ uuid,regionInfo:undefined, x, y, z: zStart, width, height, numPixels: numPixelsInChunk }));
    }

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
