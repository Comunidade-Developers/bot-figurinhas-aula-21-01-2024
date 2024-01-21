import {
  MediaType,
  downloadContentFromMessage,
  proto,
} from "@whiskeysockets/baileys";
import { writeFile } from "fs/promises";
import path from "path";

export function baileysIs(webMessage: proto.IWebMessageInfo, type) {
  return !!getContent(webMessage, type);
}

export function getContent(webMessage: proto.IWebMessageInfo, type: string) {
  return (
    webMessage?.message?.[`${type}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${type}Message`
    ]
  );
}

export async function downloadContent({
  webMessage,
  type,
}: {
  webMessage: proto.IWebMessageInfo;
  type: MediaType;
}) {
  const content = getContent(webMessage, type);

  const extension = type === "image" ? "png" : "mp4";

  const stream = await downloadContentFromMessage(content, type);

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  const filePath = path.resolve(
    tempPath(),
    `${generateRandomFileName()}.${extension}`
  );

  await writeFile(filePath, buffer);

  return filePath;
}

export function tempPath() {
  return path.resolve(__dirname, "..", "temp");
}

export function generateRandomFileName() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
