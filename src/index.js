import fastify from 'fastify';

const Port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastify-auth';

const app = fastify({ logger: true });

// Activate plugins below:

// create server
const start = async () => {
	try {
		await app.listen(Port);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
