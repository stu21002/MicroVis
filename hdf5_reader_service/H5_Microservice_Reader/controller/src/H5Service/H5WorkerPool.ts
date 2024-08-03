//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { bytesToFloat32, bytesToInt32 } from "../utils/arrays";
import { RegionInfo, RegionType } from "../../bin/src/proto/defs";
import { ImageDataResponse } from "../../bin/src/proto/ImageData";
import { SpatialProfile } from "../../bin/src/proto/SpatialProfile";
import { SpectralProfileReaderResponse, SpectralProfileResponse } from "../../bin/src/proto/SpectralProfile";
// import { bytesToFloat32 } from "../utils/arrays";

export interface Point{
  x:number
  y:number
  }
  
// export interface Region {
//     type:RegionType;
//     controlPoints:Point[]
  
//   }


export class Hdf5WorkerPool {
  readonly readers: H5Reader[];


  ready() {
    return Promise.all(this.readers.map((reader) => reader.ready()));
  }

  constructor(numReaders = 4,address:string , startPort = 8080) {
    if (numReaders < 1) {
      throw new Error("reader count must be at least 1");
    }
 
    this.readers = [];
    for (let i = 0; i < numReaders; i++) {
      this.readers.push(new H5Reader(address,startPort + i));
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

  async openFile(directory: string = "./files/",file: string, hdu: string = "") {
    //TODO Create map with uuid including important headers
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
  
  //Refine Method
  async getImageDataStream(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {

    //possbly add data type
    const promises = new Array<Promise<ImageDataResponse[]>>
    if (count.length<=2 || count[3]==1){
      console.log("single")

       promises.push(this.randomConnectedreader.getImageDataStream({ uuid,start, count,regionType:RegionType.RECTANGLE}));
    }
    else{
      //Handling distributed reading
      console.log("multi")
      for (let dim3 = start[2]; dim3 <start[2]+count[2]; dim3++) {
        const tempStart = [start[0],start[1],dim3]
        const tempCount = [count[0],count[1],1]
        promises.push(this.randomConnectedreader.getImageDataStream({ uuid,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}))
        
      }
    }
  
    return promises;

  }

  
  async getSpatial(uuid:string,x:number,y:number,width:number,height:number){

      const promises = new Array<Promise<ImageDataResponse[]>>

      if (this.readers.length==1){
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[0].getImageDataStream({uuid,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
      }
      else{
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[1].getImageDataStream({uuid,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
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

  async getHistogram(uuid:string,x:number,y:number,z:number,width:number,height:number,depth:number){
    const reader = this.randomConnectedreader;
    return reader.getHistogram({uuid,start:[x,y,0,0],count:[width,height,1,1]});
  }

  //Cube Hist?? Mostly fits
  
  async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,region_info:RegionInfo,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }
    const pixelsPerWorker = Math.floor(width / numWorkers);
    const promises = new Array<Promise<SpectralProfileReaderResponse>>();
    for (let i = 0; i < numWorkers; i++) {

      const xStart = x + i * pixelsPerWorker;
      const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
      const reader = this.readers[i % this.readers.length];
      // promises.push(reader.getSpectralProfileStream({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));
      promises.push(reader.getSpectralProfile({ uuid,regionInfo:region_info, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));

    }
    const spectralData = new Float32Array(numPixels);
    const statistic = new Float32Array(numPixels).fill(0);
    const counts = Array(numPixels).fill(0);
 
    return Promise.all(promises).then(res => {
      //Adding values as they come in, avoids heap error
      for (const response of res) {
          const values = bytesToFloat32(response.rawValuesFp32);
          const count = bytesToInt32(response.counts);

        for (let index = 0; index < numPixels; index++) {
          statistic[index]+=values[index];
          counts[index]+=count[index];  
        }
      }

      for (let index = 0; index < numPixels; index++) {
        spectralData[index]=statistic[index]/counts[index]      
      }

      return {spectralData} ;
    });
  }
 }

//  function getMask(region:Region,startX:number,startY:number,numX:number,numY:number) {
//   let mask: boolean[] = [];
//   switch (region.type) {
//     case RegionType.CIRCLE:
//       //
//       const diameter = region.controlPoints[1].x;
//       const pow_radius = Math.pow(diameter / 2.0, 2);
//       const centerX = (diameter - 1) / 2.0;
//       const centerY = (diameter - 1) / 2.0;
//       let index = 0;
//       for (let y = startY; y < startY+numY; y++) {
//           const pow_y = Math.pow(y - centerY, 2);
    
//           for (let x = startX; x < startX+numX; x++) {
              
//               mask[index++] = (pow_y + Math.pow(x - centerX, 2) <= pow_radius);
     
//           }
//       }      
//       break;
  
//     default:

//       break;
//   }


//   return mask;
  
// }