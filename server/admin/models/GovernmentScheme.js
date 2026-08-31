import mongoose from 'mongoose';

const GovernmentSchemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    eligibility: {
      type: String,
      required: [true, 'Eligibility criteria are required'],
      trim: true,
    },
    benefits: {
      type: String,
      required: [true, 'Benefits details are required'],
      trim: true,
    },
    applyLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('GovernmentScheme', GovernmentSchemeSchema);
