"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytesToFloat32 = bytesToFloat32;
exports.float32ToBytes = float32ToBytes;
exports.bytesToInt32 = bytesToInt32;
// Source : https://github.com/CARTAvis/fits_reader_microservice/blob/main/controller/src/utils/arrays.ts by Angus
function bytesToFloat32(bytes) {
    if (bytes.byteOffset % 4 !== 0) {
        const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
        return new Float32Array(copy, 0, bytes.length / 4);
    }
    else {
        return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
    }
}
function float32ToBytes(float32Array) {
    if (float32Array.byteOffset % 4 !== 0) {
        const copy = float32Array.buffer.slice(float32Array.byteOffset, float32Array.byteOffset + float32Array.byteLength);
        return new Uint8Array(copy);
    }
    else {
        return new Uint8Array(float32Array.buffer, float32Array.byteOffset, float32Array.byteLength);
    }
}
function bytesToInt32(bytes) {
    if (bytes.byteOffset % 4 !== 0) {
        const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
        return new Int32Array(copy, 0, bytes.length / 4);
    }
    else {
        return new Int32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
    }
}
