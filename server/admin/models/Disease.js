import mongoose from 'mongoose';

const DiseaseSchema = new mongoose.Schema(
  {
    diseaseName: {
      type: String,
      required: [true, 'Disease name is required'],
      trim: true,
      index: true,
    },
    crop: {
      type: String,
      required: [true, 'Associated crop is required'],
      trim: true,
      index: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Symptoms description is required'],
      trim: true,
    },
    causes: {
      type: [String],
      default: [],
    },
    prevention: {
      type: [String],
      default: [],
    },
    treatment: {
      type: [String],
      default: [],
    },
    recommendedPesticide: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid severity level',
      },
      default: 'Medium',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Disease', DiseaseSchema);
