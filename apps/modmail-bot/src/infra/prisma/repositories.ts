import { PrismaClient, Ticket as PrismaTicket } from '@prisma/client';

import { GuildConfig, Ticket, TicketMessage, TicketStatus, Warning } from '../../domain/models.js';
import {
    ConfigRepository,
    TicketRepository,
    WarningRepository,
} from '../../domain/repositories.js';

// Helper to map Prisma Ticket to Domain Ticket
function mapTicket(item: PrismaTicket): Ticket {
    return {
        ...item,
        status: item.status as TicketStatus, // Safe cast as Enums match
    };
}

export class PrismaTicketRepository implements TicketRepository {
    constructor(private prisma: PrismaClient) {}

    async create(data: { userId: string; channelId: string }): Promise<Ticket> {
        const ticket = await this.prisma.ticket.create({
            data: {
                userId: data.userId,
                channelId: data.channelId,
                status: TicketStatus.OPEN,
            },
        });
        return mapTicket(ticket);
    }

    async findById(id: string): Promise<Ticket | null> {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        return ticket ? mapTicket(ticket) : null;
    }

    async findByChannelId(channelId: string): Promise<Ticket | null> {
        const ticket = await this.prisma.ticket.findUnique({ where: { channelId } });
        return ticket ? mapTicket(ticket) : null;
    }

    async findByUserId(userId: string): Promise<Ticket | null> {
        // Logic: find most recent open ticket or just most recent?
        // Usually we check for OPEN ticket for a user.
        const ticket = await this.prisma.ticket.findFirst({
            where: { userId, status: TicketStatus.OPEN },
        });
        return ticket ? mapTicket(ticket) : null;
    }

    async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
        const ticket = await this.prisma.ticket.update({
            where: { id },
            data: { status },
        });
        return mapTicket(ticket);
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
        });
    }

    async getMessages(ticketId: string): Promise<TicketMessage[]> {
        return this.prisma.ticketMessage.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
        });
    }
}

export class PrismaConfigRepository implements ConfigRepository {
    constructor(private prisma: PrismaClient) {}

    async get(id: string = 'default'): Promise<GuildConfig | null> {
        return this.prisma.guildConfig.findUnique({ where: { id } });
    }

    async upsert(
        id: string,
        data: Partial<Omit<GuildConfig, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<GuildConfig> {
        return this.prisma.guildConfig.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}

export class PrismaWarningRepository implements WarningRepository {
    constructor(private prisma: PrismaClient) {}

    async create(data: { userId: string; moderatorId: string; reason: string }): Promise<Warning> {
        return this.prisma.warning.create({
            data: {
                userId: data.userId,
                moderatorId: data.moderatorId,
                reason: data.reason,
            },
        });
    }

    async findByUserId(userId: string): Promise<Warning[]> {
        return this.prisma.warning.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.warning.delete({ where: { id } });
    }
}
