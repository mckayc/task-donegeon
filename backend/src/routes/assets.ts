import { FastifyInstance } from 'fastify';
import { getDuties, getVentures, refreshAssets } from '../lib/assetLoader';

export async function assetRoutes(server: FastifyInstance) {
  
  server.get('/duties', async (request, reply) => {
    const duties = await getDuties();
    return duties;
  });

  server.get('/ventures', async (request, reply) => {
    const ventures = await getVentures();
    return ventures;
  });

  server.post('/refresh', async (request, reply) => {
    refreshAssets();
    return reply.send({ message: 'Asset cache refreshed successfully.' });
  });
}
