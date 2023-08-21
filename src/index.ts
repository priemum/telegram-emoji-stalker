import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { API_HASH, API_ID, SESSION, USER, CHAT } from "./secrets";
import readline from 'readline';
import { NewMessage } from "telegram/events";

const DEBUG = process.env.DEBUG;

function text(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const main = async () => {
  const client = new TelegramClient(new StringSession(SESSION), API_ID, API_HASH, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await text("Please enter your number: "),
    password: async () => await text("Please enter your password: "),
    phoneCode: async () =>
      await text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });
  console.log("You should now be connected.");
  console.log("SESSION:", client.session.save());
  client.addEventHandler((update) => {
    // console.log(update);
    if (DEBUG && +(update.message?.peerId as any)?.channelId === Math.abs(CHAT)) {
      console.log(update.message);
      
      // console.log('DEBUG', update.message.id, +(update.message.fromId as any)?.userId, +(update.message?.peerId as any)?.chatId, +(update.message?.peerId as any)?.channelId, update.message?.text?.substring(0, 20));
    }
    const channelFit = +(update.message?.peerId as any)?.channelId === Math.abs(CHAT) && update.message?.fromId === null;
    const userFit = +(update.message?.fromId as any)?.userId === USER && (
      +(update.message?.peerId as any)?.chatId === Math.abs(CHAT) ||
      +(update.message?.peerId as any)?.channelId === Math.abs(CHAT)
    );
    if (
      (USER === 0 && channelFit)
      ||
      (USER !== 0 && userFit)
    ) {
      // console.log(update.message.id, update.message.fromId, update.message);
      const emojis = update.message?.message
        ? [5346051681454923901n, 5346287230346338939n, 5348512942528667285n]
        : [5348512942528667285n, 5346287230346338939n, 5346051681454923901n];
      client.invoke(new Api.messages.SendReaction({
        peer: update.message.peerId,
        msgId: update.message.id,
        reaction: emojis.map((r) => new Api.ReactionCustomEmoji({ documentId: r } as any)),
      }));
    }
  }, new NewMessage({}));
};

main();
