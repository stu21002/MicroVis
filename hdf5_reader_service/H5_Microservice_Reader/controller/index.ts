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

     const numWorkers = 1;
//     const startingPort = 8081
//     console.log("Starting Port : " + startingPort);
    const workerPool = new ReaderController(numWorkers,"0.0.0.0" ,8080);
  
    await workerPool.ready();

    const {startingX,startingY,adjustedWidth,adjustedHeight} = getCoords(600,600,10,10);
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
    const respones1 = await workerPool.getSpectralProfileStream(fileOpenResponse.uuid,startingX,startingY,0,1917,adjustedWidth+1,adjustedHeight+1,RegionType.CIRCLE,adjustedWidth+1);
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
  
function main2(){
const diameter = 5;

let space = "";

for (let i = 0; i < 5; i++) {
  const length = 2;
  const diameter = 30;
  const mask = getMask(i*2,0,2,10,10);
  const full = getMask(0,0,diameter,diameter,diameter);


  // console.log(mask);
  for (let i = 0; i < mask.length; i += length) {
    const row = mask.slice(i, i + length);
    // console.log(row.length);
    console.log(space+ row.join(' '));
  }

  for (let i = 0; i < full.length; i += diameter) {
    const row = full.slice(i, i + diameter);
    console.log(row.join(' '));
  }
  space=space+"    ";
  // for (let y = 0; y < diameter; y++) {
    
  //   for (let x = 0; x < diameter; x++) {
  //     const index = y * diameter + x;
  //     console.log(mask[index]);
  //   }
  // }
}

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
 