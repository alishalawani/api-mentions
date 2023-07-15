import mongoose from "mongoose";
import { postSchema } from "./postSchema";
import { userSchema } from "./userSchema";
import { environment } from "./app-config";
const env = process.env.NODE_ENV || "development";

/**
 * Mongoose Connection
**/

mongoose.connect(environment[env as keyof typeof environment].dbString as string)

let db = mongoose.connection;
db.on('error', () => {
    console.error("Error while connecting to DB");
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

export { User, Post };