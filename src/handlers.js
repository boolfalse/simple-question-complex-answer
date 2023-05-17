
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";

const getUser = async (userTelegramId) => {
    return await User.findOne({ telegram_id: userTelegramId });
}

const createUser = async (createObj) => {
    return await User.create(createObj);
}

const createMessage = async (createObj) => {
    return await Message.create(createObj);
}

const updateMessage = async (messageId, updateObj) => {
    await Message.updateOne({ _id: messageId }, updateObj);
}

export default {
    getUser,
    createUser,
    createMessage,
    updateMessage,
};
