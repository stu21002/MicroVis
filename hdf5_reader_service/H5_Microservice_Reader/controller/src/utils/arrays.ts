// Source : https://github.com/CARTAvis/fits_reader_microservice/blob/main/controller/src/utils/arrays.ts by Angus
export function bytesToFloat32(bytes: Uint8Array) {
    if (bytes.byteOffset % 4 !== 0) {
      const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
      return new Float32Array(copy, 0, bytes.length / 4);
    } else {
      return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
    }
  }