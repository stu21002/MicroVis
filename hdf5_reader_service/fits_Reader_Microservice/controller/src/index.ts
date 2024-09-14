import { FileInfoRequest, FileInfoResponse } from "./proto/FileInfo";
import { FileCloseRequest, OpenFileACK, OpenFileRequest } from "./proto/OpenFile";
import { Empty, RegionInfo, RegionType, StatusResponse } from "./proto/defs";
import { ImageDataRequest, ImageDataResponse } from "./proto/ImageData";
import { SpectralProfileRequest, SpectralProfileResponse } from "./proto/SpectralProfile";
import { SetSpatialReq, SpatialProfileData } from "./proto/SpatialProfile";
import { HistogramResponse, SetHistogramReq } from "./proto/Histogram";
import {FitsWorkerPool} from './Service/FitsWorkerPool'
import { bytesToFloat32 } from './utils/arrays';
import { SetRegion } from "./proto/Region";

import { FitsServices } from './Service/FitsServices';
import { getCoords } from './utils/coord';
import { stat } from "fs";

const args = process.argv.slice(2); 
let numWorkers = 1;
if (args.length > 0) {
  numWorkers = Number(args[0]);
} 
const ServicePort = 8079;
const fitsServices = new FitsServices("0.0.0.0",ServicePort,numWorkers);

