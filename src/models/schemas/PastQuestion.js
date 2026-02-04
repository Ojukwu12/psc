import mongoose from 'mongoose';

const pastQuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    class_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    file_key: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'past_questions',
  }
);

// Create indexes for better query performance
pastQuestionSchema.index({ subject: 1, class_name: 1, year: 1 });
pastQuestionSchema.index({ title: 'text', subject: 'text' });

const PastQuestion = mongoose.model('PastQuestion', pastQuestionSchema);

export default PastQuestion;
