import {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLList,
	GraphQLNonNull,
	GraphQLInputObjectType,
} from 'graphql';
import { User, Post } from './dbConnector';
import {
	getToken,
	getUser,
	validateLogin,
	validateOnSignUp,
} from './jwt-utils';
import {
	AuthenticationError,
	UserInputError,
	ValidationError,
} from 'apollo-server-express';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { handleFileUpload } from './fileUploadUtils';


import bCryptPkg from 'bcryptjs';
const { compare, hash } = bCryptPkg;

const UserUpdateType = new GraphQLInputObjectType({
	name: 'UserUpdateType',
	description: 'Input type for updating a user',
	fields: {
		// Define the fields you want to update for a user
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		email: { type: GraphQLString },
		password: { type: GraphQLString },
	},
});

const UserType: any = new GraphQLObjectType({
	name: 'User',
	description: 'A user.',
	fields: () => ({
		id: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: (post) => post._id.toString(),
		},
		firstName: { type: new GraphQLNonNull(GraphQLString) },
		lastName: { type: new GraphQLNonNull(GraphQLString) },
		email: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) },
		avatar: { type: GraphQLString },
		posts: {
			type: new GraphQLList(PostType),
			resolve: async (user) => {
				try {
					return await Post.find({ userId: user.id }).clone().exec();
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		token: { type: GraphQLString },
		created: { type: GraphQLString },
	}),
});

const PostType = new GraphQLObjectType({
	name: 'Post',
	description: 'This represents a post made by a user',
	fields: () => ({
		id: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: (post) => post._id.toString(),
		},
		post: { type: new GraphQLNonNull(GraphQLString) },
		userId: { type: new GraphQLNonNull(GraphQLString) }, // we are not providing a resolve because the id, name, userId fields are not a part of an external object.
		user: {
			type: UserType,
			resolve: async (post) => {
				try {
					const user = await User.findById(post.userId);
					return user;
				} catch (err) {
					throw new Error(err);
				}
			},
		}, // we are specifying the user resolve because the user field is it's own object outside of Post
		created: { type: GraphQLString },
	}),
});

