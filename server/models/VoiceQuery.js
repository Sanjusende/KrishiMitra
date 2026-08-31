import mongoose from 'mongoose';

// ------------------------------------------------------
// Constants
// ------------------------------------------------------

const SUPPORTED_LANGUAGES = [
  'en',
  'en-IN',
  'en-US',
  'en-GB',
  'hi',
  'hi-IN',
  'mr',
  'mr-IN',
  'gu',
  'gu-IN',
  'pa',
  'pa-IN',
  'ta',
  'ta-IN',
  'te',
  'te-IN',
  'bn',
  'bn-IN',
  'kn',
  'kn-IN',
  'ml',
  'ml-IN',
  'en-in',
  'en-us',
  'en-gb',
  'hi-in',
  'mr-in',
  'gu-in',
  'pa-in',
  'ta-in',
  'te-in',
  'bn-in',
  'kn-in',
  'ml-in',
];

export const normalizeLanguage = (languageStr) => {
  if (!languageStr) return 'en-US';
  const lang = String(languageStr).trim().toLowerCase();

  if (lang === 'en-us') return 'en-US';
  if (lang === 'en-gb') return 'en-GB';
  if (lang === 'en-in') return 'en-IN';
  if (lang.startsWith('en')) return 'en-US';

  if (lang === 'hi-in') return 'hi-IN';
  if (lang.startsWith('hi')) return 'hi-IN';

  if (lang === 'mr-in') return 'mr-IN';
  if (lang.startsWith('mr')) return 'mr-IN';

  if (lang === 'gu-in') return 'gu-IN';
  if (lang.startsWith('gu')) return 'gu-IN';

  if (lang === 'pa-in') return 'pa-IN';
  if (lang.startsWith('pa') || lang.startsWith('pb')) return 'pa-IN';

  if (lang === 'ta-in') return 'ta-IN';
  if (lang.startsWith('ta')) return 'ta-IN';

  if (lang === 'te-in') return 'te-IN';
  if (lang.startsWith('te')) return 'te-IN';

  if (lang === 'bn-in') return 'bn-IN';
  if (lang.startsWith('bn')) return 'bn-IN';

  if (lang === 'kn-in') return 'kn-IN';
  if (lang.startsWith('kn')) return 'kn-IN';

  if (lang === 'ml-in') return 'ml-IN';
  if (lang.startsWith('ml')) return 'ml-IN';

  console.warn(
    `[VoiceAssistant] Unsupported language code received: "${languageStr}". Falling back to "en-US".`
  );
  return 'en-US';
};

const MAX_QUERY_LENGTH = 500;
const MAX_RESPONSE_LENGTH = 5000;

// ------------------------------------------------------
// Voice Query Schema
// ------------------------------------------------------

const voiceQuerySchema = new mongoose.Schema(
  {
    // ------------------------------------------
    // User Reference
    // ------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // ------------------------------------------
    // Farm Reference
    // ------------------------------------------

    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
    },

    // ------------------------------------------
    // User Voice/Text Query
    // ------------------------------------------

    query: {
      type: String,
      required: [true, 'Voice query is required'],
      trim: true,
      minlength: [1, 'Query cannot be empty'],
      maxlength: [MAX_QUERY_LENGTH, `Query cannot exceed ${MAX_QUERY_LENGTH} characters`],
    },

    // ------------------------------------------
    // Query Language
    // ------------------------------------------

    language: {
      type: String,
      trim: true,
      set: normalizeLanguage,
      default: 'hi-IN',
      enum: {
        values: SUPPORTED_LANGUAGES,
        message: 'Unsupported voice assistant language',
      },
    },

    // ------------------------------------------
    // Assistant Response
    // ------------------------------------------

    responseText: {
      type: String,
      required: [true, 'Response text is required'],
      trim: true,
      maxlength: [MAX_RESPONSE_LENGTH, `Response cannot exceed ${MAX_RESPONSE_LENGTH} characters`],
    },

    // ------------------------------------------
    // Farm/Weather/Market Context Snapshot
    // ------------------------------------------

    contextSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
    versionKey: false,
  }
);

// ------------------------------------------------------
// Indexes
// ------------------------------------------------------
//
// Optimizes:
//
// VoiceQuery.find({ userId })
//   .sort({ createdAt: -1 })
//   .limit(15)
//

voiceQuerySchema.index({
  userId: 1,
  createdAt: -1,
});

// ------------------------------------------------------
// Farm-specific Voice History
// ------------------------------------------------------
//
// Useful for future queries like:
//
// VoiceQuery.find({
//   userId,
//   farmId,
// }).sort({ createdAt: -1 })
//

voiceQuerySchema.index({
  userId: 1,
  farmId: 1,
  createdAt: -1,
});

// ------------------------------------------------------
// Model
// ------------------------------------------------------

const VoiceQuery = mongoose.model('VoiceQuery', voiceQuerySchema, 'voicequeries');

export default VoiceQuery;
