import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['FARMER', 'AGRONOMIST', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'FARMER',
    },
    language: {
      type: String,
      enum: {
        values: ['EN', 'HI', 'MR', 'TE', 'TA', 'KN', 'BN', 'PA'],
        message: '{VALUE} is not a valid language code',
      },
      default: 'EN',
    },
    avatar: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', UserSchema, 'users');
