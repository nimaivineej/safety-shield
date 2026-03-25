import { Router } from 'express';
import { supportController } from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public/User routes
router.post('/', authenticate, supportController.createTicket);

// Admin only routes
router.get('/admin', authenticate, authorize('ADMIN'), supportController.getAllTickets);
router.patch('/admin/:id/status', authenticate, authorize('ADMIN'), supportController.updateTicketStatus);

export default router;
