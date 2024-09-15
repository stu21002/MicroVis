import { RegionInfo, RegionType } from "./proto/defs";
import { SetRegion } from "./proto/Region";
import { SpectralProfileRequest, SpectralServiceRequest } from "./proto/SpectralProfile";
import { Ingres } from "./ingres";
import { bytesToFloat32 } from "./utils/arrays";
import { ImageDataRequest } from "./proto/ImageData";



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

    console.log("Values Received")
    console.log(bytesToFloat32(spec_res.rawValuesFp32).subarray(0, 5));

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
    console.timeEnd("Spectral Profile");
    console.log(bytesToFloat32(spec_res.rawValuesFp32).subarray(0, 5));

    ingres.closeFile({uuid: open_file_res.uuid});
}

async function ImageData(file:string, x:number,y:number,z:number, cX:number,cY:number,cZ:number,permData:boolean) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});

 

        const image_request = ImageDataRequest.create();
        image_request.uuid = open_file_res.uuid;
    
        image_request.start = [x,y,z];
        image_request.count = [cX,cY,cZ];
        image_request.permData = permData;
        image_request.regionType = RegionType.RECTANGLE;

        const startTime = Date.now();
        const image_res = await ingres.getImageDataStream(image_request);
        const endTime = Date.now();

        console.log("Values Received")
        console.log(bytesToFloat32(image_res[0].rawValuesFp32).slice(0,5))

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

async function spectralService(file:string,start:number,count:number,perm:boolean,regionType:RegionType) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});
    // SessionUUID = open_file_res.uuid;
    // console.log(open_file_res.uuid);


    const region_info = RegionInfo.create();
    region_info.regionType = regionType;
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
    
    console.time("SpecServ");
    const service_response = await ingres.spectralService(spectral_service_request);
    console.timeEnd("SpecServ");
    console.log("Values Received")
    console.log(bytesToFloat32(service_response.rawValuesFp32).slice(0,5));
    // console.log(bytesToFloat32(service_response.rawValuesFp32).length)
    ingres.closeFile({uuid: open_file_res.uuid});
}

