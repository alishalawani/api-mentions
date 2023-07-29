import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
	id: {
		type: String,
	},
	firstName: {
		type: String,
		required: true,
	},
	lastName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	created: {
		type: String,
	},
	avatar: {
		type: String,
	},
});