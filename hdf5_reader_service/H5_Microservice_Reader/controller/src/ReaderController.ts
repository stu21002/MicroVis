//adapted from https://github.com/CARTAvis/fits_reader_microservice/tree/main by Angus

import { v4 as uuidv4 } from "uuid";

import { H5Reader } from "./H5Reader";
import { RegionType, SpectralProfileResponse } from "../bin/src/proto/H5ReaderServices";
// import { bytesToFloat32 } from "../utils/arrays";

export class ReaderController {
  readonly readers: H5Reader[];
  //reader type [] extension for fits and hdf5 files

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

  async getImageData(uuid: string,regionType:RegionType, start: number[], count: number[], readerIndex?: number) {
    const reader = readerIndex !== undefined ? this.readers[readerIndex] : this.randomConnectedreader;
    return reader?.getRegionData({ uuid, start, count,regionType});
  }

  async getSpatial(uuid:string,x:number,y:number){
    if (this.readers.length = 1){
      // this.readers[0].getRegionData(uuid,) all x val for y
      // this.readers[0].getRegionData(uuid,) all y val for y
      console.log("YAY");
    }
    else (this.readers.length > 1)
      console.log("YAY");
    
  }
  //TODO 
  async getSpectralProfile_workLoadSplitZ(uuid: string,regionType:RegionType, x: number, y: number, z: number, numPixels: number, width = 1, height = 1,numreaders?: number) {
    if (!numreaders) {
      numreaders = this.readers.length;
    }

    const pixelsPerreader = Math.floor(numPixels / numreaders);
    const promises = new Array<Promise<SpectralProfileResponse>>();
    for (let i = 0; i < numreaders; i++) {
      const zStart = z + i * pixelsPerreader;
      // Last reader gets the remainder
      const numPixelsInChunk = (i === numreaders - 1) ? numPixels - i * pixelsPerreader : pixelsPerreader;
      const reader = this.readers[i % this.readers.length];
      promises.push(reader.getSpectralProfile({ uuid,regionType, x, y, z: zStart, width, height, numPixels: numPixelsInChunk }));
    }

    // Change when using bytes
    return Promise.all(promises).then(res => {
        const data = new Float32Array(numPixels);
        let offset = 0;
        for (const response of res) {
            data.set(response.data,offset);
            offset += response.data.length;
        }
    return {data}
    })
        


    };
  
}