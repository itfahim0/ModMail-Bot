import { PrismaClient } from '@prisma/client';

import { GuildConfig, Ticket, TicketMessage } from '../../domain/models.js';
import { ConfigRepository, TicketRepository } from '../../domain/repositories.js';

export class PrismaTicketRepository implements TicketRepository {
    constructor(private prisma: PrismaClient) {}

    async create(data: { userId: string; channelId: string }): Promise<Ticket> {
        return this.prisma.ticket.create({
            data: {
                userId: data.userId,
                channelId: data.channelId,
                status: 'OPEN',
            },
        }) as Promise<Ticket>;
    }

    async findById(id: string): Promise<Ticket | null> {
        return this.prisma.ticket.findUnique({ where: { id } }) as Promise<Ticket | null>;
    }

    async findByChannelId(channelId: string): Promise<Ticket | null> {
        return this.prisma.ticket.findUnique({ where: { channelId } }) as Promise<Ticket | null>;
    }

    async findByUserId(userId: string): Promise<Ticket | null> {
        // Logic: find most recent open ticket or just most recent?
        // Usually we check for OPEN ticket for a user.
        return this.prisma.ticket.findFirst({
            where: { userId, status: 'OPEN' },
        }) as Promise<Ticket | null>;
    }

    async updateStatus(id: string, status: 'OPEN' | 'CLOSED'): Promise<Ticket> {
        return this.prisma.ticket.update({
            where: { id },
            data: { status },
        }) as Promise<Ticket>;
    }

    async addMessage(
        ticketId: string,
        data: { senderId: string; content: string },
    ): Promise<TicketMessage> {
        return this.prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: data.senderId,
                content: data.content,
            },
        }) as Promise<TicketMessage>;
    }

    async getMessages(ticketId: string): Promise<TicketMessage[]> {
        return this.prisma.ticketMessage.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
        }) as Promise<TicketMessage[]>;
    }
}

export class PrismaConfigRepository implements ConfigRepository {
    constructor(private prisma: PrismaClient) {}

    async get(id: string = 'default'): Promise<GuildConfig | null> {
        return this.prisma.guildConfig.findUnique({ where: { id } }) as Promise<GuildConfig | null>;
    }

    async upsert(
        id: string,
        data: Partial<Omit<GuildConfig, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<GuildConfig> {
        return this.prisma.guildConfig.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        }) as Promise<GuildConfig>;
    }
}
