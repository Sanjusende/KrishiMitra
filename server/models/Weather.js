import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema(
  {
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      index: true,
    },
    latitude: {
      type: Number,
      index: true,
    },
    longitude: {
      type: Number,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    windSpeed: {
      type: Number,
      default: 0,
    },
    rainProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rainfallMm: {
      type: Number,
      required: true,
      min: 0,
    },
    weatherCondition: {
      type: String,
      default: 'Clear',
    },
    uvIndex: {
      type: Number,
      default: 0,
    },
    airQuality: {
      type: String,
      default: 'Good',
    },
    sunrise: {
      type: String,
      default: '',
    },
    sunset: {
      type: String,
      default: '',
    },
    hourly: [
      {
        time: String,
        temp: Number,
        humidity: Number,
        rainProb: Number,
      },
    ],
    alerts: [
      {
        event: String,
        senderName: String,
        start: String,
        end: String,
        description: String,
      },
    ],
    forecast: [
      {
        date: String,
        tempMax: Number,
        tempMin: Number,
        rainProbability: Number,
        rainfallMm: Number,
        condition: String,
      },
    ],
    source: {
      type: String,
      default: 'open-meteo',
    },
  },
  {
    timestamps: true,
  }
);

weatherSchema.index({ latitude: 1, longitude: 1, fetchedAt: -1 });

const Weather = mongoose.model('Weather', weatherSchema, 'weathers');

export default Weather;