async function spatial(file:string,x:number,y:number) {
    const ingres = new Ingres("0.0.0.0", 8079);
    console.log("Ingres Created");

    const open_file_res = await ingres.openFile({directory:"/home/stuart/", file, hdu:"", uuid:""});
    SessionUUID = open_file_res.uuid;

    const startTime = Date.now();
    const response = await ingres.getSpatialProfile({uuid:SessionUUID,x,y})
    const endTime = Date.now();

    console.log("Values Received - " + response.profiles[0].coordinate)
    console.log(bytesToFloat32(response.profiles[0].rawValuesFp32).slice(0,5));
    console.log("Values Received - " + response.profiles[1].coordinate)
    console.log(bytesToFloat32(response.profiles[1].rawValuesFp32).slice(0,5));

    console.log("Time :" + (endTime-startTime) + "ms")

    ingres.closeFile({uuid:SessionUUID})
}
const operations: { [key: string]: (...args: any[]) => Promise<void> } = {
    spectral: (file, start,count) => spectral(file, start, count),
    spectralCirlce: (file, start,radius) => spectralCirlce(file, start, radius),
    imageData: (file, x,y,z,cX,cY,cZ,permData) => ImageData(file, x,y,z, cX,cY,cZ,permData),
    openFile: (file) => openFile(file),
    spectralService: (file,start,count,perm,regionType)=> spectralService(file,start,count,perm,regionType),
    spatial: (file,x,y)=>spatial(file,x,y)
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


// Spectral Profile Service Experiments
    // Small
    // executeOperation("spectralService","Small.fits",400,40,false,RegionType.RECTANGLE);
    // executeOperation("spectralService","Small.hdf5",400,40,true,RegionType.RECTANGLE);
    // Large
    // executeOperation("spectralService","Small.fits",400,400,false,RegionType.RECTANGLE);
    // executeOperation("spectralService","Small.hdf5",400,400,true,RegionType.RECTANGLE);

// Spectral Profile Service Mask Experiments
    // Small
    // executeOperation("spectralService","Small.fits",400,20,false,RegionType.CIRCLE);
    // executeOperation("spectralService","Small.hdf5",400,20,true,RegionType.CIRCLE);
    // Large
    // executeOperation("spectralService","Small.fits",400,200,false,RegionType.CIRCLE);
    // executeOperation("spectralService","Small.hdf5",400,200,true,RegionType.CIRCLE);

// Spectral Profile Service Experiments
    // Small
        // executeOperation("spectral","Small.hdf5",400,40);
        // executeOperation("spectral","Small.fits",400,40);

    // Large
        // executeOperation("spectral","Small.hdf5",400,400);
        // executeOperation("spectral","Small.fits",400,400);
    
    //Small Circle

    // executeOperation("spectralCirlce","Small.fits",400,20);
    // executeOperation("spectralCirlce","Small.hdf5",400,20);


        
// executeOperation("spectral","Small.hdf5",200,200,false);

// Image Exepriment 
// executeOperation("imageData","Small.hdf5",0,1920,true);
// executeOperation("imageData","Small.fits",0,800,false);


//Countouring Image Data
// executeOperation("imageData","Contour.hdf5",0,0,0,1920,1920,1,false);
// executeOperation("imageData","Contour.fits",0,0,0,1920,1920,1,false);

//Spectral Image Data
// executeOperation("imageData","Small.hdf5",400,400,0,40,40,1917,true);
// executeOperation("imageData","Small.fits",400,400,0,40,40,1917,false);


// executeOperation("imageData","Small.fits",0,800,false);


const SpecSmallRes = [2.9182921622e-4,6.8948196832e-4,3.4715547745e-4,-7.8965837209e-5, -9.9831280844e-5]
const SpecLargeRes = [3.0165030023e-5,1.0986143935e-5,7.8576179550e-5,7.0550468806e-5,3.6279325390e-5]
const ImageDataRes = [-3.5735946149e-3,-4.2040003464e-3,-4.9576885067e-3,-5.2063320763e-3,-4.5703365467e-3]
const SpatialResX = [-6.3734725118e-3,-6.8757496774e-3,-6.8514756858e-3,-5.9618582018e-3,-3.9855376817e-3]
const SpatialResY = [-3.7708680611e-3,-3.5555218346e-3,-3.9333687164e-3,-4.7843726352e-3,-5.7517704554e-3]


async function DemoHDF5(){
    
    console.log("SPECTRAL PROFILE SMALL HDF5")
    console.log("Expecteed Values:")
    console.log(SpecSmallRes)
    const res_1 = await executeOperation("spectral","Small.hdf5",400,40,true);
    console.log("|||||||||||||||||||")

    console.log("SPECTRAL PROFILE LARGE HDF5")
    console.log("Expecteed Values:")
    console.log(SpecLargeRes)
    const res_2 = await executeOperation("spectral","Small.hdf5",400,400,true);
    console.log("|||||||||||||||||||")

    console.log("IMAGE DATA REQUEST HDF5")
    console.log("Expecteed Values:")
    console.log(ImageDataRes)
    const res_3 = await executeOperation("imageData","Small.hdf5",400,400,0,400,400,400,false);
    console.log("|||||||||||||||||||")

    console.log("SPATIAL DATA REQUEST HDF5")
    console.log("Expecteed X Values:")
    console.log(SpatialResX)
    console.log("Expecteed Y Values:")
    console.log(SpatialResY)
    const res_4 = await executeOperation("spatial","Small.hdf5",400,400);
    console.log("|||||||||||||||||||")



}

async function DemoFITS(){
    
    console.log("SPECTRAL PROFILE SMALL FITS")
    console.log("Expecteed Values:")
    console.log(SpecSmallRes)
    const res_1 = await executeOperation("spectral","Small.fits",400,40,true);
    console.log("|||||||||||||||||||")

    console.log("SPECTRAL PROFILE LARGE FITS")
    console.log("Expecteed Values:")
    console.log(SpecLargeRes)
    const res_2 = await executeOperation("spectral","Small.fits",400,400,true);
    console.log("|||||||||||||||||||")

    console.log("IMAGE DATA REQUEST FITS")
    console.log("Expecteed Values:")
    console.log(ImageDataRes)
    const res_3 = await executeOperation("imageData","Small.fits",400,400,0,400,400,400,false);
    console.log("|||||||||||||||||||")

    console.log("SPATIAL DATA REQUEST FITS")
    console.log("Expecteed X Values:")
    console.log(SpatialResX)
    console.log("Expecteed Y Values:")
    console.log(SpatialResY)
    const res_4 = await executeOperation("spatial","Small.fits",400,400);
    console.log("|||||||||||||||||||")



}
DemoHDF5();
// DemoFITS();
