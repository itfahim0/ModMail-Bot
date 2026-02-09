// --- Enums ---

export enum TicketStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
}

export enum GuardianRole {
    OWNER = 'OWNER',
    GUARDIAN = 'GUARDIAN',
}

export enum ApprovalMode {
    ONE_OF_N = 'ONE_OF_N',
    REQUIRE_ALL = 'REQUIRE_ALL',
}

export enum ApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// --- Interfaces ---

export interface Ticket {
    id: string;
    channelId: string;
    userId: string;
    status: TicketStatus;
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
    autoRoleId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Warning {
    id: string;
    userId: string;
    moderatorId: string;
    reason: string;
    createdAt: Date;
}
