"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILEINFO = void 0;
const Hdf5WorkerPool_1 = require("../Services/Hdf5WorkerPool");
const config_json_1 = __importDefault(require("./config.json"));
let assertItem = {
    fileInfoReq: {
        uuid: "", // uuid for non open files
        directory: "/home/stuart/H5Files/",
        file: "small.hdf5",
        hdu: "0"
    },
    fileInfoRes: {
        fileInfo: {
            name: "",
            size: 0,
            HDUList: [],
            date: 0
        },
        fileInfoExtended: {
            dimensions: 4,
            depth: 5,
            width: 10,
            height: 10,
            stokes: 2
        },
        success: true,
        message: ""
    },
};
// describe(`File Info Test `, ()=> {
//     const readers = new ReaderController(1,config.serverUrl, config.startingPort);
//     test(`Getting info for ${assertItem.fileInfoReq.file}`, async ()=>{
//       const response = await readers.getFileInfo("",assertItem.fileInfoReq.directory,assertItem.fileInfoReq.file,assertItem.fileInfoReq.hdu);
//       console.log(response);
//       expect(response.success).toBe(true);
//     })
//  })
const FILEINFO = () => __awaiter(void 0, void 0, void 0, function* () {
    const readers = new Hdf5WorkerPool_1.Hdf5WorkerPool(1, config_json_1.default.serverUrl, config_json_1.default.startingPort);
    console.time("FILEINFO");
    const response = yield readers.getFileInfo("", assertItem.fileInfoReq.directory, assertItem.fileInfoReq.file, assertItem.fileInfoReq.hdu);
    console.timeEnd("FILEINFO");
    // console.log(response);
});
exports.FILEINFO = FILEINFO;
