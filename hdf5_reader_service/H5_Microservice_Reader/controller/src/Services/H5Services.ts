import {
  handleUnaryCall,
  handleServerStreamingCall,
  Server, ServerCredentials,
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream
  
} from "@grpc/grpc-js";


import { Empty, H5ServicesServer, H5ServicesService, HistogramRequest, HistogramResponse, ImageDataRequest, ImageDataResponse, RegionType, SetSpatialReq, SpatialProfileData, SpectralProfileRequest, SpectralProfileResponse, StatusResponse } from "../../bin/src/proto/H5ReaderService";
import { FileInfoRequest, FileInfoResponse } from "../../bin/src/proto/FileInfo";
import { OpenFileRequest, OpenFileACK, FileCloseRequest } from "../../bin/src/proto/OpenFile";
import { Hdf5WorkerPool } from "./Hdf5WorkerPool";

export class H5Services {
  readonly workerPool:Hdf5WorkerPool;
 
  public serviceImp:H5ServicesServer={

    openFile: async (call:ServerUnaryCall<OpenFileRequest, OpenFileACK>,callback:sendUnaryData<OpenFileACK>):Promise<void> => {
      // Implement your logic here
      console.log("Open file called");
      const {directory,file,hdu} = call.request
  
      const openFileAck = OpenFileACK.create();
      const fileOpenResponse = await this.workerPool.openFile(directory,file,hdu)
      if (!fileOpenResponse?.uuid) {
        console.error("no uuid");
        openFileAck.success=false;
        openFileAck.message="Failed to open file";
        callback(null,openFileAck);
      }else{
        openFileAck.success=true;
        openFileAck.message=fileOpenResponse.uuid;
        //Get to not require dir/file;
        const fileInfoResponse = await this.workerPool.getFileInfo(fileOpenResponse.uuid,directory,file,hdu)
        openFileAck.fileInfo=fileInfoResponse.fileInfo;
        openFileAck.fileInfoExtended=fileInfoResponse.fileInfoExtended;
        callback(null, openFileAck);
      }
    },

    checkStatus: async (call:ServerUnaryCall<Empty, StatusResponse>,callback:sendUnaryData<StatusResponse>):Promise<void> => {
      // Implement your logic here
      console.log("Status called");
      const res = await this.workerPool.checkStatus()
      callback(null,res);
    },
    closeFile: (call:ServerUnaryCall<FileCloseRequest, StatusResponse>,callback:sendUnaryData<StatusResponse>):void => {
      // Implement your logic here
      console.log("Close file called");
      callback(null, { /* return appropriate OpenFileACK response */ });
    },
    getFileInfo: (call:ServerUnaryCall<FileInfoRequest, FileInfoResponse>,callback:sendUnaryData<FileInfoResponse>):void => {
      // Implement your logic here
      console.log("Open file called");
      callback(null, { /* return appropriate OpenFileACK response */ });
    },

    getImageDataStream: async (call:ServerWritableStream<ImageDataRequest, ImageDataResponse>):Promise<void> => {
      let {uuid,start,count,regionType} = call.request;
      if (!regionType){
        regionType=RegionType.RECTANGLE;
      }
      const responses =  this.workerPool.getImageDataStream(uuid,regionType,start,count)
      for (const response of await responses) {
          for  (const chunk of await response) {
            call.write( chunk)
          }
      }
      call.end();
    },

    getSpatialProfile: (call:ServerUnaryCall<SetSpatialReq, SpatialProfileData>,callback:sendUnaryData<SpatialProfileData>):void => {
      // Implement your logic here
      console.log("Open file called");
      callback(null, { /* return appropriate OpenFileACK response */ });
    },

    getSpectralProfile: (call:ServerUnaryCall<SpectralProfileRequest, SpectralProfileResponse>,callback:sendUnaryData<SpectralProfileResponse>):void => {
      // Implement your logic here
      console.log("Open file called");
      callback(null, { /* return appropriate OpenFileACK response */ });
    },
    getHistogram: (call:ServerUnaryCall<HistogramRequest, HistogramResponse>,callback:sendUnaryData<HistogramResponse>):void => {
      // Implement your logic here
      console.log("Open file called");
      callback(null, { /* return appropriate OpenFileACK response */ });
    } 
  }
  
  constructor(address:string,port: number = 8080,numWorkers=1) {
    const SERVICE_URL = `${address}:${port}`;
    this.workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);

    const server = new Server();
    server.addService(H5ServicesService,this.serviceImp);
    server.bindAsync(
      address,
      ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          throw error;
        }
        console.log("server is running on", SERVICE_URL);
      }
    );


    //Linking 
  }
  
}