import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const supportService = {
  createTicket: async (userId: string, message: string) => {
    return prisma.supportTicket.create({
      data: {
        userId,
        message,
        status: 'OPEN',
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  },

  getAllTickets: async () => {
    return prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  },

  updateTicketStatus: async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  },
};
