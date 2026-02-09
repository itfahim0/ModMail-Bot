import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    PrismaConfigRepository,
    PrismaTicketRepository,
    PrismaWarningRepository,
} from './repositories.js';

// Simple Mock for PrismaClient
// We cast this to any or unknown to satisfy the type checker for the constructor
const mockPrisma = {
    ticket: {
        create: async (args: any) => ({
            id: 'ticket-1',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        findUnique: async (args: any) => {
            if (args.where.id === 'ticket-1') {
                return {
                    id: 'ticket-1',
                    userId: 'user-1',
                    channelId: 'channel-1',
                    status: 'OPEN',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
            if (args.where.channelId === 'channel-1') {
                return {
                    id: 'ticket-1',
                    userId: 'user-1',
                    channelId: 'channel-1',
                    status: 'OPEN',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
            return null;
        },
        findFirst: async (args: any) => {
            if (args.where.userId === 'user-1' && args.where.status === 'OPEN') {
                return {
                    id: 'ticket-1',
                    userId: 'user-1',
                    channelId: 'channel-1',
                    status: 'OPEN',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
            return null;
        },
        update: async (args: any) => ({
            id: args.where.id,
            userId: 'user-1',
            channelId: 'channel-1',
            status: args.data.status,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
    },
    ticketMessage: {
        create: async (args: any) => ({
            id: 'msg-1',
            ...args.data,
            createdAt: new Date(),
        }),
        findMany: async (args: any) => [
            {
                id: 'msg-1',
                ticketId: args.where.ticketId,
                content: 'Hello',
                senderId: 'user-1',
                createdAt: new Date(),
            },
        ],
    },
    guildConfig: {
        findUnique: async (args: any) => {
            if (args.where.id === 'default') {
                return {
                    id: 'default',
                    prefix: '!',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
            return null;
        },
        upsert: async (args: any) => ({
            ...args.create,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
    },
    warning: {
        create: async (args: any) => ({
            id: 'warn-1',
            ...args.data,
            createdAt: new Date(),
        }),
        findMany: async (args: any) => {
            if (args.where.userId === 'user-1') {
                return [
                    {
                        id: 'warn-1',
                        userId: 'user-1',
                        moderatorId: 'mod-1',
                        reason: 'Spam',
                        createdAt: new Date(),
                    },
                ];
            }
            return [];
        },
        delete: async (args: any) => ({
            id: args.where.id,
        }),
    },
};

describe('Prisma Repositories', () => {
    // Cast mock to any to bypass strict PrismaClient typing for tests
    const prisma = mockPrisma as any;

    describe('PrismaTicketRepository', () => {
        const repo = new PrismaTicketRepository(prisma);

        it('should create a ticket', async () => {
            const ticket = await repo.create({ userId: 'user-1', channelId: 'channel-1' });
            assert.strictEqual(ticket.id, 'ticket-1');
            assert.strictEqual(ticket.status, 'OPEN');
        });

        it('should find ticket by id', async () => {
            const ticket = await repo.findById('ticket-1');
            assert.ok(ticket);
            assert.strictEqual(ticket?.id, 'ticket-1');
        });

        it('should find ticket by channelId', async () => {
            const ticket = await repo.findByChannelId('channel-1');
            assert.ok(ticket);
            assert.strictEqual(ticket?.channelId, 'channel-1');
        });

        it('should find active ticket by userId', async () => {
            const ticket = await repo.findByUserId('user-1');
            assert.ok(ticket);
            assert.strictEqual(ticket?.userId, 'user-1');
        });

        it('should update ticket status', async () => {
            const ticket = await repo.updateStatus('ticket-1', 'CLOSED');
            assert.strictEqual(ticket.status, 'CLOSED');
        });

        it('should add a message', async () => {
            const msg = await repo.addMessage('ticket-1', { senderId: 'user-1', content: 'Hello' });
            assert.strictEqual(msg.content, 'Hello');
            assert.strictEqual(msg.ticketId, 'ticket-1');
        });
    });

    describe('PrismaConfigRepository', () => {
        const repo = new PrismaConfigRepository(prisma);

        it('should get default config', async () => {
            const config = await repo.get('default');
            assert.ok(config);
            assert.strictEqual(config?.prefix, '!');
        });

        it('should return null for unknown config', async () => {
            const config = await repo.get('unknown');
            assert.strictEqual(config, null);
        });

        it('should upsert config', async () => {
            const config = await repo.upsert('default', { prefix: '?' });
            assert.strictEqual(config.prefix, '?');
        });
    });

    describe('PrismaWarningRepository', () => {
        const repo = new PrismaWarningRepository(prisma);

        it('should create a warning', async () => {
            const warn = await repo.create({
                userId: 'user-1',
                moderatorId: 'mod-1',
                reason: 'Spam',
            });
            assert.strictEqual(warn.reason, 'Spam');
            assert.strictEqual(warn.userId, 'user-1');
        });

        it('should find warnings by user id', async () => {
            const warnings = await repo.findByUserId('user-1');
            assert.strictEqual(warnings.length, 1);
            assert.strictEqual(warnings[0].reason, 'Spam');
        });

        it('should return empty array for user with no warnings', async () => {
            const warnings = await repo.findByUserId('user-2');
            assert.strictEqual(warnings.length, 0);
        });

        it('should delete a warning', async () => {
            // Should not throw
            await repo.delete('warn-1');
        });
    });
});
