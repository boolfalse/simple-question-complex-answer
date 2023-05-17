
import AWS from 'aws-sdk';
import fs from 'fs';
import fluent from 'fluent-ffmpeg';
import axios from 'axios';
import { exec } from 'child_process';

// check if user folder exists, if not create it
const folderStructureSync = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}

// download .oga file
const download = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);
}

// convert .oga to .wav
const convert = async (inputPath, outputPath) => {
    return await fluent(inputPath).toFormat('wav').save(outputPath);
}

// extract text from .wav
const speechToText = async (filePath) => {
    const result = await new Promise((resolve, reject) => {
        const pythonExec = process.env.PYTHON_EXEC_PATH || 'python';
        exec(`${pythonExec} python/transcribe.py "${filePath}"`, (err, stdout, stderr) => {
            if (err) {
                // console.log(err.message);
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });

    return JSON.parse(result);
}

// get answer from Google Bard
const getAnswer = async (text) => {
    const gbSecret = process.env.GOOGLE_BARD_SECRET;
    const result = await new Promise((resolve, reject) => {
        const pythonExec = process.env.PYTHON_EXEC_PATH || 'python';
        exec(`${pythonExec} python/answer.py "${gbSecret}" "${text}"`, (err, stdout, stderr) => {
            if (err) {
                // console.log(err.message);
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });

    return JSON.parse(result);
}

// empty folder
const emptyFolder = async (folder) => {
    fs.readdir(folder, (err, files) => {
        if (err) {
            // console.log(err.message);
        }

        for (const file of files) {
            fs.unlink(`${folder}/${file}`, err => {
                if (err) {
                    // console.log(err.message);
                }
            });
        }
    });
}

// text to voice
const textToVoice = async (text, folderPath) => {
    AWS.config.credentials = new AWS.Credentials(
        process.env.AWS_ACCESS_KEY,
        process.env.AWS_SECRET_KEY
    );
    AWS.config.region = "us-west-2";

    // The text-to-speech service
    const Polly = new AWS.Polly({
        signatureVersion: 'v4',
        region: 'us-west-2'
    });

    const params = {
        'Text': text,
        'OutputFormat': 'ogg_vorbis',
        'VoiceId': 'Joanna'
    };

    const data = await Polly.synthesizeSpeech(params).promise();
    if (data.AudioStream instanceof Buffer) {
        const fileName = Date.now();
        const filePath = `${folderPath}/${fileName}.wav`;
        await fs.writeFile(filePath, data.AudioStream, (err) => err && console.error(err));

        return {
            success: true,
            file_path: filePath,
            message: 'Text to voice success!',
        };
    } else {
        return {
            success: false,
            message: 'Text to voice failed!',
        };
    }
}

export default {
    download,
    folderStructureSync,
    convert,
    speechToText,
    getAnswer,
    emptyFolder,
    textToVoice,
};
