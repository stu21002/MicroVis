// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.1
//   protoc               v5.26.1
// source: contouring.proto

/* eslint-disable */
import {
  type CallOptions,
  ChannelCredentials,
  Client,
  type ClientOptions,
  type ClientUnaryCall,
  type handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  type ServiceError,
  type UntypedServiceImplementation,
} from "@grpc/grpc-js";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface ContouringOutput {
  value: string;
}

export interface ContouringEmpty {
  data: Uint8Array;
  width: number;
  height: number;
  offset: number;
  scale: number;
  index: number;
}

function createBaseContouringOutput(): ContouringOutput {
  return { value: "" };
}

export const ContouringOutput = {
  encode(message: ContouringOutput, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== "") {
      writer.uint32(10).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContouringOutput {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContouringOutput();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContouringOutput {
    return { value: isSet(object.value) ? globalThis.String(object.value) : "" };
  },

  toJSON(message: ContouringOutput): unknown {
    const obj: any = {};
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ContouringOutput>, I>>(base?: I): ContouringOutput {
    return ContouringOutput.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ContouringOutput>, I>>(object: I): ContouringOutput {
    const message = createBaseContouringOutput();
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseContouringEmpty(): ContouringEmpty {
  return { data: new Uint8Array(0), width: 0, height: 0, offset: 0, scale: 0, index: 0 };
}

export const ContouringEmpty = {
  encode(message: ContouringEmpty, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    if (message.width !== 0) {
      writer.uint32(21).float(message.width);
    }
    if (message.height !== 0) {
      writer.uint32(29).float(message.height);
    }
    if (message.offset !== 0) {
      writer.uint32(37).float(message.offset);
    }
    if (message.scale !== 0) {
      writer.uint32(45).float(message.scale);
    }
    if (message.index !== 0) {
      writer.uint32(53).float(message.index);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContouringEmpty {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContouringEmpty();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.data = reader.bytes();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.width = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.height = reader.float();
          continue;
        case 4:
          if (tag !== 37) {
            break;
          }

          message.offset = reader.float();
          continue;
        case 5:
          if (tag !== 45) {
            break;
          }

          message.scale = reader.float();
          continue;
        case 6:
          if (tag !== 53) {
            break;
          }

          message.index = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContouringEmpty {
    return {
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(0),
      width: isSet(object.width) ? globalThis.Number(object.width) : 0,
      height: isSet(object.height) ? globalThis.Number(object.height) : 0,
      offset: isSet(object.offset) ? globalThis.Number(object.offset) : 0,
      scale: isSet(object.scale) ? globalThis.Number(object.scale) : 0,
      index: isSet(object.index) ? globalThis.Number(object.index) : 0,
    };
  },

  toJSON(message: ContouringEmpty): unknown {
    const obj: any = {};
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    if (message.width !== 0) {
      obj.width = message.width;
    }
    if (message.height !== 0) {
      obj.height = message.height;
    }
    if (message.offset !== 0) {
      obj.offset = message.offset;
    }
    if (message.scale !== 0) {
      obj.scale = message.scale;
    }
    if (message.index !== 0) {
      obj.index = message.index;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ContouringEmpty>, I>>(base?: I): ContouringEmpty {
    return ContouringEmpty.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ContouringEmpty>, I>>(object: I): ContouringEmpty {
    const message = createBaseContouringEmpty();
    message.data = object.data ?? new Uint8Array(0);
    message.width = object.width ?? 0;
    message.height = object.height ?? 0;
    message.offset = object.offset ?? 0;
    message.scale = object.scale ?? 0;
    message.index = object.index ?? 0;
    return message;
  },
};

export type ContourServicesService = typeof ContourServicesService;
export const ContourServicesService = {
  computeContour: {
    path: "/ContourServices/computeContour",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ContouringEmpty) => Buffer.from(ContouringEmpty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ContouringEmpty.decode(value),
    responseSerialize: (value: ContouringOutput) => Buffer.from(ContouringOutput.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ContouringOutput.decode(value),
  },
} as const;

export interface ContourServicesServer extends UntypedServiceImplementation {
  computeContour: handleUnaryCall<ContouringEmpty, ContouringOutput>;
}

export interface ContourServicesClient extends Client {
  computeContour(
    request: ContouringEmpty,
    callback: (error: ServiceError | null, response: ContouringOutput) => void,
  ): ClientUnaryCall;
  computeContour(
    request: ContouringEmpty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ContouringOutput) => void,
  ): ClientUnaryCall;
  computeContour(
    request: ContouringEmpty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ContouringOutput) => void,
  ): ClientUnaryCall;
}

export const ContourServicesClient = makeGenericClientConstructor(
  ContourServicesService,
  "ContourServices",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): ContourServicesClient;
  service: typeof ContourServicesService;
  serviceName: string;
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

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
