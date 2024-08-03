import {
  handleUnaryCall,
  handleServerStreamingCall,
  Server, ServerCredentials,
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  status,
} from "@grpc/grpc-js";


import { FileInfoRequest, FileInfoResponse } from "../../bin/src/proto/FileInfo";
import { OpenFileRequest, OpenFileACK, FileCloseRequest } from "../../bin/src/proto/OpenFile";
import { Hdf5WorkerPool } from "./H5WorkerPool";
import { Empty, FileInfoExtended, RegionInfo, RegionType, StatusResponse } from "../../bin/src/proto/defs";
import { bytesToFloat32, float32ToBytes } from "../utils/arrays";
import { H5ServicesServer, H5ServicesService } from "../../bin/src/proto/H5ReaderService";
import { ImageDataRequest, ImageDataResponse } from "../../bin/src/proto/ImageData";
import { SetSpatialReq, SpatialProfileData } from "../../bin/src/proto/SpatialProfile";
import { SpectralProfileRequest, SpectralProfileResponse } from "../../bin/src/proto/SpectralProfile";
import { HistogramResponse, SetHistogramReq } from "../../bin/src/proto/Histogram";
import { SetRegion, SetRegionAck } from "../../bin/src/proto/Region";
import { getCoords } from "../utils/coord";


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
  readonly regions:Map<number,RegionInfo> = new Map();
  regionId:number;

  constructor(address:string,port: number = 8080,numWorkers=1) {
    const SERVICE_URL = `${address}:${port}`;
    this.workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
    this.regionId = 0;
    const server = new Server();
    server.addService(H5ServicesService,this.serviceImp);
    server.bindAsync(
      SERVICE_URL,
      ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          throw error;
        }
        console.log("Reader Service is running on", SERVICE_URL);
      }
    );
    
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
        const fileInfoResponse = await this.workerPool.getFileInfo(fileOpenResponse.uuid,"","",hdu)

        if (!fileInfoResponse.fileInfoExtended) {

          openFileAck.success=false;
          openFileAck.message="No file info";
          callback(null, openFileAck);

        }else{

          openFileAck.success=true;
          openFileAck.uuid=fileOpenResponse.uuid;
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
        const error = {
          code: status.NOT_FOUND,
          message: "File not found: " + uuid
        };
        callback(error, null);

        return;
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
      const {uuid,regionId,x,y,z,width,height,numPixels} = call.request;
      const dimension_values = this.fileDims.get(uuid);
      const region_info = this.regions.get(regionId);

      if (!dimension_values){
        console.log("No file found : " + uuid);
        const error = {
          code: status.NOT_FOUND,
          message: "file not found: " + uuid
        };
        callback(error, null);
        return;
      }

      if (!region_info){
        console.log("No Region found : " + regionId);
        const error = {
          code: status.NOT_FOUND,
          message: "Region not found: " + regionId
        };
        callback(error, null);
        return;
      }
    
      let {depth} = dimension_values;
      if (!depth){
        depth = 1;
      }
      //This will only work for circles and rectangles
      const points = region_info.controlPoints;
      const {startingX,startingY,adjustedHeight,adjustedWidth} = getCoords(points[0].x,points[0].y,points[1].x,points[1].y)
      const spectral_profile = await this.workerPool.getSpectralProfile(uuid,startingX,startingY,0,depth,adjustedWidth,adjustedHeight,region_info);
      const spectral_profile_response = SpectralProfileResponse.create();
      spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
      callback(null, spectral_profile_response);

      // switch (region_info.regionType) {
      //   case RegionType.CIRCLE:
      //     const points = region_info.controlPoints;
      //     const {startingX,startingY,adjustedHeight,adjustedWidth} = getCoords(points[0].x,points[0].y,points[1].x,points[1].y)
      //     const spectral_profile = await this.workerPool.getSpectralProfile(uuid,startingX,startingY,0,depth,adjustedWidth,adjustedHeight,region_info);
      //     const spectral_profile_response = SpectralProfileResponse.create();
      //     spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
      //     callback(null, spectral_profile_response);
      //     break;

      //   case RegionType.RECTANGLE:
      //     points = region_info.controlPoints;
      //     const {startingX,startingY,adjustedHeight,adjustedWidth} = getCoords(points[0].x,points[0].y,points[1].x,points[1].y)
      //     const spectral_profile = await this.workerPool.getSpectralProfile(uuid,startingX,startingY,0,depth,adjustedWidth,adjustedHeight,region_info);
      //     const spectral_profile_response = SpectralProfileResponse.create();
      //     spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
      //     callback(null, spectral_profile_response);
      //     break;
      //   default:
      //     break;
      // }
      const error = {
        code: status.UNIMPLEMENTED,
        message: "Region Type Not Implemented" + region_info.regionType.toString()
      };
      callback({},null);
    },

    getHistogram: async (call:ServerUnaryCall<SetHistogramReq, HistogramResponse>,callback:sendUnaryData<HistogramResponse>):Promise<void> => {
      console.log("Histogram called");
      const {uuid,x,y,z,width,height,depth} = call.request;
      callback(null, await this.workerPool.getHistogram(uuid,x,y,z,width,height,depth));
    }, 
    createRegion: async(call:ServerUnaryCall<SetRegion,SetRegionAck>,callback:sendUnaryData<SetRegionAck>):Promise<void>=>{
      console.log("Creating Region");
      if (call.request.regionInfo){
        if (call.request.regionId == 0){
          this.regionId++;
          this.regions.set(this.regionId,call.request.regionInfo)
        } 
        else{
          this.regions.set(call.request.regionId,call.request.regionInfo)
        }
        callback(null,{success:true,message:"",regionId:this.regionId})
        return;
      }
      
      callback({},null);
      
    }
  }
  
  
}