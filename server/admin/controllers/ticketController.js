import SupportTicket from '../models/SupportTicket.js';
import User from '../../models/User.js';
import Admin from '../models/Admin.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, pickAllowed, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_TICKET_STATUS   = ['open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_TICKET_PRIORITY = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_TICKET_CATEGORY = ['weather', 'irrigation', 'crop_health', 'market', 'technical', 'other'];

class TicketController {
  /**
   * GET /api/admin/tickets
   * Lists all support tickets with filtering and pagination
   */
  async getTickets(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const status   = pickAllowed(req.query.status,   ALLOWED_TICKET_STATUS);
      const priority = pickAllowed(req.query.priority, ALLOWED_TICKET_PRIORITY);
      const category = pickAllowed(req.query.category, ALLOWED_TICKET_CATEGORY);
      const search   = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const query = {};
      if (status)   query.status   = status;    // safe: whitelist-validated
      if (priority) query.priority = priority;  // safe: whitelist-validated
      if (category) query.category = category;  // safe: whitelist-validated
      if (search) {
        const safe = escapeRegex(search);
        query.$or = [
          { ticketId:    { $regex: safe, $options: 'i' } },
          { subject:     { $regex: safe, $options: 'i' } },
          { description: { $regex: safe, $options: 'i' } },
        ];
      }

      const tickets = await SupportTicket.find(query)
        .populate('farmerId', 'name email phone')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await SupportTicket.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          tickets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Support tickets list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tickets/:id
   * Fetch single ticket details with comments
   */
  async getTicketById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid ticket ID format', 400);
      }
      const ticket = await SupportTicket.findById(String(id))
        .populate('farmerId', 'name email phone')
        .populate('assignedTo', 'name email role')
        .lean();

      if (!ticket) {
        return ApiResponse.error(res, 'Support ticket not found', 404);
      }

      return ApiResponse.success(res, ticket, 'Ticket retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/tickets
   * Create a new ticket (e.g. raised on telephone call with farmer)
   */
  async createTicket(req, res, next) {
    try {
      const { farmerId, subject, description, category, priority } = req.body;

      if (!farmerId || !subject || !description) {
        return ApiResponse.error(res, 'Required fields: farmerId, subject, description', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(farmerId)) {
        return ApiResponse.error(res, 'Invalid farmer ID format', 400);
      }

      // Check farmer
      const farmer = await User.findById(String(farmerId));
      if (!farmer || farmer.role?.toUpperCase() !== 'FARMER') {
        return ApiResponse.error(res, 'Farmer account not found', 404);
      }

      // Auto-generate ticket ID (e.g. TK-1718293)
      const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;

      const ticket = await SupportTicket.create({
        ticketId,
        farmerId,
        subject,
        description,
        category: category || 'other',
        priority: priority || 'medium',
        status: 'open',
        assignedTo: req.admin.id, // Assign to current executive raising it by default
      });

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CREATE_TICKET',
        module: 'TICKET',
        ipAddress: req.ip,
        details: { ticketId: ticket.ticketId, id: ticket._id },
      });

      return ApiResponse.success(res, ticket, 'Support ticket raised successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/tickets/:id/assign
   * Assign ticket to an admin staff
   */
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid ticket ID format', 400);
      }
      if (assignedToId && !mongoose.Types.ObjectId.isValid(assignedToId)) {
        return ApiResponse.error(res, 'Invalid assignee ID format', 400);
      }

      const ticket = await SupportTicket.findById(String(id));
      if (!ticket) {
        return ApiResponse.error(res, 'Support ticket not found', 404);
      }

      let admin = null;
      if (assignedToId) {
        admin = await Admin.findById(String(assignedToId));
        if (!admin) {
          return ApiResponse.error(res, 'Admin assignee not found', 404);
        }
      }

      ticket.assignedTo = assignedToId || null;
      ticket.status = assignedToId ? 'in_progress' : 'open';
      await ticket.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ASSIGN_TICKET',
        module: 'TICKET',
        ipAddress: req.ip,
        details: { ticketId: ticket.ticketId, assignedTo: admin ? admin.email : 'unassigned' },
      });

      return ApiResponse.success(res, ticket, `Ticket successfully assigned to ${admin ? admin.name : 'Unassigned'}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/tickets/:id/resolve
   * Change ticket status
   */
  async resolveTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'open' | 'in_progress' | 'resolved'

      if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
        return ApiResponse.error(res, 'Valid status is required (open, in_progress, resolved)', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid ticket ID format', 400);
      }

      const ticket = await SupportTicket.findById(String(id));
      if (!ticket) {
        return ApiResponse.error(res, 'Support ticket not found', 404);
      }

      ticket.status = status;
      await ticket.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'RESOLVE_TICKET',
        module: 'TICKET',
        ipAddress: req.ip,
        details: { ticketId: ticket.ticketId, status },
      });

      return ApiResponse.success(res, ticket, `Ticket status changed to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/tickets/:id/comments
   * Add comment to ticket discussion
   */
  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return ApiResponse.error(res, 'Comment message is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid ticket ID format', 400);
      }

      const ticket = await SupportTicket.findById(String(id));
      if (!ticket) {
        return ApiResponse.error(res, 'Support ticket not found', 404);
      }

      const comment = {
        senderName: req.admin.name,
        senderRole: req.admin.role,
        message: message.trim(),
        timestamp: new Date(),
      };

      ticket.comments.push(comment);
      // Auto transition to in_progress if open
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
      await ticket.save();

      return ApiResponse.success(res, ticket, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tickets/staff/list
   * Get list of admin staff who can be assigned tickets
   */
  async getStaffList(req, res, next) {
    try {
      const staff = await Admin.find({ active: true }).select('name email role').lean();
      return ApiResponse.success(res, staff, 'Admin staff list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new TicketController();
