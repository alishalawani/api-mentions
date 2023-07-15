import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
    post: {
        type: String, required: true
    },
});