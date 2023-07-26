module.exports = {
	projects: {
		app: {
			schema: ['./graphql-schema.ts'],
			documents: ['**/*.{graphql,js,ts,jsx,tsx}'],
		},
	},
};
// https://medium.com/geekculture/graphql-with-mongodb-and-expressjs-26e1b94ab886