
import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import utils from "./utils.js";
import path from "path";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on(message('text'), async (ctx) => {
    // get message from user
    const message = ctx.message.text;

    // get answer from Google Bard
    const resAnswerText = await utils.getAnswer(message);
    if (!resAnswerText || !resAnswerText.success) {
        await ctx.reply(resAnswerText.message || "Can't get answer from Google Bard!");
        return;
    }

    // send text to user
    await ctx.reply(resAnswerText.message.content);
});

bot.on(message('voice'), async (ctx) => {
    try {
        const voiceFile = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = ctx.message.from.id;
        const fileName = ctx.message.voice.file_unique_id;

        // get absolute path to user folder
        const folderPath = path.resolve(`./voices/${userId}`);

        // check if user folder exists named userId, if not create it
        utils.folderStructureSync(folderPath);

        // download .oga file
        await utils.download(voiceFile, `${folderPath}/${fileName}.oga`);

        // convert .oga to .wav
        const resConvert = await utils.convert(`${folderPath}/${fileName}.oga`, `${folderPath}/${fileName}.wav`);
        if (!resConvert) {
            await ctx.reply("Can't convert voice message!");
            return;
        }

        setTimeout(async () => {
            // extract text from .wav
            const resSpeechToText = await utils.speechToText(`./../voices/${userId}/${fileName}.wav`);
            if (!resSpeechToText || !resSpeechToText.success) {
                await ctx.reply(resSpeechToText.message || "Can't extract text from voice message!");
                return;
            }

            // get answer from Google Bard
            const resAnswerText = await utils.getAnswer(resSpeechToText.message);
            if (!resAnswerText || !resAnswerText.success) {
                await ctx.reply(resAnswerText.message || "Can't get answer from Google Bard!");
                return;
            }

            // send text to user
            await ctx.reply(resAnswerText.message.content);

            // empty folder
            await utils.emptyFolder(folderPath);
        }, 3000);
    } catch (err) {
        console.log(err.message || "Something went wrong!");
    }
});

bot.command('start', async (ctx) => {
    await ctx.reply(ctx.message);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
