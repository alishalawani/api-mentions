import { configDotenv } from 'dotenv';
configDotenv(); //loads the file content into process.env

export const PORT = process.env.PORT;
export const environment = {
	development: {
		serverURL: `http://localhost:${PORT}/`,
		dbString: 'mongodb://127.0.0.1:27017/mentions',
	},
	production: {
		serverURL: `http://localhost:${PORT}/`,
		dbString: 'mongodb://127.0.0.1:27017/mentions-prod',
	},
};
