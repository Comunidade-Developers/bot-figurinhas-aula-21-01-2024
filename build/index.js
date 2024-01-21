"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const utils_1 = require("./utils");
const logger = (0, pino_1.default)({ level: "debug" });
function connectOnWhatsApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(path_1.default.resolve(__dirname, "..", "auth"));
        const socket = (0, baileys_1.default)({
            auth: state,
            logger,
            printQRInTerminal: true,
        });
        socket.ev.on("connection.update", (update) => {
            var _a, _b;
            const { connection, lastDisconnect } = update;
            if (connection === "close") {
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !==
                    baileys_1.DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    connectOnWhatsApp();
                }
            }
        });
        socket.ev.on("creds.update", saveCreds);
        socket.ev.on("messages.upsert", (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const [webMessage] = data.messages;
            if (!webMessage) {
                return;
            }
            const { key: { remoteJid }, message, } = webMessage;
            if (!message) {
                return;
            }
            const isImageMessage = (0, utils_1.baileysIs)(webMessage, "image");
            const isVideoMessage = (0, utils_1.baileysIs)(webMessage, "video");
            const body = (message === null || message === void 0 ? void 0 : message.conversation) ||
                ((_a = message === null || message === void 0 ? void 0 : message.extendedTextMessage) === null || _a === void 0 ? void 0 : _a.text) ||
                ((_b = (0, utils_1.getContent)(webMessage, "image")) === null || _b === void 0 ? void 0 : _b.caption) ||
                ((_c = (0, utils_1.getContent)(webMessage, "video")) === null || _c === void 0 ? void 0 : _c.caption);
            if (!body || !remoteJid) {
                return;
            }
            if (body.toLocaleUpperCase() === "/FIG") {
                if (!isImageMessage && !isVideoMessage) {
                    yield socket.sendMessage(remoteJid, {
                        react: { key: webMessage.key, text: "❌" },
                    });
                    yield socket.sendMessage(remoteJid, {
                        text: `Erro! ❌ Envie uma imagem ou vídeo!`,
                    });
                    return;
                }
                yield socket.sendMessage(remoteJid, {
                    react: { key: webMessage.key, text: "⌛" },
                });
                const type = isImageMessage ? "image" : "video";
                const inputFile = yield (0, utils_1.downloadContent)({ webMessage, type });
                const outputFile = path_1.default.join((0, utils_1.tempPath)(), `${(0, utils_1.generateRandomFileName)()}.webp`);
                (0, child_process_1.exec)(`ffmpeg -i ${inputFile} -vf scale=512:512 ${outputFile}`, (error) => __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        yield socket.sendMessage(remoteJid, {
                            react: { key: webMessage.key, text: "❌" },
                        });
                        yield socket.sendMessage(remoteJid, {
                            text: `Erro! ❌ Não foi possível converter a imagem!`,
                        });
                        console.log(error);
                        return;
                    }
                    yield socket.sendMessage(remoteJid, {
                        react: { key: webMessage.key, text: "✅" },
                    });
                    yield socket.sendMessage(remoteJid, {
                        sticker: fs_1.default.readFileSync(outputFile),
                    });
                    fs_1.default.unlinkSync(inputFile);
                    fs_1.default.unlinkSync(outputFile);
                }));
            }
        }));
    });
}
connectOnWhatsApp();
