import {
  handleUnaryCall,
  handleServerStreamingCall,
  Server, ServerCredentials,
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  status
  
} from "@grpc/grpc-js";


import { Empty, H5ServicesServer, H5ServicesService, HistogramRequest, HistogramResponse, ImageDataRequest, ImageDataResponse, RegionType, SetHistogramReq, SetSpatialReq, SpatialProfileData, SpectralProfileRequest, SpectralProfileResponse, StatusResponse } from "../../bin/src/proto/H5ReaderService";
import { FileInfoRequest, FileInfoResponse } from "../../bin/src/proto/FileInfo";
import { OpenFileRequest, OpenFileACK, FileCloseRequest } from "../../bin/src/proto/OpenFile";
import { Hdf5WorkerPool } from "./Hdf5WorkerPool";
import { FileInfoExtended } from "../../bin/src/proto/defs";
import { bytesToFloat32, float32ToBytes } from "../utils/arrays";


interface DimensionValues {
  width: number;
  height: number;
  depth?: number;
  stokes?: number;
  dims:number;
}

export class H5Services {
  readonly workerPool:Hdf5WorkerPool;
  readonly fileDims: Map<string,DimensionValues > = new Map();
  
  constructor(address:string,port: number = 8080,numWorkers=1) {
    const SERVICE_URL = `${address}:${port}`;
    this.workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
  
    const server = new Server();
    server.addService(H5ServicesService,this.serviceImp);
    server.bindAsync(
      SERVICE_URL,
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

        //Get to not require dir/file;
        const fileInfoResponse = await this.workerPool.getFileInfo(fileOpenResponse.uuid,directory,file,hdu)

        if (!fileInfoResponse.fileInfoExtended) {

          openFileAck.success=false;
          openFileAck.message="No file info";
          callback(null, openFileAck);

        }else{

          openFileAck.success=true;
          openFileAck.message=fileOpenResponse.uuid;
          openFileAck.fileInfo=fileInfoResponse.fileInfo;
          openFileAck.fileInfoExtended=fileInfoResponse.fileInfoExtended; 

          const dimensionValues: DimensionValues = {
            width: fileInfoResponse.fileInfoExtended.width,
            height: fileInfoResponse.fileInfoExtended.height,
            depth: fileInfoResponse.fileInfoExtended.depth,
            stokes: fileInfoResponse.fileInfoExtended.stokes,
            dims: fileInfoResponse.fileInfoExtended.dimensions
          };

          this.fileDims.set(fileOpenResponse.uuid,dimensionValues);
          callback(null, openFileAck);
        }
      }
    },

    checkStatus: async (call:ServerUnaryCall<Empty, StatusResponse>,callback:sendUnaryData<StatusResponse>):Promise<void> => {
      console.log("Status called");
      const res = await this.workerPool.checkStatus()
      callback(null,res);

    },
    closeFile: async (call:ServerUnaryCall<FileCloseRequest, StatusResponse>,callback:sendUnaryData<StatusResponse>):Promise<void> => {
      console.log("Close file called");
      const response = StatusResponse.create();
      response.status = await this.workerPool.closeFile(call.request.uuid)
      callback(null,response);
    },

    getFileInfo: async (call:ServerUnaryCall<FileInfoRequest, FileInfoResponse>,callback:sendUnaryData<FileInfoResponse>):Promise<void> => {
      // Implement your logic here
      console.log("File Info called");
      callback(null,await this.workerPool.getFileInfo(call.request.uuid,call.request.directory,call.request.file,call.request.hdu));
    },

    getImageDataStream: async (call:ServerWritableStream<ImageDataRequest, ImageDataResponse>):Promise<void> => {
      let {uuid,start,count,regionType} = call.request;
      if (!regionType){
        regionType=RegionType.RECTANGLE;
      }
      const responses =  this.workerPool.getImageDataStream(uuid,regionType,start,count)
 
      for (const response of (await responses)) {

          for  (const chunk of (await response)) {

            call.write( chunk)
          }
      }
      call.end();
    },

    getSpatialProfile: async(call:ServerUnaryCall<SetSpatialReq, SpatialProfileData>,callback:sendUnaryData<SpatialProfileData>):Promise<void> => {
      // Implement your logic here
      console.log("Spatial Profile called");
      const {uuid,x,y} = call.request;
      const dimensions = this.fileDims.get(uuid);
      if (!dimensions){
        console.log("File Not Found")
      }else{

        const spatial_profiles = await this.workerPool.getSpatial(uuid,x,y,dimensions?.width,dimensions?.height);
        
        const spatial_profile_data = SpatialProfileData.create();
        spatial_profile_data.uuid = uuid;
        spatial_profiles.profiles.forEach(profile => {
          spatial_profile_data.profiles.push(profile)
        });

        callback(null,spatial_profile_data);
      }
    },

    getSpectralProfile: async (call:ServerUnaryCall<SpectralProfileRequest, SpectralProfileResponse>,callback:sendUnaryData<SpectralProfileResponse>):Promise<void> => {
      console.log("Spectral Profile called");
      const {uuid,x,y,z,width,height,numPixels} = call.request;
      const spectral_profile = await this.workerPool.getSpectralProfile(uuid,x,y,z,numPixels,width,height,RegionType.RECTANGLE);
      const spectral_profile_response = SpectralProfileResponse.create();
      // spectral_profile_response.rawValuesFp32 = float32ToBytes(spectral_profile.spectralData);
      spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
      callback(null, spectral_profile_response);
    },

    getHistogram: async (call:ServerUnaryCall<SetHistogramReq, HistogramResponse>,callback:sendUnaryData<HistogramResponse>):Promise<void> => {
      console.log("Histogram called");
      const {uuid,x,y,z,width,height,depth} = call.request;
      callback(null, await this.workerPool.getHistogram(uuid,x,y,z,width,height,depth));
    } 
  }
  
  
}