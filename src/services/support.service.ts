import api from './api';

export interface SupportTicket {
  id: string;
  userId: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export const supportService = {
  createTicket: async (message: string): Promise<SupportTicket> => {
    const response = await api.post('/support', { message });
    return response.data.data;
  },

  getAdminTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get('/support/admin');
    return response.data.data;
  },

  updateTicketStatus: async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'): Promise<SupportTicket> => {
    const response = await api.patch(`/support/admin/${ticketId}/status`, { status });
    return response.data.data;
  },
};
