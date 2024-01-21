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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomFileName = exports.tempPath = exports.downloadContent = exports.getContent = exports.baileysIs = void 0;
const baileys_1 = require("@whiskeysockets/baileys");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
function baileysIs(webMessage, type) {
    return !!getContent(webMessage, type);
}
exports.baileysIs = baileysIs;
function getContent(webMessage, type) {
    var _a, _b, _c, _d, _e;
    return (((_a = webMessage === null || webMessage === void 0 ? void 0 : webMessage.message) === null || _a === void 0 ? void 0 : _a[`${type}Message`]) ||
        ((_e = (_d = (_c = (_b = webMessage === null || webMessage === void 0 ? void 0 : webMessage.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.contextInfo) === null || _d === void 0 ? void 0 : _d.quotedMessage) === null || _e === void 0 ? void 0 : _e[`${type}Message`]));
}
exports.getContent = getContent;
function downloadContent({ webMessage, type, }) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const content = getContent(webMessage, type);
        const extension = type === "image" ? "png" : "mp4";
        const stream = yield (0, baileys_1.downloadContentFromMessage)(content, type);
        let buffer = Buffer.from([]);
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const chunk = _c;
                buffer = Buffer.concat([buffer, chunk]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const filePath = path_1.default.resolve(tempPath(), `${generateRandomFileName()}.${extension}`);
        yield (0, promises_1.writeFile)(filePath, buffer);
        return filePath;
    });
}
exports.downloadContent = downloadContent;
function tempPath() {
    return path_1.default.resolve(__dirname, "..", "temp");
}
exports.tempPath = tempPath;
function generateRandomFileName() {
    return (Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15));
}
exports.generateRandomFileName = generateRandomFileName;
