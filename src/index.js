
import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import utils from "./utils.js";
import handlers from "./handlers.js";
import path from "path";
import connectDB from "./../config/db.js";
import commands from "../config/commands.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
    const userTelegramId = ctx.message.from.id;

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (!dbUser) {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
    }

    // build multiline text message
    let startMessage = `\u{1F64B} Hello ${dbUser.name}! \n\n`;
    Object.keys(commands).forEach((command) => {
        startMessage += `/${command} - ${commands[command]}\n`;
    });
    startMessage += '\n\nHappy hacking! \u{1F680}';

    // send text to user
    await ctx.reply(startMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'start',
        answer_text: textMessage,
        answer_status: 1,
    });
});

bot.command('new', async (ctx) => {
    const userTelegramId = ctx.message.from.id;

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (!dbUser) {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
    }

    let newMessage = "Previous conversation ended. You can start a new one \u{1F609}";

    // send text to user
    await ctx.reply(newMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'new',
        answer_text: newMessage,
        answer_status: 1,
    });
});

bot.command('help', async (ctx) => {
    const userTelegramId = ctx.message.from.id;

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (!dbUser) {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
    }

    // build multiline text message
    let helpMessage = `These are bot commands:\n\n`;
    Object.keys(commands).forEach((command) => {
        helpMessage += `/${command} - ${commands[command]}\n`;
    });
    helpMessage += commands.join('\n');
    helpMessage += '\n\nJust use them if need!';

    // send text to user
    await ctx.reply(helpMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'help',
        answer_text: helpMessage,
        answer_status: 1,
    });
});

bot.on(message('text'), async (ctx) => {
    const userTelegramId = ctx.message.from.id;
    const questionMessage = ctx.message.text;

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (!dbUser) {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
    }

    // get answer from Google Bard
    const resAnswerText = await utils.getAnswer(message);
    if (!resAnswerText || !resAnswerText.success) {
        // add message to DB
        const dbMessage = await handlers.createMessage({
            user: dbUser._id,
            question_type: 'text',
            question_text: questionMessage,
            answer_status: 3,
        });

        // send text to user
        await ctx.reply(resAnswerText.message || "Sorry. We couldn't get answer!");

        return;
    }

    const folderPath = path.resolve(`./voices/${userTelegramId}`);

    // text to voice
    const resTextToVoice = await utils.textToVoice(resAnswerText.message.content, folderPath);
    if (!resTextToVoice || !resTextToVoice.success) {
        // add message to DB
        const dbMessage = await handlers.createMessage({
            user: dbUser._id,
            question_type: 'text',
            question_text: questionMessage,
            answer_text: resAnswerText.message?.content || '',
            answer_status: 3,
        });

        // empty folder
        await utils.emptyFolder(folderPath);

        // send text to user
        await ctx.reply(resAnswerText.message?.content || "Sorry. We couldn't convert text to voice!");

        return;
    }

    // send voice to user
    const answerVoice = await ctx.replyWithVoice({
        source: resTextToVoice.file_path,
    });

    // get answer voice
    const answerVoiceFile = await ctx.telegram.getFileLink(answerVoice.voice.file_id);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'text',
        question_text: questionMessage,
        answer_type: 'voice',
        answer_text: resAnswerText.message?.content || '',
        answer_voice_url: answerVoiceFile.href || '',
        answer_status: 1,
    });

    // empty folder
    await utils.emptyFolder(folderPath);
});

