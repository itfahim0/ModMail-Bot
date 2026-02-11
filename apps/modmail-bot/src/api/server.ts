import cors from '@fastify/cors';
import fastify, { FastifyInstance } from 'fastify';

import { config } from '../config.js';
import { prisma } from '../infra/prisma/client.js';
import { logger } from '../logging/logger.js';

export function createServer(): FastifyInstance {
    const server = fastify({
        logger: false, // We use our own logger
    });

    // Register plugins
    server.register(cors, {
        origin: '*', // Configure as needed
    });

    // Health check
    server.get('/health', async () => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { status: 'ok', database: 'connected' };
        } catch (error) {
            return { status: 'error', database: 'disconnected', error: String(error) };
        }
    });

    // TODO: Add more routes (e.g. /api/tickets)

    return server;
}

export async function startServer() {
    const server = createServer();
    const port = config.port || 3001; // Ensure config has port or default

    try {
        await server.listen({ port: Number(port), host: '0.0.0.0' });
        logger.info(`HTTP Server listening on port ${port}`);
    } catch (err) {
        logger.error('Failed to start HTTP server', { error: String(err) });
        process.exit(1);
    }
}
