import { AuthenticationError } from 'apollo-server-express';
import { sign, verify } from 'jsonwebtoken';

export const getToken = ({ id, email }: { id: string; email: string }) =>
	sign({ id, email }, process.env.SECRET, { expiresIn: '1d' }); //the payload {id, email} will be included in the token

export function validateLogin(
	email: string,
	password: string
): { errors: string[]; valid: boolean } {
	const errors: string[] = [];

	if (!email.trim()) {
		errors.push('Email is required.');
	}

	if (!password.trim()) {
		errors.push('Password is required.');
	}

	return { errors, valid: !errors.length };
}

export function validateOnSignUp(
	email: string,
	firstName: string,
	lastName: string,
	password: string
): { errors: string[]; valid: boolean } {
	const errors: string[] = [];

	// Check if email is empty
	if (!email.trim()) {
		errors.push('Email is required.');
	}

	// Check if firstName is empty
	if (!firstName.trim()) {
		errors.push('First name is required.');
	}

	// Check if lastName is empty
	if (!lastName.trim()) {
		errors.push('Last name is required.');
	}

	// Check if password is empty
	if (!password.trim()) {
		errors.push('Password is required.');
	}

	return { errors, valid: !errors.length };
}

// Simply take an auth header and returns the user.
export const getUser = (auth: any): any => {
	if (!auth) throw new AuthenticationError('you must be logged in!');

	const token = auth.split('Bearer ')[1];
	if (!token) throw new AuthenticationError('you should provide a token!');

	try {
		const user = verify(
			token,
			process.env.SECRET
		);
		return user;
	} catch (err) {
		throw new AuthenticationError('invalid token');
	}
};
