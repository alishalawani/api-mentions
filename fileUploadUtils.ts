import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { finished } from 'stream/promises';

// www.apollographql.com/docs/apollo-server/v3/data/file-uploads/

export interface File {
	filename: string;
	mimetype: string;
	encoding: string;
}

export const handleFileUpload = async (file: any, uploadType: string, userId: string): Promise<string> => {
	const { createReadStream, filename, mimetype, encoding } = await file;

	// Invoking the `createReadStream` will return a Readable Stream.
	// See https://nodejs.org/api/stream.html#stream_readable_streams
	const stream = createReadStream();

    const path = generateUploadPath(uploadType, userId, filename);
	const directory = path.substring(0, path.lastIndexOf('/'));
	if (!existsSync(directory)) {
		mkdirSync(directory, { recursive: true });
	}

	const out = createWriteStream(path);
	stream.pipe(out);
	await finished(out);

	return path;
};

function generateUploadPath(
	uploadType: string,
	userId: string,
	fileName: string
): string {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Month starts from 0
	const day = String(date.getDate()).padStart(2, '0');
	const uploadPath = `uploads/${uploadType}/${userId}/${year}/${month}/${day}/${fileName}`;

	return uploadPath;
}
