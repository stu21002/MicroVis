import { exec } from "child_process";
import { RegionInfo, RegionType } from "../bin/proto/defs";
import { SetRegion } from "../bin/proto/Region";
import { SpectralProfileRequest } from "../bin/proto/SpectralProfile";
import { Ingres } from "./ingres";
import { bytesToFloat32 } from "./utils/arrays";
import { ImageDataRequest } from "../bin/proto/ImageData";


async function spectral(){
    const ingres = new Ingres("0.0.0.0",8079);
    console.log("Ingres Created");
    ingres.checkStatus({});
    const open_file_res =  await ingres.openFile({directory:"/home/stuart/",file:"Small.hdf5",hdu:"",uuid:""});
    const region_info = RegionInfo.create();
    region_info.regionType = RegionType.RECTANGLE;
    region_info.controlPoints.push({x:200,y:200});
    region_info.controlPoints.push({x:1,y:1});

    const set_region = SetRegion.create();
    set_region.fileId=open_file_res.uuid;
    set_region.regionId=0;
    set_region.regionInfo=region_info;
  
    console.time("Region");
    const region_res =  await ingres.CreateRegion(set_region);
    console.log(region_res);
    console.timeEnd("Region");
    console.log();

    const spectral_request = SpectralProfileRequest.create();
    spectral_request.uuid = open_file_res.uuid;
    spectral_request.regionId = region_res.regionId;
    
    console.time("Spectral Profile");
    const spec_res =  await ingres.getSpectralProfile(spectral_request);
    console.timeEnd("Spectral Profile");
    
    console.log("Ingres First five values : " + bytesToFloat32(spec_res.rawValuesFp32).subarray(0,5));
    console.log();

    ingres.closeFile({uuid:open_file_res.uuid});
}


async function spectralMask(){
    const ingres = new Ingres("0.0.0.0",8079);
    console.log("Ingres Created");
    ingres.checkStatus({});
    const open_file_res =  await ingres.openFile({directory:"/home/stuart/",file:"Small.hdf5",hdu:"",uuid:""});

    const region_info = RegionInfo.create();
    region_info.regionType = RegionType.CIRCLE;
    region_info.controlPoints.push({x:200,y:200});
    region_info.controlPoints.push({x:200,y:200});

    const set_region = SetRegion.create();
    set_region.fileId=open_file_res.uuid;
    set_region.regionId=0;
    set_region.regionInfo=region_info;
  
    console.time("Region");
    const region_res =  await ingres.CreateRegion(set_region);
    console.log(region_res);
    console.timeEnd("Region");
    console.log();

    const spectral_request = SpectralProfileRequest.create();
    spectral_request.uuid = open_file_res.uuid;
    spectral_request.regionId = region_res.regionId;
    
    console.time("Spectral Profile");
    const spec_res =  await ingres.getSpectralProfile(spectral_request);
    console.log("Ingres First five values : " + bytesToFloat32(spec_res.rawValuesFp32).subarray(0,5));
    console.timeEnd("Spectral Profile");
    console.log();

    ingres.closeFile({uuid:open_file_res.uuid});
}

async function ImageData() {
    const ingres = new Ingres("0.0.0.0",8079);
    console.log("Ingres Created");
    ingres.checkStatus({});
    const open_file_res =  await ingres.openFile({directory:"/home/stuart/",file:"Small.hdf5",hdu:"",uuid:""});
    // const open_file_res =  await ingres.openFile({directory:"/media/stuart/Elements/",file:"Big.hdf5",hdu:"",uuid:""});

    for (let index = 1; index < 2; index+=20) {
        
        const image_request = ImageDataRequest.create();
        image_request.uuid = open_file_res.uuid;
        image_request.start = [0,0,0];
        image_request.count = [800,800,6];
        image_request.regionType = RegionType.RECTANGLE;
        
        // console.time("ImageData");
        const startTime = Date.now();
        const image_res = await ingres.getImageDataStream(image_request);
        // console.log(image_res)
        // console.log(image_res(respones2[0].rawValuesFp32));
        // console.timeEnd("ImageData");
        let num_bytes = 0;
        for (let index = 0; index < image_res.length; index++) {
           num_bytes += image_res[index].rawValuesFp32.length;
        }
        const endTime = Date.now();
        console.log((endTime-startTime)/1000);
        console.log((num_bytes/(endTime-startTime))*1000);

    }
    ingres.closeFile({uuid:open_file_res.uuid});

}
spectral();
// ImageData();