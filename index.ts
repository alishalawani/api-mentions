import express from 'express';
import { PORT, environment } from './app-config';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql-schema';
import { ApolloServer } from 'apollo-server-express';
import { configDotenv } from 'dotenv';
import cors from 'cors';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from 'apollo-server-core';

configDotenv(); //loads the file content into process.env

const env = process.env.NODE_ENV || 'development';
const app = express();

const server = new ApolloServer({
	schema: schema,
	context: ({ req }) => {
		// The context object is one that gets passed to every single resolver at every level, so we can access it anywhere in our schema code.
		const auth = req.get('Authorization') || '';
		// console.log('auth', auth);
		return {
			auth,
		};
	},
	plugins: [
		// Install a landing page plugin based on NODE_ENV
		process.env.NODE_ENV === 'production'
			? ApolloServerPluginLandingPageProductionDefault({
					graphRef: 'my-graph-id@my-graph-variant',//take note of this
					footer: false,
			  })
			: ApolloServerPluginLandingPageLocalDefault({ footer: false }),
	],
});

app.get('/', (req, res) => {
	console.log('Apollo GraphQL Express server is ready');
});

// Enable CORS for the /graphql endpoint
app.use('/graphql', cors());

async function startServer() {
	await server.start();
	
	server.applyMiddleware({
		app,
		cors: {
			credentials: true,
			origin: '*',
		},
	});
}
startServer();

app.listen({ port: PORT }, () => {
	console.log(
		`Server is running at ${
			environment[env as keyof typeof environment].serverURL
		}graphql`
	);
});

//Apollo is the one that will handle your incoming request and call your resolvers or your graphql schema for you
