import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import P from "pino";
import { Boom } from "./../node_modules/@hapi/boom/lib/index.d";
import {
  baileysIs,
  downloadContent,
  generateRandomFileName,
  getContent,
  tempPath,
} from "./utils";

const logger = P({ level: "debug" });

async function connectOnWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "..", "auth")
  );

  const socket = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
  });

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        connectOnWhatsApp();
      }
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async (data) => {
    const [webMessage] = data.messages;

    if (!webMessage) {
      return;
    }

    const {
      key: { remoteJid },
      message,
    } = webMessage;

    if (!message) {
      return;
    }

    const isImageMessage = baileysIs(webMessage, "image");
    const isVideoMessage = baileysIs(webMessage, "video");

    const body =
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      getContent(webMessage, "image")?.caption ||
      getContent(webMessage, "video")?.caption;

    if (!body || !remoteJid) {
      return;
    }

    if (body.toLocaleUpperCase() === "/FIG") {
      if (!isImageMessage && !isVideoMessage) {
        await socket.sendMessage(remoteJid, {
          react: { key: webMessage.key, text: "❌" },
        });

        await socket.sendMessage(remoteJid, {
          text: `Erro! ❌ Envie uma imagem ou vídeo!`,
        });

        return;
      }

      await socket.sendMessage(remoteJid, {
        react: { key: webMessage.key, text: "⌛" },
      });

      const type = isImageMessage ? "image" : "video";

      const inputFile = await downloadContent({ webMessage, type });

      const outputFile = path.join(
        tempPath(),
        `${generateRandomFileName()}.webp`
      );

      exec(
        `ffmpeg -i ${inputFile} -vf scale=512:512 ${outputFile}`,
        async (error) => {
          if (error) {
            await socket.sendMessage(remoteJid, {
              react: { key: webMessage.key, text: "❌" },
            });

            await socket.sendMessage(remoteJid, {
              text: `Erro! ❌ Não foi possível converter a imagem!`,
            });

            console.log(error);

            return;
          }

          await socket.sendMessage(remoteJid, {
            react: { key: webMessage.key, text: "✅" },
          });

          await socket.sendMessage(remoteJid, {
            sticker: fs.readFileSync(outputFile),
          });

          fs.unlinkSync(inputFile);
          fs.unlinkSync(outputFile);
        }
      );
    }
  });
}

connectOnWhatsApp();
