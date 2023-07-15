import {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLList,
	GraphQLInt,
	GraphQLNonNull,
	GraphQLID,
} from 'graphql';
import { User, Post } from './dbConnector';
const UserType: any = new GraphQLObjectType({
	name: 'User',
	description: 'A user.',
	fields: () => ({
		id: { type: new GraphQLNonNull(GraphQLID)},
		firstName: { type: GraphQLNonNull(GraphQLString) },
		lastName: { type: GraphQLNonNull(GraphQLString) },
		email: { type: GraphQLNonNull(GraphQLString) },
		password: { type: GraphQLNonNull(GraphQLString) },
		avatar: { type: GraphQLString },
		posts: {
			type: new GraphQLList(PostType),
			resolve: (user) => {
				return Post.find({ userId: user.id });
			},
		},
	}),
});

const PostType = new GraphQLObjectType({
	name: 'Post',
	description: 'This represents a post made by a user',
	fields: () => ({
		id: { type: new GraphQLNonNull(GraphQLID)},
		post: { type: GraphQLNonNull(GraphQLString) },
		userId: { type: new GraphQLNonNull(GraphQLID)}, // we are not providing a resolve because the id, name, userId fields are not a part of an external object.
		user: {
			type: UserType,
			resolve: (post) => {
				return User.findById(post.userId);
			},
		}, // we are specifying the user resolve because the user field is it's own object outside of Post
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
				id: { type: GraphQLInt },
			},
			resolve: (_parent, args) => Post.findById(args.id),
		},
		posts: {
			type: new GraphQLList(PostType),
			description: 'List of All Posts',
			resolve: () => Post.find({}),
		},
		users: {
			type: new GraphQLList(UserType),
			description: 'List of All Users',
			resolve: () => User.find({}),
		},
		user: {
			type: UserType,
			description: 'A single User',
			args: {
				id: { type: GraphQLInt },
			},
			resolve: (_parent, args) => User.findById(args.id),
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
					type: GraphQLNonNull(GraphQLString),
				},
				userId: {
					type: new GraphQLNonNull(GraphQLID)
				},
			},
			resolve: (_parent, args) => {
				const post = new Post({
					post: args.name,
					userId: args.userId,
				});

				return post.save();
			},
		},
		addUser: {
			type: UserType,
			description: 'Add a user',
			args: {
				firstName: { type: GraphQLNonNull(GraphQLString) },
				lastName: { type: GraphQLNonNull(GraphQLString) },
				email: { type: GraphQLNonNull(GraphQLString) },
				password: { type: GraphQLNonNull(GraphQLString) },
				avatar: { type: GraphQLString },
			},
			resolve: (_parent, args) => {
				const { firstName, lastName, email, password, avatar } = args;
				const user = new User({
					firstName,
					lastName,
					email,
					password,
					avatar,
				});
				return user.save();
			},
		},
	}),
});

export const schema = new GraphQLSchema({
	query: RootQUeryType,
	mutation: RootMutationType,
});
