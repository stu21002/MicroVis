import { OpenFileRequest } from "../proto/OpenFile";
import { Ingres } from "../ingres";
import { bytesToFloat32 } from "../utils/arrays";
import { SpatialProfile } from "../proto/SpatialProfile";


// import config from "./config.json";

// let testServerUrl: string = config.serverURL0;
// let testSubdirectory: string = config.path.performance;
// let connectTimeout: number = config.timeout.connection;
// let openFileTimeout: number = config.timeout.openFile;
// let readFileTimeout: number = config.timeout.readFile;
// let readRegionTimeout: number = config.timeout.region;
let spectralProfileTimeout: number = 120000;

let assertItem = {
    fileOpen: 
        {
            directory: "/home/stuart/",
            file: "Small.hdf5",
            hdu: "0",
            uuid: "",
        },
    
    cursor:{
        x: 300,
        y: 300,
    },
    SpatialProfile:{
        x:[3.6951790098e-3,
            7.5462474488e-3,
            1.1742593721e-2,
            1.4961727895e-2,
            1.6073472798e-2
            ],
        y:[2.0487711299e-3,
            8.0259639071e-4,
            -4.2202690383e-4,
            -2.0444348920e-3,
            -4.4272639789e-3
            ]
    },
    setRegion:
        {
            fileId: 0,
            regionId: 0,
            regionInfo: {
                controlPoints: [{ x: 400, y: 400 }, { x: 40, y: 40 }],
                regionType: 2,

            },
        },
    setRegionMask:
    {
        fileId: 0,
        regionId: 0,
        regionInfo: {
            controlPoints: [{ x: 400, y: 400 }, { x: 20, y: 20 }],    
            regionType: 3,
        },
    },
    
    SpectralResult: [2.9182921622e-4,
        6.8948196832e-4,
        3.4715547745e-4,
        -7.8965837209e-5,
        -9.9831280844e-5,
        ],
    SpectralMaskResult: [2.9970481613e-4,
        7.7768965235e-4,
        1.9963201636e-4,
        -4.0735623584e-5,
        1.9349152654e-4],
    
}




const openFileTimeout = 4000;
const readFileTimeout = 4000;
const readRegionTimeout = 4000;

describe("HDF5 Func",()=>{
    const ingres = new Ingres("0.0.0.0",8079);
    describe(`Checking connections`, () => {
        beforeAll(async ()=> {
            await ingres.checkStatus({});
        }, 4000);

        let file_uuid = "";
        describe(`Testing Functions`, () => {
            test(`(Step 1)"${assertItem.fileOpen.file}" Opening File`, async() => {
                // msgController.closeFile(-1);
                let OpenFileResponse = await ingres.openFile(assertItem.fileOpen);
                file_uuid = OpenFileResponse.uuid;
                expect(OpenFileResponse.success).toEqual(true);
            }, openFileTimeout);
            
            test(`(Step 2)"${assertItem.fileOpen.file}" Creating a Region`, async () => {
                let setRegionAckResponse = await ingres.regionCreate({fileId:file_uuid,regionId:assertItem.setRegion.regionId,regionInfo:assertItem.setRegion.regionInfo});
                console.log(setRegionAckResponse.regionId);
                expect(setRegionAckResponse.success).toEqual(true);
            }, readRegionTimeout);


            test(`(Step 3)"${assertItem.fileOpen.file}" SPECTRAL_PROFILE_DATA`, async () => {
                let SpectralProfileDataResponse = await ingres.getSpectralProfile({uuid:file_uuid,regionId:1});
                // expect(SpectralProfileDataResponse.rawValuesFp32.length).toBeGreaterThan(1);
                const firstValue = bytesToFloat32(SpectralProfileDataResponse.rawValuesFp32).slice(0,5);

                for (let index = 0; index < 5; index++) {
                    expect(firstValue[index]).toBeCloseTo(assertItem.SpectralResult[index],5);
                    
                }
            }, spectralProfileTimeout);

            // test(`(Step 4)"${assertItem.fileOpen.file}" Creating a Circle Region`, async () => {
            //     let setRegionAckResponse = await ingres.regionCreate({fileId:file_uuid,regionId:assertItem.setRegionMask.regionId,regionInfo:assertItem.setRegionMask.regionInfo});
            //     console.log(setRegionAckResponse.regionId);
            //     expect(setRegionAckResponse.success).toEqual(true);
            // }, readRegionTimeout);

            // test(`(Step 5)"${assertItem.fileOpen.file}" MASKED SPECTRAL_PROFILE_DATA`, async () => {
            //     let SpectralProfileDataResponse = await ingres.getSpectralProfile({uuid:file_uuid,regionId:2});
            //     const firstValue = bytesToFloat32(SpectralProfileDataResponse.rawValuesFp32).slice(0,5);

            //     for (let index = 0; index < 5; index++) {
            //         expect(firstValue[index]).toBeCloseTo(assertItem.SpectralMaskResult[index],5);
                    
            //     }
            // }, spectralProfileTimeout);
        
            test(`(Step 5)"${assertItem.fileOpen.file}"SPATIAL PROFILE DATA CURSOR`, async () => {
                let SpatialProfileDataResponse = await ingres.getSpatialProfile({uuid:file_uuid,x:assertItem.cursor.x,y:assertItem.cursor.y});
                const xProfile = SpatialProfileDataResponse.profiles[0];
                const yProfile = SpatialProfileDataResponse.profiles[1];

                for (let index = 0; index < 5; index++) {
                    expect(bytesToFloat32(xProfile.rawValuesFp32)[index]).toBeCloseTo(assertItem.SpatialProfile.x[index],5);
                    expect(bytesToFloat32(yProfile.rawValuesFp32)[index]).toBeCloseTo(assertItem.SpatialProfile.y[index],5);
                  
                }
            }, spectralProfileTimeout);
        
        });
        afterAll(() =>  ingres.closeFile({uuid:file_uuid}));
      
    });
});