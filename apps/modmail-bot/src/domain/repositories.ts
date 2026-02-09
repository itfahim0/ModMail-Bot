import { GuildConfig, Ticket, TicketMessage, Warning } from './models.js';

export interface TicketRepository {
    create(data: { userId: string; channelId: string }): Promise<Ticket>;
    findById(id: string): Promise<Ticket | null>;
    findByChannelId(channelId: string): Promise<Ticket | null>;
    findByUserId(userId: string): Promise<Ticket | null>;
    updateStatus(id: string, status: 'OPEN' | 'CLOSED'): Promise<Ticket>;
    addMessage(
        ticketId: string,
        data: { senderId: string; content: string },
    ): Promise<TicketMessage>;
    getMessages(ticketId: string): Promise<TicketMessage[]>;
}

export interface ConfigRepository {
    get(id?: string): Promise<GuildConfig | null>;
    upsert(
        id: string,
        data: Partial<Omit<GuildConfig, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<GuildConfig>;
}

export interface WarningRepository {
    create(data: { userId: string; moderatorId: string; reason: string }): Promise<Warning>;
    findByUserId(userId: string): Promise<Warning[]>;
    delete(id: string): Promise<void>;
}
