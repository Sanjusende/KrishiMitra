import mongoose from 'mongoose';

const communityReportSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      index: true,
    },
    possibleIssue: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    reportCount: {
      type: Number,
      default: 1,
    },
    nearbyDistanceKm: {
      type: Number,
      default: 2.4,
    },
    lastReportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

communityReportSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const CommunityReport = mongoose.model('CommunityReport', communityReportSchema, 'communityreports');

export default CommunityReport;
