"use strict";
// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.1
//   protoc               v5.26.1
// source: smoothing.proto
exports.__esModule = true;
exports.SmoothingServicesClient = exports.SmoothingServicesService = exports.SmoothingEmpty = exports.SmoothingOutput = exports.protobufPackage = void 0;
/* eslint-disable */
var grpc_js_1 = require("@grpc/grpc-js");
var _m0 = require("protobufjs/minimal");
exports.protobufPackage = "";
function createBaseSmoothingOutput() {
    return { data: new Uint8Array(0), smoothingFactor: 0, destWidth: 0, destHeight: 0 };
}
exports.SmoothingOutput = {
    encode: function (message, writer) {
        if (writer === void 0) { writer = _m0.Writer.create(); }
        if (message.data.length !== 0) {
            writer.uint32(10).bytes(message.data);
        }
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
    decode: function (input, length) {
        var reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        var end = length === undefined ? reader.len : reader.pos + length;
        var message = createBaseSmoothingOutput();
        while (reader.pos < end) {
            var tag = reader.uint32();
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
    fromJSON: function (object) {
        return {
            data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(0),
            smoothingFactor: isSet(object.smoothingFactor) ? globalThis.Number(object.smoothingFactor) : 0,
            destWidth: isSet(object.destWidth) ? globalThis.Number(object.destWidth) : 0,
            destHeight: isSet(object.destHeight) ? globalThis.Number(object.destHeight) : 0
        };
    },
    toJSON: function (message) {
        var obj = {};
        if (message.data.length !== 0) {
            obj.data = base64FromBytes(message.data);
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
    create: function (base) {
        return exports.SmoothingOutput.fromPartial(base !== null && base !== void 0 ? base : {});
    },
    fromPartial: function (object) {
        var _a, _b, _c, _d;
        var message = createBaseSmoothingOutput();
        message.data = (_a = object.data) !== null && _a !== void 0 ? _a : new Uint8Array(0);
        message.smoothingFactor = (_b = object.smoothingFactor) !== null && _b !== void 0 ? _b : 0;
        message.destWidth = (_c = object.destWidth) !== null && _c !== void 0 ? _c : 0;
        message.destHeight = (_d = object.destHeight) !== null && _d !== void 0 ? _d : 0;
        return message;
    }
};
function createBaseSmoothingEmpty() {
    return { data: new Uint8Array(0), width: 0, height: 0 };
}
exports.SmoothingEmpty = {
    encode: function (message, writer) {
        if (writer === void 0) { writer = _m0.Writer.create(); }
        if (message.data.length !== 0) {
            writer.uint32(10).bytes(message.data);
        }
        if (message.width !== 0) {
            writer.uint32(21).float(message.width);
        }
        if (message.height !== 0) {
            writer.uint32(29).float(message.height);
        }
        return writer;
    },
    decode: function (input, length) {
        var reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
        var end = length === undefined ? reader.len : reader.pos + length;
        var message = createBaseSmoothingEmpty();
        while (reader.pos < end) {
            var tag = reader.uint32();
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
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
        }
        return message;
    },
    fromJSON: function (object) {
        return {
            data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(0),
            width: isSet(object.width) ? globalThis.Number(object.width) : 0,
            height: isSet(object.height) ? globalThis.Number(object.height) : 0
        };
    },
    toJSON: function (message) {
        var obj = {};
        if (message.data.length !== 0) {
            obj.data = base64FromBytes(message.data);
        }
        if (message.width !== 0) {
            obj.width = message.width;
        }
        if (message.height !== 0) {
            obj.height = message.height;
        }
        return obj;
    },
    create: function (base) {
        return exports.SmoothingEmpty.fromPartial(base !== null && base !== void 0 ? base : {});
    },
    fromPartial: function (object) {
        var _a, _b, _c;
        var message = createBaseSmoothingEmpty();
        message.data = (_a = object.data) !== null && _a !== void 0 ? _a : new Uint8Array(0);
        message.width = (_b = object.width) !== null && _b !== void 0 ? _b : 0;
        message.height = (_c = object.height) !== null && _c !== void 0 ? _c : 0;
        return message;
    }
};
exports.SmoothingServicesService = {
    computeGuassianBlur: {
        path: "/SmoothingServices/computeGuassianBlur",
        requestStream: false,
        responseStream: false,
        requestSerialize: function (value) { return Buffer.from(exports.SmoothingEmpty.encode(value).finish()); },
        requestDeserialize: function (value) { return exports.SmoothingEmpty.decode(value); },
        responseSerialize: function (value) { return Buffer.from(exports.SmoothingOutput.encode(value).finish()); },
        responseDeserialize: function (value) { return exports.SmoothingOutput.decode(value); }
    },
    computeBlockSmoothing: {
        path: "/SmoothingServices/computeBlockSmoothing",
        requestStream: false,
        responseStream: false,
        requestSerialize: function (value) { return Buffer.from(exports.SmoothingEmpty.encode(value).finish()); },
        requestDeserialize: function (value) { return exports.SmoothingEmpty.decode(value); },
        responseSerialize: function (value) { return Buffer.from(exports.SmoothingOutput.encode(value).finish()); },
        responseDeserialize: function (value) { return exports.SmoothingOutput.decode(value); }
    }
};
exports.SmoothingServicesClient = (0, grpc_js_1.makeGenericClientConstructor)(exports.SmoothingServicesService, "SmoothingServices");
function bytesFromBase64(b64) {
    if (globalThis.Buffer) {
        return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
    }
    else {
        var bin = globalThis.atob(b64);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; ++i) {
            arr[i] = bin.charCodeAt(i);
        }
        return arr;
    }
}
function base64FromBytes(arr) {
    if (globalThis.Buffer) {
        return globalThis.Buffer.from(arr).toString("base64");
    }
    else {
        var bin_1 = [];
        arr.forEach(function (byte) {
            bin_1.push(globalThis.String.fromCharCode(byte));
        });
        return globalThis.btoa(bin_1.join(""));
    }
}
function isSet(value) {
    return value !== null && value !== undefined;
}
