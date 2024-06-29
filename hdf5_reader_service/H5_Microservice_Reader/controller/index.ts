import { RegionDataResponse, RegionType } from './bin/src/proto/H5ReaderServices';
import {H5Reader} from './src/H5Reader'
import {ReaderController} from './src/ReaderController'
import { FILEINFO } from './src/test/FILEINFO';

// FILEINFO();
// async function main(){
//     console.log("Controller Start");
//     const reader:H5Reader = new H5Reader(1,"8");
//     console.log(await reader.checkStatus({}))
//     const uuid:string = "1";
//     const directory:string = "./files/";
//     const file:string = "h5.hdf5";
//     const hdu:string = "0";
//     let fileOpenResponse = await reader.openFile({uuid,file,directory,hdu})
//     let FileInfoResponse = await reader.getFileInfo({uuid})
//     console.log(fileOpenResponse);
//     console.log(FileInfoResponse);
//     let fileCloseResponse = await reader.closeFile({uuid})
//     console.log(fileCloseResponse);
// }



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

//     const numWorkers = arg4;
//     const startingPort = 8081
//     console.log("Starting Port : " + startingPort);
    const workerPool = new ReaderController(1,"0.0.0.0" ,8080);
  
//     await workerPool.ready();
  
//     console.time("getStatus");
//     await workerPool.checkStatus();
//     console.timeEnd("getStatus");
//     let isOk = true;
//     console.time("getFileInfo");
  
    let fileOpenResponse = await workerPool.openFile("/home/stuart/H5Files/","small.hdf5", "0");
    if (!fileOpenResponse?.uuid) {
      console.error("no uuid");
      return false;
    }
}
main()
  
//     const uuid = fileOpenResponse.uuid;
  
//     // let fileInfoResponse: FileInfoResponse | undefined;
//     // // const promises = [];
//     // for (let i = 0; i < 1000; i++) {
//     //   // promises.push(workerPool.getFileInfo(uuid).then(res=>isOk &&= res.fileName === inputFile));
//     //   fileInfoResponse = await workerPool.getFileInfo(uuid);
//     //   isOk &&= fileInfoResponse.hduShape?.[0] === 512;
//     // }
//     // // await Promise.all(promises);
  
//     // console.timeEnd("getFileInfo");
//     // console.log(isOk ? "OK" : "ERROR");
//     // if (fileInfoResponse) {
//     //   console.log(fileInfoResponse);
//     // }
  
//     const numImageTests = 32;
//     // let imageDataResponse: RegionDataResponse | undefined;
  
//     // // console.time("getImageDataParallel");
//     // // const promises = [];
//     // // for (let i = 0; i < numImageTests; i++) {
//     // //   promises.push(workerPool.getImageData(uuid, [1, 1, 1, 1], 512 * 512, i % numWorkers).then(res => imageDataResponse = res));
//     // //   //imageDataResponse = await workerPool.getImageData(uuid, "0", [1, 1, 1, 1], 512 * 512);
//     // // }
//     // // await Promise.all(promises);
//     // //
//     // // //const response = await workerPool.getImageData("/Users/angus/cubes/cosmos_spitzer3.6micron.fits", "0", [1, 1], 8209 * 8136);
//     // // console.timeEnd("getImageDataParallel");
  
//     // console.time("getImageData");
//     // for (let i = 0; i < numImageTests; i++) {
//     //   imageDataResponse = await workerPool.getImageData(uuid, [1, 1, 1, 1], 512 * 512);
//     // }
//     // console.timeEnd("getImageData");
  
//     // await workerPool.closeFile(uuid);
  
//     // if (!imageDataResponse) {
//     //   return;
//     // }
  
//     // fileOpenResponse = await workerPool.openFile("/home/angus/cubes/S255_IR_sci.spw29.cube.I.pbcor.fits", "0");
//     // if (!fileOpenResponse?.uuid) {
//     //   console.error("no uuid");
//     //   return false;
//     // }
  
//     // const uuid2 = fileOpenResponse.uuid;
  
//     console.time("getSpectralProfile");
//     const w = arg3;
//     // const { data } = await workerPool.getSpectralProfile(uuid, RegionType.RECTANGLE,arg1, arg2, 0, arg5, w,w, numWorkers);
//     console.timeEnd("getSpectralProfile");
//     // console.log((data));
  
//     await workerPool.closeFile(uuid);
//     return true;
//   }
  

//    main()
 