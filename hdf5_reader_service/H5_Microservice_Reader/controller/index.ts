import { FileInfoRequest, FileInfoResponse } from "./bin/src/proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./bin/src/proto/OpenFile";
import { Empty, RegionType, StatusResponse } from "./bin/src/proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./bin/src/proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse } from "./bin/src/proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./bin/src/proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./bin/src/proto/Histogram";
import { Ingres } from './ingres';
import { H5Services } from './src/Services/H5Services';
import {Hdf5WorkerPool} from './src/Services/Hdf5WorkerPool'
import { bytesToFloat32 } from './src/utils/arrays';
import { getCoords } from './src/utils/coord';


// const args = process.argv.slice(2); // slice(2) removes the first two elements which are 'node' and the script name

// if (args.length === 0) {
//   console.log("No arguments provided.");
// } else {
//   console.log("Command line arguments:", args);
// }
// const numbers = args.map(arg => Number(arg));
// // Example: Accessing specific arguments
// const arg1 = numbers[0];
// const arg2 = numbers[1];
// const arg3 = numbers[2];
// const arg4 = numbers[3];
// const arg5 = numbers[4];



const {startingX,startingY,adjustedWidth,adjustedHeight} = getCoords(600,600,400,400);

 async function main() {

    const numWorkers = 1;
    const workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
  
    await workerPool.ready();

    console.log({startingX,startingY,adjustedWidth,adjustedHeight})
    console.log();

    console.time("getStatus");
    await workerPool.checkStatus();
    console.timeEnd("getStatus");
 
    console.log();

    
    console.time("OpenFile");
    let fileOpenResponse = await workerPool.openFile("/home/stuart/","Small.hdf5", "0");
    if (!fileOpenResponse?.uuid) {
      console.error("no uuid");
      return false;
    }
    console.timeEnd("OpenFile");

    console.log();


    console.time("Hist");
    const histRes = await workerPool.getHistogram(fileOpenResponse.uuid,startingX,startingY,0,adjustedWidth,adjustedHeight,0);
    console.timeEnd("Hist");
    console.log(histRes.bins.slice(0,6));
    console.log();



    console.time("Spectral Profile");
    const respones1 = await workerPool.getSpectralProfile(fileOpenResponse.uuid,startingX,startingY,0,5,adjustedWidth,adjustedHeight);
    // console.log("Main First five values : " + respones1.spectralData.subarray(0,5));
    console.timeEnd("Spectral Profile");
    console.log();

    console.time("ImageData");
    const respones2 = await workerPool.getImageDataStream(fileOpenResponse.uuid,RegionType.RECTANGLE,[200,200,0],[200,200,10]);
    // console.log(respones2[0].rawValuesFp32.buffer)
    // console.log(bytesToFloat32(respones2[0].rawValuesFp32));
    console.timeEnd("ImageData");
    console.log();
    for await (const iterator of respones2) {
      console.log(await iterator);
    }


    // console.time("Spatial");
    // const respones3 = await workerPool.getSpatial(fileOpenResponse.uuid,400,400);
    // // console.log(respones3);
    // console.timeEnd("Spatial");
    // console.log();


    workerPool.closeFile(fileOpenResponse.uuid);
}

async function test(){
  
  
  const h5Services = new H5Services("0.0.0.0",8079,4);
  await h5Services.workerPool.ready();
  const ingres = new Ingres("0.0.0.0",8079);
  
  const fileOpenResponse = await ingres.openFile({uuid:"",file:"Small.hdf5",directory:"/home/stuart/",hdu:"0"});
  const uuid1 = fileOpenResponse.uuid;
  if (!uuid1) {
    console.error("no uuid");
    return false;
  }
  
  const histgram_request = SetHistogramReq.create();
  histgram_request.x = startingX;
  histgram_request.y = startingY;
  histgram_request.z = 0;
  histgram_request.width = adjustedWidth;
  histgram_request.height = adjustedHeight;
  histgram_request.depth = 0;
  histgram_request.uuid = uuid1;
  
  console.time("Hist");
  const histRes = await ingres.getHistogram(histgram_request);
  console.timeEnd("Hist");
  console.log(histRes.bins.slice(0,6));
  console.log();
  
  
  const spectral_request = SpectralProfileRequest.create();
  spectral_request.x = startingX;
  spectral_request.y = startingY;
  spectral_request.z = 0;
  spectral_request.height = adjustedHeight;
  spectral_request.width = adjustedWidth;
  spectral_request.numPixels = 1917;
  spectral_request.uuid = uuid1;
  spectral_request.regionType = RegionType.RECTANGLE;
  
  
  console.time("Spectral Profile");
  const spec_res =  await ingres.getSpectralProfile(spectral_request);
  console.log("Ingres First five values : " + bytesToFloat32(spec_res.rawValuesFp32).subarray(0,5));
  console.timeEnd("Spectral Profile");
  console.log();
  

  const image_request = ImageDataRequest.create();
  image_request.uuid = uuid1;
  image_request.start = [400,400,0];
  image_request.count = [200,200,4];
  image_request.regionType = RegionType.RECTANGLE;

  console.time("ImageData");
  const image_res = await ingres.getImageDataStream(image_request);
  console.log(image_res)
  // console.log(image_res(respones2[0].rawValuesFp32));
  console.timeEnd("ImageData");
  console.log();

  const spatial_request = SetSpatialReq.create();
  spatial_request.uuid = uuid1;
  spatial_request.x = 200;
  spatial_request.y = 200;

  console.time("Spatial");
  const respones3 = await ingres.getSpatialProfile(spatial_request);
  console.log(respones3);
  console.timeEnd("Spatial");
  console.log();
  
  ingres.closeFile({uuid:uuid1});
  
}

// main()
test()




function main2(){
  
  
  const diameter = 5;
  const full = getMask(0,0,diameter,diameter,diameter);
  console.log(full)
  // let space = "";
  
  // for (let i = 0; i < 5; i++) {
//   const length = 2;
//   const diameter = 30;
//   const mask = getMask(i*2,0,2,10,10);
//   const full = getMask(0,0,diameter,diameter,diameter);


  // console.log(mask);
  // for (let i = 0; i < mask.length; i += length) {
  //   const row = mask.slice(i, i + length);
  //   // console.log(row.length);
  //   console.log(space+ row.join(' '));
  // }

  // for (let i = 0; i < full.length; i += diameter) {
  //   const row = full.slice(i, i + diameter);
  //   console.log(row.join(' '));
  // }
  // space=space+"    ";
  // for (let y = 0; y < diameter; y++) {
    
  //   for (let x = 0; x < diameter; x++) {
  //     const index = y * diameter + x;
  //     console.log(mask[index]);
  //   }
  // }
// }

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
// main2()
 