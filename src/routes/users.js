import FastifyAuth from 'fastify-auth';
import User from '../models/user';

const usersRoutes = async (fastify, opts) => {
	fastify
		.decorate('asyncVerifyJWT', async (request, reply) => {
			try {
				if (!request.headers.authorization) {
					throw new Error('No token was sent');
				}
				const token = request.headers.authorization.replace('Bearer ', '');
				const user = await User.findByToken(token);
				if (!user) {
					// handles logged out user with valid token
					throw new Error('Authentication failed!');
				}
				request.user = user;
				request.token = token; // used in loggot route
			} catch (error) {
				reply.code(401).send(error);
			}
		})
		.decorate('asyncVerifyUsernameAndPassword', async (request, reply) => {
			try {
				if (!request.body) {
					throw new Error('username and Password is required!');
				}
				const user = await User.findByCredentials(request.body.username, request.body.password);
				request.user = user;
			} catch (error) {
				reply.code(400).send(error);
			}
		})
		.register(FastifyAuth)
		.after(() => {
			fastify.route({
				method: [ 'POST', 'HEAD' ],
				url: '/register',
				logLevel: 'warn',
				handler: async (req, reply) => {
					const user = new User(req.body);

					try {
						await user.save();
						const token = await user.generateToken();
						reply.status(201).send({ user });
					} catch (error) {
						reply.status(400).send(error);
					}
				}
			});

			fastify.route({
				method: [ 'POST', 'HEAD' ],
				url: '/login',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyUsernameAndPassword ]),
				handler: async (req, reply) => {
					const token = await req.user.generateToken();
					reply.send({ status: 'You are logged in', user: req.user });
				}
			});

			fastify.route({
				method: [ 'GET', 'HEAD' ],
				url: '/profile',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyJWT ]),
				handler: async (req, reply) => {
					reply.send({ status: 'Authenticated!', user: req.user });
				}
			});

			fastify.route({
				method: [ 'POST', 'HEAD' ],
				url: '/logout',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyJWT ]),
				handler: async (req, reply) => {
					try {
						req.user.tokens = req.user.tokens.filter((token) => {
							return token.token !== req.token;
						});
						const loggedOutUser = await req.user.save();

						reply.send({ status: 'You are logged out!', user: loggedOutUser });
					} catch (e) {
						res.status(500).send();
					}
				}
			});
		});
};

export default usersRoutes;
