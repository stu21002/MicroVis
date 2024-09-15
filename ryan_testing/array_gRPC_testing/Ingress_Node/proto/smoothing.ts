// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.1
//   protoc               v5.26.1
// source: smoothing.proto

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

export interface SmoothingOutput {
  data: number[];
  smoothingFactor: number;
  destWidth: number;
  destHeight: number;
}

export interface SmoothingEmpty {
  data: number[];
  width: number;
  height: number;
  index: number;
}

function createBaseSmoothingOutput(): SmoothingOutput {
  return { data: [], smoothingFactor: 0, destWidth: 0, destHeight: 0 };
}

export const SmoothingOutput = {
  encode(message: SmoothingOutput, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.data) {
      writer.float(v);
    }
    writer.ldelim();
    if (message.smoothingFactor !== 0) {
      writer.uint32(21).float(message.smoothingFactor);
    }
    if (message.destWidth !== 0) {
      writer.uint32(29).float(message.destWidth);
    }
    if (message.destHeight !== 0) {
      writer.uint32(37).float(message.destHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SmoothingOutput {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSmoothingOutput();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag === 13) {
            message.data.push(reader.float());

            continue;
          }

          if (tag === 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.data.push(reader.float());
            }

            continue;
          }

          break;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.smoothingFactor = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.destWidth = reader.float();
          continue;
        case 4:
          if (tag !== 37) {
            break;
          }

          message.destHeight = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SmoothingOutput {
    return {
      data: globalThis.Array.isArray(object?.data) ? object.data.map((e: any) => globalThis.Number(e)) : [],
      smoothingFactor: isSet(object.smoothingFactor) ? globalThis.Number(object.smoothingFactor) : 0,
      destWidth: isSet(object.destWidth) ? globalThis.Number(object.destWidth) : 0,
      destHeight: isSet(object.destHeight) ? globalThis.Number(object.destHeight) : 0,
    };
  },

  toJSON(message: SmoothingOutput): unknown {
    const obj: any = {};
    if (message.data?.length) {
      obj.data = message.data;
    }
    if (message.smoothingFactor !== 0) {
      obj.smoothingFactor = message.smoothingFactor;
    }
    if (message.destWidth !== 0) {
      obj.destWidth = message.destWidth;
    }
    if (message.destHeight !== 0) {
      obj.destHeight = message.destHeight;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SmoothingOutput>, I>>(base?: I): SmoothingOutput {
    return SmoothingOutput.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SmoothingOutput>, I>>(object: I): SmoothingOutput {
    const message = createBaseSmoothingOutput();
    message.data = object.data?.map((e) => e) || [];
    message.smoothingFactor = object.smoothingFactor ?? 0;
    message.destWidth = object.destWidth ?? 0;
    message.destHeight = object.destHeight ?? 0;
    return message;
  },
};

function createBaseSmoothingEmpty(): SmoothingEmpty {
  return { data: [], width: 0, height: 0, index: 0 };
}

export const SmoothingEmpty = {
  encode(message: SmoothingEmpty, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.data) {
      writer.float(v);
    }
    writer.ldelim();
    if (message.width !== 0) {
      writer.uint32(21).float(message.width);
    }
    if (message.height !== 0) {
      writer.uint32(29).float(message.height);
    }
    if (message.index !== 0) {
      writer.uint32(37).float(message.index);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SmoothingEmpty {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSmoothingEmpty();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag === 13) {
            message.data.push(reader.float());

            continue;
          }

          if (tag === 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.data.push(reader.float());
            }

            continue;
          }

          break;
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

  fromJSON(object: any): SmoothingEmpty {
    return {
      data: globalThis.Array.isArray(object?.data) ? object.data.map((e: any) => globalThis.Number(e)) : [],
      width: isSet(object.width) ? globalThis.Number(object.width) : 0,
      height: isSet(object.height) ? globalThis.Number(object.height) : 0,
      index: isSet(object.index) ? globalThis.Number(object.index) : 0,
    };
  },

  toJSON(message: SmoothingEmpty): unknown {
    const obj: any = {};
    if (message.data?.length) {
      obj.data = message.data;
    }
    if (message.width !== 0) {
      obj.width = message.width;
    }
    if (message.height !== 0) {
      obj.height = message.height;
    }
    if (message.index !== 0) {
      obj.index = message.index;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SmoothingEmpty>, I>>(base?: I): SmoothingEmpty {
    return SmoothingEmpty.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SmoothingEmpty>, I>>(object: I): SmoothingEmpty {
    const message = createBaseSmoothingEmpty();
    message.data = object.data?.map((e) => e) || [];
    message.width = object.width ?? 0;
    message.height = object.height ?? 0;
    message.index = object.index ?? 0;
    return message;
  },
};

export type SmoothingServicesService = typeof SmoothingServicesService;
export const SmoothingServicesService = {
  computeGuassianBlur: {
    path: "/SmoothingServices/computeGuassianBlur",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SmoothingEmpty) => Buffer.from(SmoothingEmpty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SmoothingEmpty.decode(value),
    responseSerialize: (value: SmoothingOutput) => Buffer.from(SmoothingOutput.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SmoothingOutput.decode(value),
  },
  computeBlockSmoothing: {
    path: "/SmoothingServices/computeBlockSmoothing",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SmoothingEmpty) => Buffer.from(SmoothingEmpty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SmoothingEmpty.decode(value),
    responseSerialize: (value: SmoothingOutput) => Buffer.from(SmoothingOutput.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SmoothingOutput.decode(value),
  },
} as const;

export interface SmoothingServicesServer extends UntypedServiceImplementation {
  computeGuassianBlur: handleUnaryCall<SmoothingEmpty, SmoothingOutput>;
  computeBlockSmoothing: handleUnaryCall<SmoothingEmpty, SmoothingOutput>;
}

export interface SmoothingServicesClient extends Client {
  computeGuassianBlur(
    request: SmoothingEmpty,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
  computeGuassianBlur(
    request: SmoothingEmpty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
  computeGuassianBlur(
    request: SmoothingEmpty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
  computeBlockSmoothing(
    request: SmoothingEmpty,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
  computeBlockSmoothing(
    request: SmoothingEmpty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
  computeBlockSmoothing(
    request: SmoothingEmpty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SmoothingOutput) => void,
  ): ClientUnaryCall;
}

export const SmoothingServicesClient = makeGenericClientConstructor(
  SmoothingServicesService,
  "SmoothingServices",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): SmoothingServicesClient;
  service: typeof SmoothingServicesService;
  serviceName: string;
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