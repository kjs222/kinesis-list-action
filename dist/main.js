"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = void 0;
const core = __importStar(require("@actions/core"));
const aws_sdk_1 = require("aws-sdk");
const kinesis = new aws_sdk_1.Kinesis({
    apiVersion: '2013-12-02'
});
function listStreams(exclusiveStartStreamName) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {};
        if (exclusiveStartStreamName) {
            params.ExclusiveStartStreamName = exclusiveStartStreamName;
        }
        return kinesis.listStreams(params).promise();
    });
}
function wait(milliseconds) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            setTimeout(() => resolve('done'), milliseconds);
        });
    });
}
exports.wait = wait;
function listAllStreams() {
    return __awaiter(this, void 0, void 0, function* () {
        let requestCount = 0;
        let hasMoreStreams = true;
        let streamNames = [];
        let exclusiveStartStreamName;
        while (hasMoreStreams) {
            if (requestCount && requestCount % 5 === 0) {
                yield wait(1000);
            }
            let result = yield listStreams(exclusiveStartStreamName);
            streamNames = [...streamNames, ...result.StreamNames];
            if (!result.HasMoreStreams) {
                hasMoreStreams = false;
            }
            else {
                exclusiveStartStreamName =
                    result.StreamNames[result.StreamNames.length - 1];
            }
            requestCount += 1;
        }
        return streamNames;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let streamNames = yield listAllStreams();
            if (core.getInput('match')) {
                streamNames = streamNames.filter(sName => sName.includes(core.getInput('match')));
            }
            if (core.getInput('exlude')) {
                streamNames = streamNames.filter(sName => !sName.includes(core.getInput('exclude')));
            }
            core.setOutput('streamNames', streamNames.join(','));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
