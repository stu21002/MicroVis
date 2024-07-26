import { RegionDataResponse, RegionType } from './bin/src/proto/H5ReaderServices';
import {H5Reader} from './src/Services/H5Reader'
import {Hdf5WorkerPool} from './src/Services/ReaderController'
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

    const numWorkers = 4;
    const workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
  
    await workerPool.ready();

    const {startingX,startingY,adjustedWidth,adjustedHeight} = getCoords(400,400,600,600);
    // console.log({startingX,startingY,adjustedWidth,adjustedHeight})
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



    console.time("Spectral Profile");
    const respones1 = await workerPool.getSpectralProfileStream(fileOpenResponse.uuid,startingX,startingY,0,1917,adjustedWidth+1,adjustedHeight+1,numWorkers);
    console.log("First five values : " + respones1.spectralData.subarray(0,5));
    console.timeEnd("Spectral Profile");
    console.log();

    console.time("ImageData");
    const respones2 = await workerPool.getRegionStream(fileOpenResponse.uuid,RegionType.RECTANGLE,[0,0,0,0],[600,600,1,1]);
    // console.log(respones2.points);
    console.timeEnd("ImageData");
    console.log();

    console.time("Spatial");
    const respones3 = await workerPool.getSpatial(fileOpenResponse.uuid,400,400);
    // console.log(respones2.xProfile);
    // console.log(respones2.yProfile);
    console.timeEnd("Spatial");
  
    console.log();


    workerPool.closeFile(fileOpenResponse.uuid);
}
main()
  
 