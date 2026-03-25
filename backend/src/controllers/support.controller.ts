import { Request, Response } from 'express';
import { supportService } from '../services/support.service';
import { AuthRequest } from '../middleware/auth';

export const supportController = {
  createTicket: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { message } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!message || message.trim() === '') {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const ticket = await supportService.createTicket(userId, message);
      res.status(201).json({ success: true, data: ticket });
    } catch (error) {
      console.error('Create support ticket error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  getAllTickets: async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = await supportService.getAllTickets();
      res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      console.error('Get all support tickets error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  updateTicketStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      const ticket = await supportService.updateTicketStatus(id, status as any);
      res.status(200).json({ success: true, data: ticket });
    } catch (error) {
      console.error('Update support ticket status error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};
