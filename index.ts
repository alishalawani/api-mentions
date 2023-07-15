import express from 'express';
import { PORT } from './app-config';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql-schema';
const app = express();

app.get('/', (req, res) => {
	console.log('Apollo GraphQL Express server is ready');
});

app.use(
	'/graphql',
	graphqlHTTP({
		schema,
		graphiql: true,
	})
);

app.listen({ port: PORT }, () => {
	console.log(
		`Server is running at http://localhost:8080/graphql`
	);
});