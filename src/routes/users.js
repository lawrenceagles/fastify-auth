import fp from 'fastify-plugin';
import FastifyAuth from 'fastify-auth';
import User from '../models/user';

const usersRoutes = async (fastify, opts) => {
	fastify
		.decorate('asyncVerifyJWT', async () => {
			console.log('your token is verified!');
		})
		.decorate('asyncVerifyUserAndPassword', async () => {
			console.log('username and password is verified!');
		})
		.register(FastifyAuth)
		.after(() => {
			fastify.route({
				method: [ 'GET', 'HEAD' ],
				url: '/register',
				logLevel: 'warn',
				preHandler: fastify.auth([ fastify.asyncVerifyJWT, fastify.asyncVerifyUserAndPassword ]),
				handler: async (req, reply) => {
					// req.log.info('Auth route');
					reply.send({ hello: 'Verified User!!!' });
				}
			});
		});

	// console.log('fastify Auth', FastifyAuth);
	// console.log('fastify instance', fastify);

	// fastify.addHook('preHandler', fastify.auth([ fastify.asyncVerifyJWT, fastify.asyncVerifyUserAndPassword ]));
};

// export default fp(usersRoutes);
export default usersRoutes;
