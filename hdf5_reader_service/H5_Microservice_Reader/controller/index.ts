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
  
//     console.time("getStatus");
//     await workerPool.checkStatus();
//     console.timeEnd("getStatus");
//     let isOk = true;
//     console.time("getFileInfo");
  
    let fileOpenResponse = await workerPool.openFile("/media/stuart/Elements/","Big.hdf5", "0");
    if (!fileOpenResponse?.uuid) {
      console.error("no uuid");
      return false;
    }

    const {startingX,startingY,adjustedWidth,adjustedHeight} = getCoords(764,369,231,463);
    console.log({startingX,startingY,adjustedWidth,adjustedHeight})

    const respones1 = await workerPool.getSpectralProfileStream(fileOpenResponse.uuid,startingX,startingY,0,1917,adjustedWidth+1,adjustedHeight+1,numWorkers);
    console.log(respones1)

 

    // const respones2 = await workerPool.getSpectralProfile(fileOpenResponse.uuid,startingX,startingY,0,1,adjustedWidth+1,adjustedHeight+1,numWorkers);
    // console.log(respones2)

    // const respones3 = await workerPool.getSpectralProfile(fileOpenResponse.uuid,startingX,startingY,0,1,adjustedWidth+1,adjustedHeight+1,1);
    // console.log(respones3)



    workerPool.closeFile(fileOpenResponse.uuid);
}
main()
  
 