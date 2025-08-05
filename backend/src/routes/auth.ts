
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/jwt';
import { prisma } from '../db';
import { comparePassword, hashPassword } from '../lib/hash';

export async function authRoutes(server: FastifyInstance) {

  // A status check endpoint for the frontend
  server.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    // If this route is reachable, it means the JWT secret is configured.
    return { setupNeeded: false };
  });

  // Check if an admin user already exists
  server.get('/admin-exists', async (request: FastifyRequest, reply: FastifyReply) => {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    return { exists: adminCount > 0 };
  });

  // Register the first admin user
  server.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount > 0) {
      return reply.status(403).send({ message: 'An admin account already exists.' });
    }

    const { firstName, lastName, gameName, birthDate, password, pin } = request.body as any;

    if (!firstName || !lastName || !gameName || !password || !pin) {
        return reply.status(400).send({ message: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { gameName } });
    if (existingUser) {
        return reply.status(409).send({ message: 'Game name is already taken.' });
    }

    const passwordHash = hashPassword(password);
    const pinHash = hashPassword(pin);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        gameName,
        birthDate,
        passwordHash,
        pinHash,
        isAdmin: true, // First user is always admin
      },
    });
    
    const token = server.jwt.sign({ id: user.id, gameName: user.gameName, isAdmin: user.isAdmin });
    const { passwordHash: _p, pinHash: _ph, ...userResponse } = user;
    return reply.send({ token, user: userResponse });
  });

  // Login a user
  server.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { gameName, password } = request.body as any;
    if (!gameName || !password) {
      return reply.status(400).send({ message: 'Game name and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { gameName } });
    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials. The gates remain sealed.' });
    }

    const isPasswordCorrect = comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return reply.status(401).send({ message: 'Invalid credentials. The gates remain sealed.' });
    }
    
    const token = server.jwt.sign({ id: user.id, gameName: user.gameName, isAdmin: user.isAdmin });
    const { passwordHash: _p, pinHash: _ph, ...userResponse } = user;
    return reply.send({ token, user: userResponse });
  });
}
