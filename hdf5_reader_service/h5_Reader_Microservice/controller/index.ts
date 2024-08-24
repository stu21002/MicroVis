import { FileInfoRequest, FileInfoResponse } from "./src/proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./src/proto/OpenFile";
import { Empty, RegionInfo, RegionType, StatusResponse } from "./src/proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./src/proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse } from "./src/proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./src/proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./src/proto/Histogram";
import {Hdf5WorkerPool} from './src/H5Service/H5WorkerPool'
import { bytesToFloat32 } from './src/utils/arrays';
import { SetRegion } from "./src/proto/Region";

import { H5Services } from './src/H5Service/H5Services';
import { getCoords } from './src/utils/coord';

const args = process.argv.slice(2); // slice(2) removes the first two elements which are 'node' and the script name
let numWorkers = 1;
if (args.length > 0) {
  numWorkers = Number(args[0]);
} 

const h5Services = new H5Services("0.0.0.0",8079,numWorkers);

