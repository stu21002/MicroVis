//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus Comrie

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { bytesToFloat32, bytesToInt32 } from "../utils/arrays";
import { RegionInfo, RegionType } from "../proto/defs";
import { ImageDataResponse } from "../proto/ImageData";
import { SpatialProfile } from "../proto/SpatialProfile";
import { SpectralProfileReaderResponse, SpectralProfileResponse } from "../proto/SpectralProfile";


//Class for management of file readers and distribution of workloads
export class Hdf5WorkerPool {

  //List of readers
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

  //Methods for accessing readers
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


  //Opens file on all connected readers
  async openFile(directory: string,file: string, hdu: string = "") {
    const uuid = uuidv4();
    const promises = this.readers.map((reader) => reader.openFile({ directory, file, hdu, uuid }));  
    return Promise.all(promises).then(responses => {
      return responses.every(res => res.status) ? { uuid } : undefined;
    });
  }

  //Closes a file on all connnected readers
  async closeFile(uuid: string) {
    const promises = this.readers.map((reader) => reader.closeFile({ uuid }));
    return Promise.all(promises).then(responses => {
      return responses.every(res => res.status);
    });
  }

  //Gets file info, using first reader
  async getFileInfo(uuid: string,directory:string,file:string,hdu:string) {
    return this.primaryreader?.getFileInfo({ uuid ,directory ,file ,hdu });
  }
  
  //Gets a stream of image data
  async getImageDataStream(uuid: string,permData:boolean,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {

    const promises: Array<Promise<ImageDataResponse[]>> = [];
    const numWorkers = this.readers.length;

    if (numWorkers==1){
      //Single readers       
      promises.push(this.primaryreader.getImageDataStream({ uuid,permData,start, count,regionType:RegionType.RECTANGLE}));

    }
    else{      
      //Multiple readers
      //For permutated data
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
        //For normal data (FITS data)

        //Split across Z axis for Z values greater than 1 
        if (count[2]>1){
          const pixelsPerWorker = Math.floor(count[2] / numWorkers);
          for (let i = 0; i < this.readers.length; i++) {
            
            const zStart = start[2] + i * pixelsPerWorker;
            const numPixelsInChunk = (i === numWorkers - 1) ? count[2] - i * pixelsPerWorker : pixelsPerWorker;
            const reader = this.readers[i % this.readers.length];
            const tempStart = [start[0],start[1],zStart]
            const tempCount = [count[0],count[1],numPixelsInChunk]
            if (tempCount.reduce((accumulator, currentValue) => accumulator * currentValue, 1)>0){
              promises.push(reader.getImageDataStream({ uuid,permData,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}));
            }
          }
        }else{
          //Split across Y axis for Z values of 1
          const pixelsPerWorker = Math.floor(count[1] / numWorkers);
          for (let i = 0; i < this.readers.length; i++) {
            
            const yStart = start[1] + i * pixelsPerWorker;
            const numPixelsInChunk = (i === numWorkers - 1) ? count[1] - i * pixelsPerWorker : pixelsPerWorker;
            const reader = this.readers[i % this.readers.length];
            const tempStart = [start[0],yStart,start[2]]
            const tempCount = [count[0],numPixelsInChunk,1]
            if (tempCount.reduce((accumulator, currentValue) => accumulator * currentValue, 1)>0){
              promises.push(reader.getImageDataStream({ uuid,permData,start:tempStart, count:tempCount,regionType:RegionType.RECTANGLE}));
            }
          }
        }
      }
    }
  
    return promises;

  }

  //Creates spatial, from image data requests
  async getSpatial(uuid:string,x:number,y:number,width:number,height:number){

      const promises = new Array<Promise<ImageDataResponse[]>>

      if (this.readers.length==1){
        //Single reader
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
      }
      else{
        //Multi reader
        //y
        promises.push(( this.readers[0].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[x,0,0,0],count:[1,height,1,1]})))
        //x
        promises.push(( this.readers[1].getImageDataStream({uuid,permData:false,regionType:RegionType.LINE,start:[0,y,0,0],count:[width,1,1,1]})))
      }
     

      return Promise.all(promises).then(
        ([yImageData, xImageData]) => {
          const profiles:SpatialProfile[]=[];

          //Creating spatial profile responses
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

  //Gets spectral profile
  async getSpectralProfile(uuid: string, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,region_info:RegionInfo,numWorkers?: number) {
    if (!numWorkers) {
      numWorkers = this.readers.length;
    }
    //Calculating workload distribution
    const pixelsPerWorker = Math.floor(width / numWorkers);
    const promises = new Array<Promise<SpectralProfileReaderResponse>>();

    //Making requests to the readers
    for (let i = 0; i < numWorkers; i++) {
      const xStart = x + i * pixelsPerWorker;
      const numPixelsInChunk = (i === numWorkers - 1) ? width - i * pixelsPerWorker : pixelsPerWorker;
      const reader = this.readers[i % this.readers.length];
      promises.push(reader.getSpectralProfile({ uuid,regionInfo:region_info, x:xStart, y, z, width:numPixelsInChunk, height, numPixels }));

    }
    
    //Calculation of Partial statsistics 
    const spectralData = new Float32Array(numPixels);
    const statistic = new Float32Array(numPixels).fill(0);
    const counts = Array(numPixels).fill(0);
    
    return Promise.all(promises).then(res => {
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
