import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: 'My Farm',
      trim: true,
    },
    location: {
      display: {
        type: String,
        required: true,
        trim: true,
      },
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      state: String,
      district: String,
      village: String,
    },
    landSize: {
      value: {
        type: Number,
        required: true,
        min: 0.1,
      },
      unit: {
        type: String,
        enum: ['acres', 'hectares', 'bigha'],
        default: 'acres',
      },
    },
    soilType: {
      type: String,
      enum: [
        'Black Soil',
        'Red Soil',
        'Alluvial Soil',
        'Clay Soil',
        'Sandy Soil',
        'Loamy Soil',
        'Unknown/Not sure',
      ],
      default: 'Unknown/Not sure',
    },
    currentCrop: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    plannedCrop: {
      type: String,
      trim: true,
    },
    growthStage: {
      type: String,
      enum: [
        'Initial / Germination',
        'Vegetative',
        'Flowering',
        'Yield Formation / Fruiting',
        'Ripening / Harvesting',
      ],
      default: 'Vegetative',
    },
    season: {
      type: String,
      enum: ['Kharif', 'Rabi', 'Zaid'],
      default: 'Kharif',
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location-based spatial queries (community alerts, weather proximity)
farmSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Farm = mongoose.model('Farm', farmSchema, 'farms');

export default Farm;
