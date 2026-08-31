import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: {
        values: ['weather', 'disease', 'market', 'scheme'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
    },
    targetType: {
      type: String,
      enum: {
        values: ['all', 'state', 'district', 'crop'],
        message: '{VALUE} is not a valid target type',
      },
      required: [true, 'Target type is required'],
    },
    targetValue: {
      type: String,
      trim: true,
      default: '',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Registering as AdminNotification to prevent collision with the existing farmer Notification model
export default mongoose.model('AdminNotification', NotificationSchema);
