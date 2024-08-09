import { FileInfoRequest, FileInfoResponse } from "./src/proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./src/proto/OpenFile";
import { Empty, RegionInfo, RegionType, StatusResponse } from "./src/proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./src/proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse } from "./src/proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./src/proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./src/proto/Histogram";
import { Ingres } from './ingres';
import {Hdf5WorkerPool} from './src/H5Service/H5WorkerPool'
import { bytesToFloat32 } from './src/utils/arrays';
import { SetRegion } from "./src/proto/Region";

import { H5Services } from './src/H5Service/H5Services';
import { getCoords } from './src/utils/coord';

const args = process.argv.slice(2); // slice(2) removes the first two elements which are 'node' and the script name
let numWorkers = 1;
if (args.length > 0) {
  numWorkers = Number(args[0]);
} 

const h5Services = new H5Services("0.0.0.0",8079,numWorkers);
async()=>{await h5Services.workerPool.ready()
  console.log("Connected!")
};




//  async function main() {

//     const numWorkers = 1;
//     const workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
  
//     await workerPool.ready();

//     console.log({startingX,startingY,adjustedWidth,adjustedHeight})
//     console.log();

//     console.time("getStatus");
//     await workerPool.checkStatus();
//     console.timeEnd("getStatus");
 
//     console.log();

    
//     console.time("OpenFile");
//     let fileOpenResponse = await workerPool.openFile("/home/stuart/","Small.hdf5", "0");
//     if (!fileOpenResponse?.uuid) {
//       console.error("no uuid");
//       return false;
//     }
//     console.timeEnd("OpenFile");

//     console.log();


//     console.time("Hist");
//     const histRes = await workerPool.getHistogram(fileOpenResponse.uuid,startingX,startingY,0,adjustedWidth,adjustedHeight,0);
//     console.timeEnd("Hist");
//     console.log(histRes.bins.slice(0,6));
//     console.log();



//     console.time("Spectral Profile");
//     const respones1 = await workerPool.getSpectralProfile(fileOpenResponse.uuid,startingX,startingY,0,5,adjustedWidth,adjustedHeight);
//     // console.log("Main First five values : " + respones1.spectralData.subarray(0,5));
//     console.timeEnd("Spectral Profile");
//     console.log();

//     console.time("ImageData");
//     const respones2 = await workerPool.getImageDataStream(fileOpenResponse.uuid,RegionType.RECTANGLE,[200,200,0],[200,200,10]);
//     // console.log(respones2[0].rawValuesFp32.buffer)
//     // console.log(bytesToFloat32(respones2[0].rawValuesFp32));
//     console.timeEnd("ImageData");
//     console.log();
//     for await (const iterator of respones2) {
//       console.log(await iterator);
//     }


//     // console.time("Spatial");
//     // const respones3 = await workerPool.getSpatial(fileOpenResponse.uuid,400,400);
//     // // console.log(respones3);
//     // console.timeEnd("Spatial");
//     // console.log();


//     workerPool.closeFile(fileOpenResponse.uuid);
// // }

async function test(){
  
  console.log("Running");
  const h5Services = new H5Services("0.0.0.0",8079,1);
  await h5Services.workerPool.ready();
  const ingres = new Ingres("0.0.0.0",8079);
  
  const fileOpenResponse = await ingres.openFile({uuid:"",file:"Small.hdf5",directory:"/home/stuart/",hdu:"0"});
  const uuid1 = fileOpenResponse.uuid;
  if (!uuid1) {
    console.error("no uuid");
    return false;
  }
  
  // const histgram_request = SetHistogramReq.create();

  // histgram_request.z = 0;
 
  // histgram_request.depth = 0;
  // histgram_request.uuid = uuid1;
  
  // console.time("Hist");
  // const histRes = await ingres.getHistogram(histgram_request);
  // console.timeEnd("Hist");
  // console.log(histRes.bins.slice(0,6));
  // console.log();

  const region_info = RegionInfo.create();
  region_info.regionType = RegionType.RECTANGLE;
  region_info.controlPoints.push({x:200,y:200});
  region_info.controlPoints.push({x:400,y:400});


  const set_region = SetRegion.create();
  set_region.fileId=uuid1;
  set_region.regionId=0;
  set_region.regionInfo=region_info;

  console.time("Region");
  const region_res =  await ingres.CreateRegion(set_region);
  console.log(region_res);
  console.timeEnd("Region");
  console.log();

  
  const spectral_request = SpectralProfileRequest.create();
  // spectral_request.x = startingX;
  // spectral_request.y = startingY;
  // spectral_request.z = 0;
  // spectral_request.height = adjustedHeight;
  // spectral_request.width = adjustedWidth;
  // spectral_request.numPixels = 1917;
  spectral_request.uuid = uuid1;
  spectral_request.regionId = region_res.regionId;
  
  
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

  // console.time("ImageData");
  // const image_res = await ingres.getImageDataStream(image_request);
  // console.log(image_res)
  // // console.log(image_res(respones2[0].rawValuesFp32));
  // console.timeEnd("ImageData");
  // console.log();

  const spatial_request = SetSpatialReq.create();
  spatial_request.uuid = uuid1;
  spatial_request.x = 200;
  spatial_request.y = 200;

  // console.time("Spatial");
  // const respones3 = await ingres.getSpatialProfile(spatial_request);
  // console.log(respones3);
  // console.timeEnd("Spatial");
  // console.log();
  
  ingres.closeFile({uuid:uuid1});
  
}

// main()
// test()


