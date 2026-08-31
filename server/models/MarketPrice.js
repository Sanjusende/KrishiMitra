import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      index: true,
    },
    market: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      index: true,
    },
    district: {
      type: String,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'Quintal',
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    trend: {
      type: String,
      enum: ['Rising', 'Falling', 'Stable'],
      default: 'Stable',
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: 'agmarknet',
    },
  },
  {
    timestamps: true,
  }
);

marketPriceSchema.index({ crop: 1, date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema, 'marketprices');

export default MarketPrice;