bot.on(message('voice'), async (ctx) => {
    try {
        const questionVoiceFile = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userTelegramId = ctx.message.from.id;
        const fileName = ctx.message.voice.file_unique_id;
        const folderPath = path.resolve(`./voices/${userTelegramId}`);

        // check if user exists in DB, if not create it
        let dbUser = await handlers.getUser(userTelegramId);
        if (!dbUser) {
            dbUser = await handlers.createUser({
                telegram_id: userTelegramId,
                username: ctx.message.from.username,
                name: ctx.message.from.first_name,
                // isAdmin: false,
            });
        }

        // check if user folder exists named userTelegramId, if not create it
        utils.folderStructureSync(folderPath);

        // download .oga file
        await utils.download(questionVoiceFile.href, `${folderPath}/${fileName}.oga`);

        // convert .oga to .wav
        const resConvert = await utils.convert(`${folderPath}/${fileName}.oga`, `${folderPath}/${fileName}.wav`);
        if (!resConvert) {
            // add message to DB
            const dbMessage = await handlers.createMessage({
                user: dbUser._id,
                question_type: 'voice',
                question_voice_url: questionVoiceFile.href,
                answer_status: 3,
            });

            // empty folder
            await utils.emptyFolder(folderPath);

            // send text to user
            await ctx.reply(resConvert.message || "Sorry. We couldn't convert your voice message!");

            return;
        }

        // set this timeout to wait for converting (1000-3000ms is enough)
        setTimeout(async () => {
            // extract text from .wav
            const resSpeechToText = await utils.speechToText(`./../voices/${userTelegramId}/${fileName}.wav`);
            if (!resSpeechToText || !resSpeechToText.success) {
                // add message to DB
                const dbMessage = await handlers.createMessage({
                    user: dbUser._id,
                    question_type: 'voice',
                    question_voice_url: questionVoiceFile.href,
                    answer_status: 3,
                });

                // empty folder
                await utils.emptyFolder(folderPath);

                // send text to user
                await ctx.reply(resSpeechToText.message || "Sorry. We couldn't extract text from your voice message!");

                return;
            }

            // empty folder
            await utils.emptyFolder(folderPath);

            // get answer from Google Bard
            const resAnswerText = await utils.getAnswer(resSpeechToText.message);
            if (!resAnswerText || !resAnswerText.success) {
                // add message to DB
                const dbMessage = await handlers.createMessage({
                    user: dbUser._id,
                    question_type: 'voice',
                    question_text: resSpeechToText.message || '',
                    question_voice_url: questionVoiceFile.href,
                    answer_status: 3,
                });

                // send text to user
                await ctx.reply(resAnswerText.message || "Sorry. We couldn't get answer!");

                return;
            }

            // text to voice
            const resTextToVoice = await utils.textToVoice(resAnswerText.message.content, folderPath);
            if (!resTextToVoice || !resTextToVoice.success) {
                const dbMessage = await handlers.createMessage({
                    user: dbUser._id,
                    question_type: 'voice',
                    question_text: resSpeechToText.message || '',
                    question_voice_url: questionVoiceFile.href,
                    answer_text: resAnswerText.message?.content || '',
                    answer_status: 3,
                });

                // send text to user
                await ctx.reply(resAnswerText.message?.content || "Sorry. We couldn't convert answer to voice!");

                return;
            }

            // send voice to user
            const answerVoice = await ctx.replyWithVoice({
                source: resTextToVoice.file_path,
            });

            // get answer voice url
            const answerVoiceFile = await ctx.telegram.getFileLink(answerVoice.voice.file_id);

            const dbMessage = await handlers.createMessage({
                user: dbUser._id,
                question_type: 'voice',
                question_text: resSpeechToText.message || '',
                question_voice_url: questionVoiceFile.href,
                answer_type: 'voice',
                answer_text: resAnswerText.message?.content || '',
                answer_voice_url: answerVoiceFile.href || '',
                answer_status: 1,
            });

            // empty folder
            await utils.emptyFolder(folderPath);
        }, 3000);
    } catch (err) {
        console.log(err.message || "Something went wrong!");
    }
});

bot.command('test', async (ctx) => {
    const userTelegramId = ctx.message.from.id;

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (!dbUser) {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
    }

    const answerMessage = `Hello, ${dbUser.name}, the test was successful!`;
    const folderPath = path.resolve(`./voices/${userTelegramId}`);

    // text to voice
    const resTextToVoice = await utils.textToVoice(answerMessage, folderPath);
    if (!resTextToVoice || !resTextToVoice.success) {
        // add message to DB
        const dbMessage = await handlers.createMessage({
            user: dbUser._id,
            question_type: 'command',
            command: 'test',
            answer_type: 'text',
            answer_text: resTextToVoice?.message || '',
            answer_status: 3,
        });

        // send text to user
        await ctx.reply(resTextToVoice?.message || "Sorry. We couldn't convert answer to voice!");

        return;
    }

    // send voice to user
    const answerVoice = await ctx.replyWithVoice({
        source: resTextToVoice.file_path,
    });

    // get answer voice
    const answerVoiceFile = await ctx.telegram.getFileLink(answerVoice.voice.file_id);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'test',
        answer_type: 'voice',
        answer_text: answerMessage,
        answer_voice_url: answerVoiceFile.href || '',
        answer_status: 1,
    });

    // empty folder
    await utils.emptyFolder(folderPath);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

connectDB();