const RootQUeryType = new GraphQLObjectType({
	name: 'Query',
	description: 'Root Query',
	fields: () => ({
		post: {
			type: PostType,
			description: 'A single Post',
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			resolve: async (_parent, args) => {
				try {
					return await Post.findById(args.id).clone().exec();
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		posts: {
			type: new GraphQLList(PostType),
			description: 'List of All Posts',
			resolve: async () => {
				try {
					const post = await Post.find({}).clone().exec();
					return post;
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		users: {
			type: new GraphQLList(UserType),
			description: 'List of All Users',
			resolve: async () => {
				try {
					return await User.find({}).clone().exec();
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		user: {
			type: UserType,
			description: 'A single User',
			args: {
				id: { type: new GraphQLNonNull(GraphQLString) },
			},
			resolve: async (_parent, args) => {
				try {
					return await User.findById(args.id).clone().exec();
				} catch (err) {
					throw new Error(err);
				}
			},
		},
	}),
});
const RootMutationType = new GraphQLObjectType({
	name: 'Mutation',
	description: 'Root Mutation',
	fields: () => ({
		addPost: {
			type: PostType,
			description: 'Add a post',
			args: {
				post: {
					type: new GraphQLNonNull(GraphQLString),
				},
			},
			resolve: async (_parent, args, { auth }) => {
				const user = await getUser(auth);
				if (user) {
					try {
						const post = new Post({
							post: args.post,
							userId: user.id,
							created: new Date().toISOString(),
						});
						const newPost = await post.save();
						return newPost.toObject();
					} catch (err) {
						throw new Error(err);
					}
				}
			},
		},
		deletePost: {
			type: PostType,
			description: 'Delete a post',
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLString),
				},
			},
			resolve: async (_parent, args, { auth }) => {
				const user = await getUser(auth);
				try {
					const post = Post.findById(args.id);
					if (post) {
						if (post.getQuery().userId === user.id) {
							await post.deleteOne().exec();
						} else {
							throw new AuthenticationError(
								`you're not not allowed to delete this post!!`
							);
						}
					} else throw new Error('Post was not found');
					return post;
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		updatePost: {
			type: PostType,
			description: 'Update a post',
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLString),
				},
				post: {
					type: new GraphQLNonNull(GraphQLString),
				},
			},
			resolve: async (_parent, args, { auth }) => {
				const user = await getUser(auth);
				try {
					const post = Post.findById(args.id);
					if (post) {
						if (post.getQuery().userId === user.id) {
							await post.updateOne({ post: args.post }).exec();
						} else {
							throw new AuthenticationError(
								`you're not not allowed to modify this post!!`
							);
						}
					} else throw new Error('Post was not found');
					return post;
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		addUser: {
			type: UserType,
			description: 'Add a user',
			args: {
				firstName: { type: new GraphQLNonNull(GraphQLString) },
				lastName: { type: new GraphQLNonNull(GraphQLString) },
				email: { type: new GraphQLNonNull(GraphQLString) },
				password: { type: new GraphQLNonNull(GraphQLString) },
				avatar: { type: GraphQLUpload },
			},
			resolve: async (_parent, args) => {
				try {
					const { firstName, lastName, email, password, avatar } = args;
					const { errors, valid } = validateOnSignUp(
						email,
						firstName,
						lastName,
						password
					);
					if (!valid) {
						throw new UserInputError('Error', { errors });
					}

					const user = await User.exists({ email }).exec();
					if (user) {
						throw new ValidationError(
							'Account already exists with email, login or create a new account!'
						);
					}
					const hashedPassword = await hash(password, 10);
					const newUser = new User({
						firstName,
						lastName,
						email,
						password: hashedPassword,
						created: new Date().toISOString(),
					});
					const res = await newUser.save();
					const token = getToken({ id: res.id, email: res.email });

					const avatarUrl: string = await handleFileUpload(
						avatar,
						'avatar',
						res.id
					);
					res.avatar = avatarUrl;
					const newRes = await res.save();

					return {
						id: res.id,
						...newRes.toObject(),
						token,
					};
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		deleteUser: {
			type: UserType,
			description: 'Delete a user',
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLString),
				},
			},
			resolve: async (_parent, args, { auth }) => {
				const { id } = await getUser(auth);
				try {
					const user = await User.findOne({_id: args.id}).exec();
					if (user) {
						if (user._id.toString() === id) {
							user.deleteOne();
							return user;
						} else {
							throw new AuthenticationError(
								`you're not not authorized to delete this account!`
							);
						}
					} else throw new Error('User was not found');
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		updateUser: {
			type: UserType,
			description: 'Update a user',
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLString),
				},
				user: {
					type: UserUpdateType,
				},
			},
			resolve: async (_parent, args, { auth }) => {
				const { id } = await getUser(auth);
				try {
					const user = User.findById(args.id);
					if (user) {
						if (user.getQuery().userId === id) {
							user.updateOne({ ...args.user });
							return user;
						} else {
							throw new AuthenticationError(
								`you're not not authorized to modify this account!`
							);
						}
					} else throw new Error('User was not found');
				} catch (err) {
					throw new Error(err);
				}
			},
		},
		loginUser: {
			type: UserType,
			description: 'Login user',
			args: {
				email: { type: new GraphQLNonNull(GraphQLString) },
				password: { type: new GraphQLNonNull(GraphQLString) },
			},
			resolve: async (_parent, args) => {
				try {
					const { email, password } = args;
					// validateLogin is a simple func that checks for empty fields
					// and return valid = false if any.
					const { errors, valid } = validateLogin(email, password);
					if (!valid) throw new UserInputError('Error', { errors });

					const user = await User.findOne({ email }).exec();
					if (!user) throw new AuthenticationError('User was not found!');
					const match = await compare(password, user.password);
					if (!match) throw new AuthenticationError('Wrong email or password!'); //we are not going to say "wrong password" for security reasons."

					const token = getToken({
						id: user.id,
						email: user.email,
					});
					return {
						id: user.id,
						...user.toObject(),
						token,
					};
				} catch (err) {
					throw new Error(err);
				}
			},
		},
	}),
});

export const schema = new GraphQLSchema({
	query: RootQUeryType,
	mutation: RootMutationType,
});
