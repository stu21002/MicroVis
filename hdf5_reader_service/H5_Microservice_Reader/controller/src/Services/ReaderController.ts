//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { RegionDataResponse, RegionType, SpectralProfileResponse } from "../../bin/src/proto/H5ReaderServices";
import { bytesToFloat32 } from "../utils/arrays";
// import { bytesToFloat32 } from "../utils/arrays";

interface DimensionValues {
  width: number;
  height: number;
  depth?: number;
  stokes?: number;
  dims:number;
}

export class ReaderController {
  readonly readers: H5Reader[];

  readonly fileDims: Map<string,DimensionValues > = new Map();

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
    
    const extendedInfo = (await promises[0]).fileInfoExtended;
    if (!extendedInfo) {
      //Should return false, meaning error with opening the file
      throw new Error("Extended file info is undefined");
    }
    
    const dimensionValues: DimensionValues = {
      width: extendedInfo.width,
      height: extendedInfo.height,
      depth: extendedInfo.depth,
      stokes: extendedInfo.stokes,
      dims: extendedInfo.dimensions
    };
    // console.log(dimensionValues);
    this.fileDims.set(uuid, dimensionValues);
    return Promise.all(promises).then(responses => {
      return responses.every(res => res.success) ? { uuid } : undefined;
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

  // async getImageData(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {
  //   const reader = readerIndex !== undefined ? this.readers[readerIndex] : this.randomConnectedreader;
  //   return reader?.getRegionData({ uuid, start, count,regionType});
  // }


  ////////////////FIX ME TO BIG, o no
  async getRegionStream(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {
    const reader = readerIndex !== undefined ? this.readers[readerIndex] : this.randomConnectedreader;
    return reader?.getRegionDataStream({ uuid, start, count,regionType:RegionType.RECTANGLE});
  }

  //Relook at this
  async getSpatial(uuid:string,x:number,y:number){
    // if (this.readers.length = 1){
      const promises = new Array<Promise<{xProfile:Float64Array,yProfile:Float64Array}>>();

      const dims =  this.fileDims.get(uuid);
      if (!dims) {
        //Should return false, meaning file no longer open
        throw new Error("Extended file info is undefined");
      }
      // const xStart:number[] = [x,0,0,0];
      // const xCount:number[] = [1,dims.height,1,1];
      // const yStart:number[] = [0,y,0,0];
      // const yCount:number[] = [dims.width,1,1,1];
      const xProfile = new Float64Array(dims.height);
      const yProfile = new Float64Array(dims.width);

      const yPromise = (( this.readers[0].getRegionDataStream({uuid,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,dims.height,1,1]})))
      const xPromise = (( this.readers[0].getRegionDataStream({uuid,regionType:RegionType.LINE,start:[0,y,0,0],count:[dims.width,1,1,1]})))
     
      return Promise.all([xPromise,yPromise]).then(
        ([xRegionData, yRegionData]) => {
          xProfile.set(xRegionData.points, 0);
          yProfile.set(yRegionData.points, 0);
          return { xProfile, yProfile };
        }
      )


    
  }

  async getHistogram(uuid:string,x:number,y:number,z:number,width:number,height:number,depth:number){
    const numBins = Math.sqrt(width*height);
    const {min,max} = {min:0,max:0};
    //getRegion
    //
  }

  async getSpectralProfileStream(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }

    const pixelsPerWorker = Math.floor(width / numWorkers);
    const promises = new Array<Promise<{statistic:Float64Array,counts:Number[]}>>();
    console.log(pixelsPerWorker+ " " +height+ " "+numPixels);
    for (let i = 0; i < numWorkers; i++) {

      const xStart = x + i * pixelsPerWorker;
      const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
      const reader = this.readers[i % this.readers.length];
      promises.push(reader.getSpectralProfileStream({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));
   
    }
    
    const spectralData = new Float64Array(numPixels);
    const statistic = new Float64Array(numPixels).fill(0);
    const counts = Array(numPixels).fill(0);
    return Promise.all(promises).then(res => {
      //Adding values as they come in, avoids heap error
      for (const response of res) {
          response.statistic.forEach((value,index)=>{
            statistic[index]+=value;
          })
          response.counts.forEach((value,index)=>{
            counts[index]+=value;
          })
      }

      spectralData.forEach((value,index)=>{
        spectralData[index]=statistic[index]/counts[index]
      })

      return {spectralData} ;
    });
  }


  // async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,numWorkers?: number) {
  //   if (!numWorkers) {
  //     numWorkers = this.readers.length;
  //   }
  //   const pixelsPerWorker = Math.floor(width / numWorkers);
  //   const promises = new Array<Promise<SpectralProfileResponse>>();
  //   for (let i = 0; i < numWorkers; i++) {
  //     const xStart = x + i * pixelsPerWorker;
  //     // Last worker gets the remainder
  //     const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
  //     const reader = this.readers[i % this.readers.length];
  //     // console.log(`${xStart} ${y} ${z} ${numPixelsInChunk} ${height} ${numPixels}`);

  //     promises.push(reader.getSpectralProfile({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));
  //   }
    
    
  //   return Promise.all(promises).then(res => {
  //     // For Bytes
  //     // const data = new Float64Array(numPixels*width*height);
  //     // let offset = 0;
  //     // for (const response of res) {
  //     //   const chunk = bytesToFloat32(response.data);
  //     //   data.set(chunk, offset);
  //     //   offset += chunk.length;
  //     // }
  //     const numPix = numPixels*width*height;
  //     const data = new Float64Array(numPixels*width*height);
  //     let offset = 0;
  //     for (const response of res) {

  //         data.set(response.data,offset);
  //         offset += response.data.length;
  //     }

  //     const spectralData = new Float64Array(numPixels);
  //     const x_offset: number = numPixels * height;
  
  //     for (let z = 0; z < numPixels; z++) {
  //         let count = 0;
  //         let sum = 0;
  
  //         for (let x = 0; x < width; x++) {
  //             let index = z + x * x_offset;
  
  //             for (let y = 0; y < height; y++) {
  //                 const value = data[index];
                  
  //                 if (Number.isFinite(value)) {
  //                     sum += value;
  //                     count++;
  //                 }
                  
  //                 index += numPixels;
  //             }
  //         }
  
  //         const channel_mean = count > 0 ? sum / count : NaN;
  //         spectralData[z]=(channel_mean);
  //     }

  //     return { spectralData };
  //   });
  // }

//   //TODO 
//   async getSpectralProfile_workLoadSplitZ(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,numreaders?: number) {
//     if (!numreaders) {
//       numreaders = this.readers.length;
//     }

//     const pixelsPerreader = Math.floor(numPixels / numreaders);
//     const promises = new Array<Promise<SpectralProfileResponse>>();
//     for (let i = 0; i < numreaders; i++) {
//       const zStart = z + i * pixelsPerreader;
//       // Last reader gets the remainder
//       const numPixelsInChunk = (i === numreaders - 1) ? numPixels - i * pixelsPerreader : pixelsPerreader;
//       const reader = this.readers[i % this.readers.length];
//       promises.push(reader.getSpectralProfile({ uuid,regionType:RegionType.RECTANGLE, x, y, z: zStart, width, height, numPixels: numPixelsInChunk }));
//     }

//     // Change when using bytes
//     return Promise.all(promises).then(res => {
//         const data = new Float64Array(numPixels);
//         let offset = 0;
//         for (const response of res) {
//             data.set(response.data,offset);
//             offset += response.data.length;
//         }
//     return {data}
//     })
        

//     };
  
 }