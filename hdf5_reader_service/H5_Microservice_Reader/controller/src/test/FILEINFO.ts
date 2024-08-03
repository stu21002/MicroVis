import { FileInfoRequest, FileInfoResponse } from '../../bin/src/proto/FileInfo';
import {Hdf5WorkerPool} from '../H5Service/H5WorkerPool';
import config from "./config.json";


interface AssertItem {
    fileInfoReq: FileInfoRequest;
    fileInfoRes:FileInfoResponse;
}

let assertItem: AssertItem = {

    fileInfoReq: {
        uuid:"", // uuid for non open files
        directory:"/home/stuart/H5Files/",
        file:"small.hdf5",
        hdu:"0"
    },
    fileInfoRes: {
        fileInfo:{
        name:"",
        size:0,
        HDUList:[],
        date:0
      },
      fileInfoExtended:{
        dimensions:4,
        depth:5,
        width:10,
        height:10,
        stokes:2
      },
      success:true,
      message:""
    },
}
// describe(`File Info Test `, ()=> {
//     const readers = new ReaderController(1,config.serverUrl, config.startingPort);
//     test(`Getting info for ${assertItem.fileInfoReq.file}`, async ()=>{

//       const response = await readers.getFileInfo("",assertItem.fileInfoReq.directory,assertItem.fileInfoReq.file,assertItem.fileInfoReq.hdu);
//       console.log(response);
//       expect(response.success).toBe(true);
//     })
    
//  })

  const FILEINFO = async() => {
    const readers = new Hdf5WorkerPool(1,config.serverUrl, config.startingPort);
    console.time("FILEINFO");
    const response = await readers.getFileInfo("",assertItem.fileInfoReq.directory,assertItem.fileInfoReq.file,assertItem.fileInfoReq.hdu);
    console.timeEnd("FILEINFO");
    // console.log(response);
  }
    
export {FILEINFO} 



