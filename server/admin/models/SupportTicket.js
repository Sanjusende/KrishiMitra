import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const SupportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer (User) ID is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ['weather', 'irrigation', 'crop_health', 'market', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in_progress', 'resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('SupportTicket', SupportTicketSchema);
