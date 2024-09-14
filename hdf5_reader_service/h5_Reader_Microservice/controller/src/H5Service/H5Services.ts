import {
  handleUnaryCall,
  handleServerStreamingCall,
  Server, ServerCredentials,
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  status,
} from "@grpc/grpc-js";


import { FileInfoRequest, FileInfoResponse } from "../proto/FileInfo";
import { OpenFileRequest, OpenFileACK, FileCloseRequest } from "../proto/OpenFile";
import { Hdf5WorkerPool } from "./H5WorkerPool";
import { Empty, FileInfoExtended, RegionInfo, RegionType, StatusResponse } from "../proto/defs";
import { bytesToFloat32, float32ToBytes } from "../utils/arrays";
// import { H5ServicesServer, H5ServicesService } from "../proto/H5ReaderService";
import { ImageDataRequest, ImageDataResponse } from "../proto/ImageData";
import { SetSpatialReq, SpatialProfileData } from "../proto/SpatialProfile";
import { SpectralProfileRequest, SpectralProfileResponse } from "../proto/SpectralProfile";
import { HistogramResponse, SetHistogramReq } from "../proto/Histogram";
import { SetRegion, SetRegionAck } from "../proto/Region";
import { getCircleCoords, getCoords } from "../utils/coord";
import { FileServiceServer, FileServiceService } from "../proto/FileService";


interface DimensionValues {
  width: number;
  height: number;
  depth?: number;
  stokes?: number;
  dims:number;
}

//Class for connection to the ingress node and interactions with the workerpool
export class H5Services {
  readonly workerPool:Hdf5WorkerPool;
  readonly fileDims: Map<string,DimensionValues > = new Map();
  readonly regions:Map<number,RegionInfo> = new Map();
  regionId:number;

