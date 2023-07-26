import mongoose from "mongoose";

export const postSchema = new mongoose.Schema({
	post: {
		type: String,
		required: true,
	},
	userId: {
		type: String,
		required: false,
	},
	id: {
		type: String,
		required: false,
	},
	created: {
		type: String,
	},
});