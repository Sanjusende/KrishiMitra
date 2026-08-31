import mongoose from 'mongoose';

const { Schema } = mongoose;

const cropHealthSchema = new Schema(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    possibleIssue: {
      type: String,
      required: true,
    },

    confidence: {
      type: String,
      default: 'Moderate',
    },

    whatToCheck: {
      type: String,
      required: true,
    },

    nextAction: {
      type: String,
      required: true,
    },

    crop: {
      type: String,
    },

    health: {
      type: String,
    },

    disease: {
      type: String,
    },

    severity: {
      type: String,
    },

    affectedArea: {
      type: String,
    },

    causes: {
      type: [String],
      default: [],
    },

    treatment: {
      type: [String],
      default: [],
    },

    prevention: {
      type: [String],
      default: [],
    },

    fertilizerRecommendation: {
      type: String,
    },

    irrigationRecommendation: {
      type: String,
    },

    analysisTime: {
      type: String,
    },

    location: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },

    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

cropHealthSchema.index({
  farmId: 1,
  reportedAt: -1,
});

const CropHealth = mongoose.model('CropHealth', cropHealthSchema, 'crophealths');

export default CropHealth;
