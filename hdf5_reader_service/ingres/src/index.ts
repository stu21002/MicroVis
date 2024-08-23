import { RegionInfo, RegionType } from "./proto/defs";
import { SetRegion } from "./proto/Region";
import { SpectralProfileRequest, SpectralServiceRequest } from "./proto/SpectralProfile";
import { Ingres } from "./ingres";
import { bytesToFloat32 } from "./utils/arrays";
import { ImageDataRequest } from "./proto/ImageData";
import { count } from "console";


let SessionUUID = ""; 

async function spectral(file:string, start:number,count:number) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");
    console.log("Ingres Connected");

    console.log(await ingres.checkStatus({}));
    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"0", uuid:""});

    const region_info = RegionInfo.create();
    region_info.regionType = RegionType.RECTANGLE;
    region_info.controlPoints.push({x: start, y: start});
    region_info.controlPoints.push({x: count, y: count});

    const set_region = SetRegion.create();
    set_region.fileId = open_file_res.uuid;
    set_region.regionId = 0;
    set_region.regionInfo = region_info;

    console.time("Region");
    const region_res = await ingres.regionCreate(set_region);
    console.log(region_res);
    console.timeEnd("Region");

    const spectral_request = SpectralProfileRequest.create();
    spectral_request.uuid = open_file_res.uuid;
    spectral_request.regionId = region_res.regionId;

    console.time("Spectral Profile");
    const spec_res = await ingres.getSpectralProfile(spectral_request);
    console.timeEnd("Spectral Profile");

    console.log("Ingres First five values : " + bytesToFloat32(spec_res.rawValuesFp32).subarray(0, 5));

    ingres.closeFile({uuid: open_file_res.uuid});
}

async function spectralCirlce(file:string, start:number,count:number) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});

    const region_info = RegionInfo.create();
    region_info.regionType = RegionType.CIRCLE;
    region_info.controlPoints.push({x: start, y: start});
    region_info.controlPoints.push({x: count, y: count});

    const set_region = SetRegion.create();
    set_region.fileId = open_file_res.uuid;
    set_region.regionId = 0;
    set_region.regionInfo = region_info;

    console.time("Region");
    const region_res = await ingres.regionCreate(set_region);
    console.log(region_res);
    console.timeEnd("Region");

    const spectral_request = SpectralProfileRequest.create();
    spectral_request.uuid = open_file_res.uuid;
    spectral_request.regionId = region_res.regionId;

    console.time("Spectral Profile");
    const spec_res = await ingres.getSpectralProfile(spectral_request);
    console.log("Ingres First five values : " + bytesToFloat32(spec_res.rawValuesFp32).subarray(0, 5));
    console.timeEnd("Spectral Profile");

    ingres.closeFile({uuid: open_file_res.uuid});
}

async function ImageData(file:string,start:number,count:number,permData:boolean) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});

 

        const image_request = ImageDataRequest.create();
        image_request.uuid = open_file_res.uuid;
    
        image_request.start = [start,start,start];
        image_request.count = [count,count,count];
        image_request.permData = permData;
        image_request.regionType = RegionType.RECTANGLE;

        const startTime = Date.now();
        const image_res = await ingres.getImageDataStream(image_request);
        const endTime = Date.now();

        let num_bytes = 0;
        for (let index = 0; index < image_res.length; index++) {
            num_bytes += image_res[index].rawValuesFp32.length;
        }
        console.log("Total Milliseconds ",(endTime - startTime));
        console.log("Total Bytes Read ",num_bytes);
        console.log("Rate ",num_bytes/(endTime - startTime));


    ingres.closeFile({uuid: open_file_res.uuid});
}

async function openFile(file:string) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});
    SessionUUID = open_file_res.uuid;
    console.log(open_file_res.uuid);
}

async function spectralService(file:string,start:number,count:number,perm:boolean) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});
    // SessionUUID = open_file_res.uuid;
    console.log(open_file_res.uuid);


    const region_info = RegionInfo.create();
    region_info.regionType = RegionType.RECTANGLE;
    region_info.controlPoints.push({x: start, y: start});
    region_info.controlPoints.push({x: count, y: count});

    const spectral_service_request = SpectralServiceRequest.create();
    spectral_service_request.hasPermData = perm
    if (!open_file_res.fileInfoExtended?.depth){
        throw ("Error with opening file")
    }
    spectral_service_request.depth = open_file_res.fileInfoExtended.depth
    spectral_service_request.uuid = open_file_res.uuid;
    spectral_service_request.regionInfo = region_info;

    const service_response = await ingres.spectralService(spectral_service_request);
    console.log(bytesToFloat32(service_response.rawValuesFp32).slice(0,5));
    ingres.closeFile({uuid: open_file_res.uuid});
}

const operations: { [key: string]: (...args: any[]) => Promise<void> } = {
    spectral: (file, start,count) => spectral(file, start, count),
    spectralCirlce: (file, start,radius) => spectralCirlce(file, start, radius),
    imageData: (file, start, count,permData) => ImageData(file, start, count,permData),
    openFile: (file) => openFile(file),
    spectralService: (file,start,count,perm)=> spectralService(file,start,count,perm)
};

async function executeOperation(operation: string, ...args: any[]) {
    const func = operations[operation];

    if (!func) {
        console.error(`Operation "${operation}" not supported.`);
        return;
    }

    try {
        await func(...args);
    } catch (error) {
        console.error(`Error executing "${operation}":`, error);
    }
}


// Example usage:
// executeOperation("openFile","Small.fits");
// executeOperation("spectralService","Small.fits",400,40,false);

// executeOperation("spectralService","Small.hdf5",200,200,false);

// executeOperation("spectralService","Small.hdf5",200,200,true);

// executeOperation("spectral","Small.hdf5",200,200,false);

// Image Exepriment 
// executeOperation("imageData","Small.hdf5",0,800,true);
// executeOperation("imageData","Small.hdf5",0,800,false);

// executeOperation("imageData","Small.fits",0,800,false);

async function groupTesting(){
     
    // await executeOperation("spectralService","Small.hdf5",400,40,false);

    // await executeOperation("spectralService","Small.hdf5",400,40,true);
    // console.log("FITS")
    // await executeOperation("imageData","Small.hdf5",0,800,false);
    console.log("HDF5")
    await executeOperation("imageData","Small.hdf5",0,800,true);

}
groupTesting();
