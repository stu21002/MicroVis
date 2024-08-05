import { OpenFileRequest } from "../../bin/proto/OpenFile";
import { Ingres } from "../ingres";


// import config from "./config.json";

// let testServerUrl: string = config.serverURL0;
// let testSubdirectory: string = config.path.performance;
// let connectTimeout: number = config.timeout.connection;
// let openFileTimeout: number = config.timeout.openFile;
// let readFileTimeout: number = config.timeout.readFile;
// let readRegionTimeout: number = config.timeout.region;
let spectralProfileTimeout: number = 120000;

// interface AssertItem {
//     fileOpen: OpenFileRequest;
//     initTilesReq: CARTA.IAddRequiredTiles;
//     initSetCursor: CARTA.ISetCursor;
//     initSpatialRequirements: CARTA.ISetSpatialRequirements;
//     setRegion: CARTA.ISetRegion[];
//     setSpectralRequirements: CARTA.ISetSpectralRequirements[];
// };

let assertItem = {
    fileOpen: 
        {
            directory: "/home/stuart/",
            file: "Small.hdf5",
            hdu: "0",
            uuid: "",
        },
    
    cursor:{
        x: 200,
        y: 300,
    },
    initSpatialRequirements:
    {
        fileId: 0,
        regionId: 0,
        spatialProfiles: [{coordinate:"x", mip: 1}, {coordinate:"y", mip: 1}],
    },
    setRegion:
        {
            fileId: 0,
            regionId: 0,
            regionInfo: {
                controlPoints: [{ x: 400, y: 400 }, { x: 400, y: 400 }],
                rotation: 0,
                regionType: 2,

            },
        },
    
    setSpectralRequirements: 
        {
            spectralProfiles: [{ coordinate: "z", statsTypes: [4] },],
            regionId: 1,
            fileId: 0,
        },
    
}
const openFileTimeout = 4000;
const readFileTimeout = 4000;
const readRegionTimeout = 4000;

let basepath: string;
describe("PERF_LOAD_IMAGE",()=>{
    const ingres = new Ingres("0.0.0.0",8079);
    describe(`Register a session`, () => {
        beforeAll(async ()=> {
            await ingres.checkStatus({});
        }, 4000);

        // test(`Get basepath and modify the directory path`, async () => {
        //     let fileListResponse = await msgController.getFileList("$BASE",0);
        //     basepath = fileListResponse.directory;
        //     assertItem.fileOpen[0].directory = basepath + "/" + assertItem.fileOpen[0].directory;
        // });
        let file_uuid = "";
        describe(`Initialization: open the image`, () => {
            test(`(Step 1)"${assertItem.fileOpen.file}" OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within ${openFileTimeout} ms`, async() => {
                // msgController.closeFile(-1);
                let OpenFileResponse = await ingres.openFile(assertItem.fileOpen);
                file_uuid = OpenFileResponse.uuid;
                expect(OpenFileResponse.success).toEqual(true);
                // let RegionHistrogramDataResponse = await Stream(CARTA.RegionHistogramData,1);
            }, openFileTimeout);

            // test(`(Step 1)"${assertItem.fileOpen.file}" SetImageChannels & SetCursor responses should arrive within ${readFileTimeout} ms`, async () => {
            //     // msgController.addRequiredTiles(assertItem.initTilesReq);
            //     // let RasterTileDataResponse = await Stream(CARTA.RasterTileData,assertItem.initTilesReq.tiles.length + 2);

            //     let SpatialProfileDataResponse1 = await ingres.getSpatialProfile({uuid:file_uuid,x:assertItem.cursor.x,y:assertItem.cursor.y});

            //     // let SpatialProfileDataResponse2 = await ingres.g(CARTA.SpatialProfileData,1);

            //     // expect(RasterTileDataResponse.length).toEqual(assertItem.initTilesReq.tiles.length + 2);
            // }, openFileTimeout);

            test(`(Step 2)"${assertItem.fileOpen.file}" SET_REGION_ACK should arrive within ${readRegionTimeout} ms`, async () => {
                let setRegionAckResponse = await ingres.CreateRegion({fileId:file_uuid,regionId:assertItem.setRegion.regionId,regionInfo:assertItem.setRegion.regionInfo});
                console.log(setRegionAckResponse.regionId);
                expect(setRegionAckResponse.regionId).toEqual(1);
                expect(setRegionAckResponse.success).toEqual(true);
            }, readRegionTimeout);

            test(`(Step 3)"${assertItem.fileOpen.file}" SPECTRAL_PROFILE_DATA stream should arrive within ${spectralProfileTimeout} ms`, async () => {
  
                let SpectralProfileDataResponse = await ingres.getSpectralProfile({uuid:file_uuid,regionId:1});
                expect(SpectralProfileDataResponse.rawValuesFp32.length).toBeGreaterThan(1);
            }, spectralProfileTimeout);

        });
        afterAll(() =>  ingres.closeFile({uuid:file_uuid}));
      
    });
});