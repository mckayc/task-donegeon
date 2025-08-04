import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth';
import { assetRoutes } from './routes/assets';
import { initializeAssets } from './lib/assetLoader';

const server = Fastify({
  logger: true,
});

// Register plugins
server.register(cors, {
  origin: '*', // For development, allow any origin. For production, restrict this.
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret', // Use environment variable in production
});

// Register routes with prefixes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(assetRoutes, { prefix: '/api/assets' });


// Run the server
const start = async () => {
  try {
    // Initialize game assets before starting the server
    await initializeAssets();

    // In Docker, listen on 0.0.0.0 to be accessible from outside the container
    await server.listen({ port: 3000, host: '0.0.0.0' }); 
    server.log.info(`Server listening on http://localhost:3000`);
  } catch (err) {
    server.log.error(err);
    (process as any).exit(1);
  }
};

start();