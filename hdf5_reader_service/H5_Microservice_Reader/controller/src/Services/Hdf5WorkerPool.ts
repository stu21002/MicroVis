//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { HistogramResponse, ImageDataResponse, RegionType, SpatialProfile, SpectralProfileResponse } from "../../bin/src/proto/H5ReaderService";
import { bytesToFloat32, bytesToInt32 } from "../utils/arrays";
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

  async openFile(directory: string = "./files/",file: string, hdu: string = "") {
    //TODO Create map with uuid including important headers
    const uuid = uuidv4();
    const promises = this.readers.map((reader) => reader.openFile({ directory, file, hdu, uuid }));
    
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
  
  async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,regionType?:RegionType,diameter?:number,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }

    const pixelsPerWorker = Math.floor(width / numWorkers);
    const promises = new Array<Promise<SpectralProfileResponse>>();
    for (let i = 0; i < numWorkers; i++) {

      const xStart = x + i * pixelsPerWorker;
      const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
      const reader = this.readers[i % this.readers.length];
      // promises.push(reader.getSpectralProfileStream({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));
      promises.push(reader.getSpectralProfile({ uuid,regionType:RegionType.RECTANGLE, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));

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

  
  
    // async getHistogramDist(uuid:string,x:number,y:number,z:number,width:number,height:number,depth:number,workers:number){
    //   const numBins = Math.sqrt(width*height);
    //   const {min,max} = {min:0,max:0};
    //   const reader = this.primaryreader;
    //   const histres = await reader.getHistogram({uuid,start:[x,y,0,0],count:[width,height,1,1]});
    //   const promises = new Array<Promise<HistogramResponse>>();
    //   const pixelsPerWorker = Math.floor((width *height)/ workers);
    //   // console.log(pixelsPerWorker);
    //   // console.log(width);
    //   // console.log(height);
    //   // console.log(width*height);
    //   for (let index = 0; index < workers; index++) {
    //     const yStart = x + index * pixelsPerWorker;
    //     const numPixelsInChunk = (index === workers - 1) ? height*width - index * pixelsPerWorker : pixelsPerWorker;
    //     const reader = this.readers[index];
    //     // promises.push(reader.getHistogram({uuid,start:[x,yStart,0,0],count:[width,numPixelsInChunk,1,1]})); 
    //     // histres.data.slice(yStart,yStart+numPixelsInChunk)
    //     // console.log(histres.data.slice(yStart,yStart+numPixelsInChunk));
    //     promises.push(reader.getHistogramDist({uuid,start:[x,yStart,0,0],count:[width,numPixelsInChunk,1,1],data:histres.data.slice(yStart,yStart+numPixelsInChunk),numBins:histres.numBins,binWidth:histres.binWidth,minValue:histres.minValue,maxValue:histres.maxValue})); 
  
    //   }
    //   return Promise.all(promises).then(res => {
    //     //Adding values as they come in, avoids heap error
    //     const hist = HistogramResponse.create();
    //     hist.numBins = histres.numBins;
    //     hist.binWidth = histres.binWidth;
  
  
    //     for (let index = 0; index < numBins; index++) {
    //       hist.bins.push(0)
    //     }
  
    //     for (const response of res){
    //       for (let index = 0; index < numBins; index++) {
    //         hist.bins[index] += response.bins[index];
    //       }
    //       // hist.bins = hist.bins.map((value, index) => value + response.bins[index])
    //       // console.log(hist.bins.slice(100,5))
    //       // console.log(response.bins.slice(100,5))
    //     }
  
    //     return hist;
    //   });
    // }
  


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

 function getMask(startX:number,startY:number,numX:number,numY:number,diameter:number) {
  let mask: boolean[] = [];
  const pow_radius = Math.pow(diameter / 2.0, 2);
  const centerX = (diameter - 1) / 2.0;
  const centerY = (diameter - 1) / 2.0;
  let index = 0;
  for (let y = startY; y < startY+numY; y++) {
      const pow_y = Math.pow(y - centerY, 2);

      for (let x = startX; x < startX+numX; x++) {
          
          mask[index++] = (pow_y + Math.pow(x - centerX, 2) <= pow_radius);
 
      }
  }

  return mask;
  
}