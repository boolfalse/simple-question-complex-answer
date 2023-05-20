
import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import utils from "./utils.js";
import handlers from "./handlers.js";
import path from "path";
import commands from "../config/commands.js";
import connectDB from "./../config/db.js";
import settings from "../config/settings.js";
connectDB();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
    const userTelegramId = ctx.message.from.id;
    let answerMessage = '';

    // check if user exists in DB, if not create it
    let dbUser = await handlers.getUser(userTelegramId);
    if (dbUser) {
        // build multiline text message
        answerMessage += 'I\'m an assistant. Just ask me anything using text or voice messages.'
    } else {
        dbUser = await handlers.createUser({
            telegram_id: userTelegramId,
            username: ctx.message.from.username,
            name: ctx.message.from.first_name,
        });
        // build multiline text message
        answerMessage = `\u{1F64B} Hello ${dbUser.name}! \n\n`;
        answerMessage += 'Below are the commands you can use:\n\n';
        Object.keys(commands).forEach((command) => {
            answerMessage += `/${command} - ${commands[command]}\n`;
        });
        answerMessage += '\nYou can send up to 10 questions per day, and in case of voice messages, up to 60 seconds per day.';
        answerMessage += '\n\nHappy hacking! \u{1F680}';
    }

    // send text to user
    await ctx.reply(answerMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'start',
        answer_text: answerMessage,
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

    let answerMessage = "Previous conversation ended. You can start a new one \u{1F609}";

    // send text to user
    await ctx.reply(answerMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'new',
        answer_text: answerMessage,
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
    let answerMessage = `These are bot commands:\n\n`;
    Object.keys(commands).forEach((command) => {
        answerMessage += `/${command} - ${commands[command]}\n`;
    });
    answerMessage += '\nJust use them if need!';

    // send text to user
    await ctx.reply(answerMessage);

    // add message to DB
    const dbMessage = await handlers.createMessage({
        user: dbUser._id,
        question_type: 'command',
        command: 'help',
        answer_text: answerMessage,
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

    // check if 'limited_until' exists and not expired
    if (dbUser.limited_until && new Date() < dbUser.limited_until) {
        const answerMessage = `Sorry, you have exceeded the daily limit.` +
            `\nIt is max ${settings.max_questions_per_day} messages per day, ` +
            `and max ${settings.max_voice_messages_length_per_day} seconds for the voice messages.` +
            `\n\nPlease try again tomorrow! \u{1F609}`;

        // send text to user
        await ctx.reply(answerMessage);

        // add message to DB
        const dbMessage = await handlers.createMessage({
            user: dbUser._id,
            question_type: 'text',
            question_text: questionMessage,
            answer_status: 4,
        });

        return;
    }

    // get answer from Google Bard
    const resAnswerText = await utils.getAnswer(questionMessage);
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

    if (!dbUser.isAdmin) {
        // review user limit
        const limitExceeded = await handlers.isLimitExceeded(dbUser._id);
        if (limitExceeded) {
            const limit = new Date().getTime() + 24 * 60 * 60 * 1000;
            await handlers.updateUser(dbUser._id, {
                limit_exceeded: true,
                limited_until: new Date(limit),
            });
        } else {
            await handlers.updateUser(dbUser._id, {
                limit_exceeded: false,
                limited_until: null,
            });
        }
    }
});

bot.on(message('voice'), async (ctx) => {
    try {
        const questionVoiceFile = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userTelegramId = ctx.message.from.id;

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

        const fileName = ctx.message.voice.file_unique_id;
        const folderPath = path.resolve(`./voices/${userTelegramId}`);

        // check if 'limited_until' exists and not expired
        if (!dbUser.isAdmin && dbUser.limited_until && new Date() < dbUser.limited_until) {
            const answerMessage = `Sorry, you have exceeded the daily limit.` +
                `\nIt is max ${settings.max_questions_per_day} messages per day, ` +
                `and max ${settings.max_voice_messages_length_per_day} seconds for the voice messages.` +
                `\n\nPlease try again tomorrow! \u{1F609}`;

            // send text to user
            await ctx.reply(answerMessage);

            // add message to DB
            const dbMessage = await handlers.createMessage({
                user: dbUser._id,
                question_type: 'voice',
                question_voice_url: questionVoiceFile.href,
                answer_status: 4,
            });

            return;
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
                question_voice_duration: ctx.message.voice.duration,
                answer_type: 'voice',
                answer_text: resAnswerText.message?.content || '',
                answer_voice_url: answerVoiceFile.href || '',
                answer_status: 1,
            });

            // empty folder
            await utils.emptyFolder(folderPath);

            if (!dbUser.isAdmin) {
                // review user limit
                const limitExceeded = await handlers.isLimitExceeded(dbUser._id);
                if (limitExceeded) {
                    const limit = new Date().getTime() + 24 * 60 * 60 * 1000;
                    await handlers.updateUser(dbUser._id, {
                        limit_exceeded: true,
                        limited_until: new Date(limit),
                    });
                } else {
                    await handlers.updateUser(dbUser._id, {
                        limit_exceeded: false,
                        limited_until: null,
                    });
                }
            }
        }, 3000);
    } catch (err) {
        console.log(err.message || "Something went wrong!");
    }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
