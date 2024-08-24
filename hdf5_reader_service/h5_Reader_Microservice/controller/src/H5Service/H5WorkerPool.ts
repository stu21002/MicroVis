//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { bytesToFloat32, bytesToInt32 } from "../utils/arrays";
import { RegionInfo, RegionType, StatsType } from "../proto/defs";
import { ImageDataResponse } from "../proto/ImageData";
import { SpatialProfile } from "../proto/SpatialProfile";
import { SpectralProfileReaderResponse, SpectralProfileResponse } from "../proto/SpectralProfile";
// import { bytesToFloat32 } from "../utils/arrays";

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
  
  //Refine Method
  async getImageDataStream(uuid: string,permData:boolean,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {

    const promises: Array<Promise<ImageDataResponse[]>> = [];
    const numWorkers = this.readers.length;

    if (numWorkers==1){
      
      promises.push(this.primaryreader.getImageDataStream({ uuid,permData,start, count,regionType:RegionType.RECTANGLE}));

    }
    else{      

      if (permData){
        const x = start[0]
        const width = count[0]
        const pixelsPerWorker = Math.floor(width / numWorkers);
        for (let i = 0; i < numWorkers; i++) {
    
          const xStart = x + i * pixelsPerWorker;
          const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
          const reader = this.readers[i % this.readers.length];
          const tempStart = [xStart,start[1],start[2],0]
          const tempCount = [numPixelsInChunk,count[1],count[2],1]
          promises.push(reader.getImageDataStream({ uuid,permData,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}));
    
        }
      }
      else {

        const pixelsPerWorker = Math.floor(count[2] / numWorkers);
        for (let i = 0; i < this.readers.length; i++) {
          
          const zStart = start[2] + i * pixelsPerWorker;
          const numPixelsInChunk = (i === numWorkers - 1) ? count[2] - i * pixelsPerWorker : pixelsPerWorker;
          const reader = this.readers[i % this.readers.length];
          const tempStart = [start[0],start[1],zStart]
          const tempCount = [count[0],count[1],numPixelsInChunk]
          promises.push(reader.getImageDataStream({ uuid,permData,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}));
        }
      }
    }
  
    return promises;

  }

  
  async getSpatial(uuid:string,x:number,y:number,width:number,height:number){

      const promises = new Array<Promise<ImageDataResponse[]>>

      if (this.readers.length==1){
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
      }
      else{
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[1].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
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
      promises.push(reader.getSpectralProfile({ uuid,regionInfo:region_info, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));

    }
    // const statistic = new Float32Array(numPixels).fill(0);
    const counts = new Int32Array(numPixels).fill(0);    
    const nan_count  = new Int32Array(numPixels).fill(0);
    const sum = new Float32Array(numPixels).fill(0);
    //FLUX
    const sum_sq = new Float32Array(numPixels).fill(0);
    const min = new Float32Array(numPixels).fill(0);
    const max = new Float32Array(numPixels).fill(0);
   
    
    return Promise.all(promises).then(res => {
      for (const response of res) {

        for (const profile of response.profiles){
  
          switch (profile.statsType) {
            case StatsType.NumPixels:
              const count_values = bytesToInt32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                counts[i]+=count_values[i];
              }
              break;
            case StatsType.NanCount:
              const nan_values = bytesToInt32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                nan_count[i]+=nan_values[i];
              }
              break;
            case StatsType.Sum:
              const sum_values = bytesToFloat32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                sum[i]+=sum_values[i];
              }
              break;
            case StatsType.SumSq:
              const sumsq_values = bytesToFloat32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                sum_sq[i]+=sumsq_values[i];
              }
              break;
            case StatsType.Min:
              const min_values = bytesToFloat32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                const val = min_values[i]
                if (val<min[i]){
                  min[i]=val
                }
              }
              break;
            case StatsType.Max:
              const max_values = bytesToFloat32(profile.rawValuesFp32)
              for (let i = 0; i < numPixels; i++) {
                const val = max_values[i]
                if (val>max[i]){
                  max[i]=val
                }
              }
              break;
            default:
              break;
          }
        }
      }
      
      //Partial Stats
      const mean = new Float32Array(numPixels);
      const rms = new Float32Array(numPixels);
      const sigma = new Float32Array(numPixels);
      const extrema = new Float32Array(numPixels);


      let sum_z;
      let count_z;
      let sum_sq_z;
      for (let z = 0; z < numPixels; z++) {
        count_z = counts[z];
        sum_z = sum[z];
        sum_sq_z = sum_sq[z];

        mean[z]=sum_z/count_z;
        rms[z] = Math.sqrt(sum_sq_z / count_z);
        sigma[z] = count_z > 1 ? Math.sqrt((sum_sq_z - (sum_z * sum_z / count_z)) / (count_z - 1)) : 0;
        extrema[z] = (Math.abs(min[z]) > Math.abs(max[z]) ? min[z] : max[z]);

      }

      return {mean} ;
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