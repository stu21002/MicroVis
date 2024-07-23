import { RegionDataResponse, RegionType } from './bin/src/proto/H5ReaderServices';
import {H5Reader} from './src/Services/H5Reader'
import {ReaderController} from './src/Services/ReaderController'
import { FILEINFO } from './src/test/FILEINFO';
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

 async function main() {

     const numWorkers = 20;
//     const startingPort = 8081
//     console.log("Starting Port : " + startingPort);
    const workerPool = new ReaderController(numWorkers,"0.0.0.0" ,8080);
  
    await workerPool.ready();

    const {startingX,startingY,adjustedWidth,adjustedHeight} = getCoords(600,600,400,400);
    console.log({startingX,startingY,adjustedWidth,adjustedHeight})
  
    // console.time("getStatus");
    // await workerPool.checkStatus();
    // console.timeEnd("getStatus");
    // let isOk = true;
    // console.time("getFileInfo");


    let fileOpenResponse = await workerPool.openFile("/home/stuart/","Small.hdf5", "0");
    if (!fileOpenResponse?.uuid) {
      console.error("no uuid");
      return false;
    }



    console.time("Spectral Profile");
    const respones1 = await workerPool.getSpectralProfileStream(fileOpenResponse.uuid,startingX,startingY,0,1917,adjustedWidth+1,adjustedHeight+1,numWorkers);
    console.log(respones1.spectralData.subarray(0,5));
    console.timeEnd("Spectral Profile");

    // console.time("Stream");
    // const respones2 = await workerPool.getRegionStream(fileOpenResponse.uuid,RegionType.RECTANGLE,[0,0,0,0],[1920,1920,1,1]);
    // // console.log(respones2.points);
    // console.timeEnd("Stream");

    // console.time("Spatial");
    // const respones3 = await workerPool.getSpatial(fileOpenResponse.uuid,900,900);
    // // console.log(respones2.xProfile);
    // // console.log(respones2.yProfile);
    // console.timeEnd("Spatial");
  


    workerPool.closeFile(fileOpenResponse.uuid);
}
main()
  
 