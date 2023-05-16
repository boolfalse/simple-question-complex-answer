
import fs from 'fs';
import fluent from 'fluent-ffmpeg';
import axios from 'axios';
import { exec } from 'child_process';

// check if user folder exists named userId, if not create it
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
const textToVoice = async (text, filePath) => {
    //
}

export default {
    download,
    folderStructureSync,
    convert,
    speechToText,
    getAnswer,
    emptyFolder,
};
