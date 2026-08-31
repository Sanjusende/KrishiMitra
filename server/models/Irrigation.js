import mongoose from 'mongoose';

const irrigationSchema = new mongoose.Schema(
  {
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    decision: {
      type: String,
      enum: ['IRRIGATE', 'DONT_IRRIGATE', 'NEED_MORE_INFO'],
      required: true,
    },
    reasoning: {
      rainProbability: Number,
      expectedRainfallMm: Number,
      cropWaterNeedMm: Number,
      thresholdsUsed: mongoose.Schema.Types.Mixed,
      summaryText: String,
      actionableAdvice: String,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9,
    },
  },
  {
    timestamps: true,
  }
);

irrigationSchema.index({ farmId: 1, date: -1 });

const Irrigation = mongoose.model('Irrigation', irrigationSchema, 'irrigations');

export default Irrigation;
