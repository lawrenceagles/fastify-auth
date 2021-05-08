import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import User from '../models/user';
const models = { User };
const ConnectDB = async (fastify, options) => {
	try {
		mongoose.connection.on('connected', () => {
			fastify.log.info({ actor: 'MongoDB' }, 'connected');
		});
		mongoose.connection.on('disconnected', () => {
			fastify.log.error({ actor: 'MongoDB' }, 'disconnected');
		});
		const db = await mongoose.connect(options.uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true
		});
		// decorates fastify with our model
		fastify.decorate('db', { models });
	} catch (error) {
		console.error(error);
	}
};
export default fp(ConnectDB);
