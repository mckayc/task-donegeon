
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { authRoutes } from './routes/auth';
import { assetRoutes } from './routes/assets';
import { initializeAssets } from './lib/assetLoader';

const DEFAULT_JWT_SECRET = 'replace_with_a_long_random_string'; // from .env.example

const server = Fastify({
  logger: true,
});

// A simple check to see if the JWT secret has been changed from its default
const isJwtSecretConfigured = () => {
  const secret = process.env.JWT_SECRET;
  return secret && secret !== DEFAULT_JWT_SECRET && secret.length > 16;
};

// Register plugins
server.register(cors, {
  origin: '*', // For development, allow any origin. For production, restrict this.
});

// Conditionally register routes based on configuration
if (isJwtSecretConfigured()) {
  // --- PRODUCTION/SECURE MODE ---
  server.log.info('JWT secret is configured. Starting in secure mode.');
  server.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  // Register API routes BEFORE the static file handler and SPA fallback
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(assetRoutes, { prefix: '/api/assets' });
  
} else {
  // --- SETUP MODE ---
  server.log.warn('JWT_SECRET is not configured. Starting in setup mode.');
  server.log.warn('API will be disabled until a secret is set in the .env file.');
  
  // Register only a minimal status endpoint
  server.get('/api/status', async (request, reply) => {
    reply.send({ setupNeeded: true, message: 'JWT_SECRET is not configured.' });
  });
}

// Serve the frontend static files from the 'public' directory
server.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/', // Serve from the root
});

// For Single-Page-Application, serve index.html for any GET request that hasn't been handled yet.
server.get('/*', (req, reply) => {
    // This handler will catch all GET requests that didn't match an API route or a static file.
    // This is the intended behavior for an SPA.
    reply.sendFile('index.html');
});

// A generic not found handler for any other request (e.g. POST to a non-existent endpoint)
server.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/') && !isJwtSecretConfigured()) {
        return reply.status(503).send({
            message: 'API is disabled. Please configure JWT_SECRET on the server.',
            error: 'Service Unavailable',
            statusCode: 503
        });
    }
    reply.status(404).send({
        message: 'Resource not found.',
        error: 'Not Found',
        statusCode: 404
    });
});


// Run the server
const start = async () => {
  try {
    // Initialize game assets before starting the server, only if not in setup mode
    if (isJwtSecretConfigured()) {
      await initializeAssets();
    }

    // In Docker, listen on 0.0.0.0 to be accessible from outside the container
    await server.listen({ port: 3000, host: '0.0.0.0' }); 
    server.log.info(`Server listening on port 3000`);
  } catch (err) {
    server.log.error(err);
    (process as any).exit(1);
  }
};

start();
