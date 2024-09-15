import { FileType } from "../proto/defs";

export function getFileType(filename:string){
    
    const extension = filename.split(".")[-1];
    switch (extension) {
        case "hdf5":
            return FileType.HDF5;
    
        case "fits":
            return FileType.FITS;

        default:
            return FileType.NOT_SUPPORTED;
    }

}