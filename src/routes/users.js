import FastifyAuth from 'fastify-auth';
import User from '../models/user';

const usersRoutes = async (fastify, opts) => {
	fastify
		.decorate('asyncVerifyJWT', async (request, reply) => {
			try {
				const token = request.raw.headers('Authorization').replace('Bearer ', '');
				const user = User.findByToken(token);
				console.log('your user', user);
				// reply.code(200).send(user);
			} catch (error) {
				console.log('your error', error);
				reply.code(401).send(error);
			}
		})
		.decorate('asyncVerifyUsernameAndPassword', async (request, reply) => {
			try {
				if (!request.body) {
					throw new Error('username and Password is required!');
				}
				const user = await User.findByCredentials(request.body.username, request.body.password);
				console.log('your user', user);
				reply.code(200).send(user);
			} catch (error) {
				console.log('your error', error);
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
						// await user.save();
						// const token = await user.generateAuthToken();
						reply.status(201).send({ user });
						// reply.status(201).send({ user, token });
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
					req.log.info('Auth route');
					reply.send({ hello: 'Verified User!!!' });
				}
			});

			fastify.route({
				method: [ 'GET', 'HEAD' ],
				url: '/profile',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyJWT ]),
				handler: async (req, reply) => {
					req.log.info('Auth route');
					reply.send({ Status: 'Successful', user: req.user });
				}
			});
		});
};

export default usersRoutes;
