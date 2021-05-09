import fp from 'fastify-plugin';
const status = async (server, opts) => {
	server.route({
		url: '/status',
		logLevel: 'warn',
		method: [ 'GET', 'HEAD' ],
		handler: async (request, reply) => {
			reply.send({ date: new Date(), status: 'server is working' });
		}
	});
};
export default fp(status);