  //Creating server
  constructor(address:string,port: number = 8080,numWorkers=1) {
    const SERVICE_URL = `${address}:${port}`;
    this.workerPool = new Hdf5WorkerPool(numWorkers,"0.0.0.0" ,8080);
    this.regionId = 0;
    const server = new Server();
    server.addService(FileServiceService,this.serviceImp);
    server.bindAsync(
      SERVICE_URL,
      ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          throw error;
        }
        console.log("Reader Service running on ", SERVICE_URL);
        console.log("Readers Connections : ", numWorkers);

      }
    );
    
  }

  //Server services
  public serviceImp:FileServiceServer={

    //Opening file service
    openFile: async (call:ServerUnaryCall<OpenFileRequest, OpenFileACK>,callback:sendUnaryData<OpenFileACK>):Promise<void> => {
      console.log("Open file called");
      const {directory,file,hdu} = call.request
  
      const openFileAck = OpenFileACK.create();
      //Request for opening files
      const fileOpenResponse = await this.workerPool.openFile(directory,file,hdu)
      if (!fileOpenResponse?.uuid) {
        console.error("no uuid");
        openFileAck.success=false;
        openFileAck.message="Failed to open file";
        callback(null,openFileAck);
      }else{

        //If successful, make file information request
        const fileInfoResponse = await this.workerPool.getFileInfo(fileOpenResponse.uuid,"","",hdu)

        if (!fileInfoResponse.fileInfoExtended) {

          openFileAck.success=false;
          openFileAck.message="No file info";
          callback(null, openFileAck);

        }else{
          //Attached file info to response
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
          //Appended file dimensions to list
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
    //Close file service
    closeFile: async (call:ServerUnaryCall<FileCloseRequest, StatusResponse>,callback:sendUnaryData<StatusResponse>):Promise<void> => {
      console.log("Close file called");
      const response = StatusResponse.create();
      response.status = await this.workerPool.closeFile(call.request.uuid)
      callback(null,response);
    },
    //Get fileinfo service
    getFileInfo: async (call:ServerUnaryCall<FileInfoRequest, FileInfoResponse>,callback:sendUnaryData<FileInfoResponse>):Promise<void> => {
      // Implement your logic here
      console.log("File Info called");
      callback(null,await this.workerPool.getFileInfo(call.request.uuid,call.request.directory,call.request.file,call.request.hdu));
    },

  //Get image data stream service
    getImageDataStream: async (call:ServerWritableStream<ImageDataRequest, ImageDataResponse>):Promise<void> => {
      let {uuid,start,count,regionType,permData} = call.request;
      if (!regionType){
        regionType=RegionType.RECTANGLE;
      }

      const dims = this.fileDims.get(uuid)?.dims;
      if (!dims){
        throw ("File Not Found");
      }
      //Ensure corret number of dimensions
      for (let i = start.length; i < dims; i++) {
        start.push(0);
        count.push(1);
      }

      //Image data request
      const responses =  await this.workerPool.getImageDataStream(uuid,permData,regionType,start,count)
      
      //Forward response to ingress
      for (const response of  responses) {
          for (const chunk of  await response) {
            call.write( chunk)
          }
      }

      call.end();
    },

    //Creates Spatial profile response
    getSpatialProfile: async(call:ServerUnaryCall<SetSpatialReq, SpatialProfileData>,callback:sendUnaryData<SpatialProfileData>):Promise<void> => {

      console.log("Spatial Profile called");
      const {uuid,x,y} = call.request;

      //Gets file dimensions
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

        //Get profiles
        const spatial_profiles = await this.workerPool.getSpatial(uuid,x,y,dimensions?.width,dimensions?.height);
        
        //Create spatial response
        const spatial_profile_data = SpatialProfileData.create();
        spatial_profile_data.uuid = uuid;
        spatial_profiles.profiles.forEach(profile => {
          spatial_profile_data.profiles.push(profile)
        });

        callback(null,spatial_profile_data);
      }
    },

    //Spectral profile service
    getSpectralProfile: async (call:ServerUnaryCall<SpectralProfileRequest, SpectralProfileResponse>,callback:sendUnaryData<SpectralProfileResponse>):Promise<void> => {
      console.log("Spectral Profile called");
      const {uuid,regionId} = call.request;
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
    
      //Gets file depth
      let {depth} = dimension_values;
      if (!depth){
        depth = 1;
      }
      
      const points = region_info.controlPoints;
      //Handling of co-ordinates
      if (region_info.regionType == RegionType.CIRCLE){
        const {startingX,startingY,adjustedHeight,adjustedWidth} = getCircleCoords(points[0].x,points[0].y,points[1].x,points[1].y);       
        //Request
        const spectral_profile = await this.workerPool.getSpectralProfile(uuid,startingX,startingY,0,depth,adjustedWidth,adjustedHeight,region_info);
        const spectral_profile_response = SpectralProfileResponse.create();
        spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
        callback(null, spectral_profile_response);
        return;
      } 
      else if(region_info.regionType == RegionType.RECTANGLE){
        
        const {startingX,startingY,adjustedHeight,adjustedWidth} = getCoords(points[0].x,points[0].y,points[1].x,points[1].y);
        //Request  
        const spectral_profile = await this.workerPool.getSpectralProfile(uuid,startingX,startingY,0,depth,adjustedWidth,adjustedHeight,region_info);
        const spectral_profile_response = SpectralProfileResponse.create();
        spectral_profile_response.rawValuesFp32 = Buffer.from(spectral_profile.spectralData.buffer);
        callback(null, spectral_profile_response);
        return;
      }
        
      const error = {
        code: status.UNIMPLEMENTED,
        message: "Region Type Not Implemented" + region_info.regionType.toString()
      };
      callback({},null);
    },
    //Add region to a list
    createRegion: async(call:ServerUnaryCall<SetRegion,SetRegionAck>,callback:sendUnaryData<SetRegionAck>):Promise<void>=>{

      console.log("Creating Region");
      if (call.request.regionInfo){
        if (call.request.regionId == 0){
          //Creating a new region
          this.regionId++;
          this.regions.set(this.regionId,call.request.regionInfo)
        } 
        else{
          //Updating a region
          this.regions.set(call.request.regionId,call.request.regionInfo)
        }
        callback(null,{success:true,message:"",regionId:this.regionId})
        return;
      }
      
      callback({},null);
      
    }
  }
  
  
}