import { prisma } from '../infra/prisma/client.js';
import {
    PrismaConfigRepository,
    PrismaTicketRepository,
    PrismaWarningRepository,
} from '../infra/prisma/repositories.js';

export const ticketRepository = new PrismaTicketRepository(prisma);
export const configRepository = new PrismaConfigRepository(prisma);
export const warningRepository = new PrismaWarningRepository(prisma);
