export interface Ticket {
    id: string;
    channelId: string;
    userId: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: Date;
    updatedAt: Date;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

export interface GuildConfig {
    id: string;
    categoryId?: string | null;
    logChannelId?: string | null;
    adminRoleId?: string | null;
    modRoleId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
