import {H5Reader} from './src/H5Reader'
async function main(){
    console.log("Controller Start");
    const reader:H5Reader = new H5Reader(9999);
    console.log(await reader.checkStatus({}))
    const uuid:string = "1";
    const directory:string = "./files/";
    const file:string = "h5.hdf5";
    const hdu:string = "0";
    let fileOpenResponse = await reader.openFile({uuid,file,directory,hdu})
    let FileInfoResponse = await reader.getFileInfo({uuid})
    console.log(fileOpenResponse);
    console.log(FileInfoResponse);
    let fileCloseResponse = await reader.closeFile({uuid})
    console.log(fileCloseResponse);
}

main();