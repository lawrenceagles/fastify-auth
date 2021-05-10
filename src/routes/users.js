import FastifyAuth from 'fastify-auth';
import User from '../models/user';

const usersRoutes = async (fastify, opts) => {
	fastify
		.decorate('asyncVerifyJWT', async (request, reply) => {
			console.log('your token is verified!');
			try {
				const user = User.findByToken(request.raw.headers.Bearer);
				console.log('your user', user);
				reply.code(401).send(user);
			} catch (error) {
				console.log('your error', error);
				reply.code(401).send(error);
			}
		})
		.decorate('asyncVerifyUserAndPassword', async (request, reply) => {
			console.log('username and password is verified!');
		})
		.register(FastifyAuth)
		.after(() => {
			fastify.route({
				method: [ 'GET', 'HEAD' ],
				url: '/register',
				logLevel: 'warn',
				handler: async (req, reply) => {
					req.log.info('Auth route');
					reply.send({ hello: 'Verified User!!!' });
				}
			});

			fastify.route({
				method: [ 'GET', 'HEAD' ],
				url: '/login',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyUserAndPassword ]),
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

// export default fp(usersRoutes);
export default usersRoutes;
