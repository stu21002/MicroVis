// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.180.0
//   protoc               v3.12.4
// source: OpenFile.proto

/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { FileInfo, FileInfoExtended } from "./defs";

export const protobufPackage = "proto";

export interface OpenFileRequest {
  uuid: string;
  file: string;
  directory: string;
  hdu: string;
}

export interface OpenFileACK {
  success: boolean;
  uuid: string;
  message: string;
  fileInfo: FileInfo | undefined;
  fileInfoExtended: FileInfoExtended | undefined;
}

export interface FileCloseRequest {
  uuid: string;
}

function createBaseOpenFileRequest(): OpenFileRequest {
  return { uuid: "", file: "", directory: "", hdu: "" };
}

export const OpenFileRequest = {
  encode(message: OpenFileRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.uuid !== "") {
      writer.uint32(10).string(message.uuid);
    }
    if (message.file !== "") {
      writer.uint32(18).string(message.file);
    }
    if (message.directory !== "") {
      writer.uint32(26).string(message.directory);
    }
    if (message.hdu !== "") {
      writer.uint32(34).string(message.hdu);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OpenFileRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOpenFileRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.uuid = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.file = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.directory = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.hdu = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OpenFileRequest {
    return {
      uuid: isSet(object.uuid) ? globalThis.String(object.uuid) : "",
      file: isSet(object.file) ? globalThis.String(object.file) : "",
      directory: isSet(object.directory) ? globalThis.String(object.directory) : "",
      hdu: isSet(object.hdu) ? globalThis.String(object.hdu) : "",
    };
  },

  toJSON(message: OpenFileRequest): unknown {
    const obj: any = {};
    if (message.uuid !== "") {
      obj.uuid = message.uuid;
    }
    if (message.file !== "") {
      obj.file = message.file;
    }
    if (message.directory !== "") {
      obj.directory = message.directory;
    }
    if (message.hdu !== "") {
      obj.hdu = message.hdu;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<OpenFileRequest>, I>>(base?: I): OpenFileRequest {
    return OpenFileRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<OpenFileRequest>, I>>(object: I): OpenFileRequest {
    const message = createBaseOpenFileRequest();
    message.uuid = object.uuid ?? "";
    message.file = object.file ?? "";
    message.directory = object.directory ?? "";
    message.hdu = object.hdu ?? "";
    return message;
  },
};

function createBaseOpenFileACK(): OpenFileACK {
  return { success: false, uuid: "", message: "", fileInfo: undefined, fileInfoExtended: undefined };
}

export const OpenFileACK = {
  encode(message: OpenFileACK, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.success !== false) {
      writer.uint32(8).bool(message.success);
    }
    if (message.uuid !== "") {
      writer.uint32(18).string(message.uuid);
    }
    if (message.message !== "") {
      writer.uint32(26).string(message.message);
    }
    if (message.fileInfo !== undefined) {
      FileInfo.encode(message.fileInfo, writer.uint32(34).fork()).ldelim();
    }
    if (message.fileInfoExtended !== undefined) {
      FileInfoExtended.encode(message.fileInfoExtended, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OpenFileACK {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOpenFileACK();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.success = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.uuid = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.message = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.fileInfo = FileInfo.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.fileInfoExtended = FileInfoExtended.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OpenFileACK {
    return {
      success: isSet(object.success) ? globalThis.Boolean(object.success) : false,
      uuid: isSet(object.uuid) ? globalThis.String(object.uuid) : "",
      message: isSet(object.message) ? globalThis.String(object.message) : "",
      fileInfo: isSet(object.fileInfo) ? FileInfo.fromJSON(object.fileInfo) : undefined,
      fileInfoExtended: isSet(object.fileInfoExtended) ? FileInfoExtended.fromJSON(object.fileInfoExtended) : undefined,
    };
  },

  toJSON(message: OpenFileACK): unknown {
    const obj: any = {};
    if (message.success !== false) {
      obj.success = message.success;
    }
    if (message.uuid !== "") {
      obj.uuid = message.uuid;
    }
    if (message.message !== "") {
      obj.message = message.message;
    }
    if (message.fileInfo !== undefined) {
      obj.fileInfo = FileInfo.toJSON(message.fileInfo);
    }
    if (message.fileInfoExtended !== undefined) {
      obj.fileInfoExtended = FileInfoExtended.toJSON(message.fileInfoExtended);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<OpenFileACK>, I>>(base?: I): OpenFileACK {
    return OpenFileACK.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<OpenFileACK>, I>>(object: I): OpenFileACK {
    const message = createBaseOpenFileACK();
    message.success = object.success ?? false;
    message.uuid = object.uuid ?? "";
    message.message = object.message ?? "";
    message.fileInfo = (object.fileInfo !== undefined && object.fileInfo !== null)
      ? FileInfo.fromPartial(object.fileInfo)
      : undefined;
    message.fileInfoExtended = (object.fileInfoExtended !== undefined && object.fileInfoExtended !== null)
      ? FileInfoExtended.fromPartial(object.fileInfoExtended)
      : undefined;
    return message;
  },
};

function createBaseFileCloseRequest(): FileCloseRequest {
  return { uuid: "" };
}

export const FileCloseRequest = {
  encode(message: FileCloseRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.uuid !== "") {
      writer.uint32(10).string(message.uuid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileCloseRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileCloseRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.uuid = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileCloseRequest {
    return { uuid: isSet(object.uuid) ? globalThis.String(object.uuid) : "" };
  },

  toJSON(message: FileCloseRequest): unknown {
    const obj: any = {};
    if (message.uuid !== "") {
      obj.uuid = message.uuid;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileCloseRequest>, I>>(base?: I): FileCloseRequest {
    return FileCloseRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileCloseRequest>, I>>(object: I): FileCloseRequest {
    const message = createBaseFileCloseRequest();
    message.uuid = object.uuid ?? "";
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
