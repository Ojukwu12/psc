import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    image_public_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'events',
  }
);

// Create indexes for better query performance
eventSchema.index({ date: -1 });
eventSchema.index({ title: 'text', description: 'text', location: 'text' });

const Event = mongoose.model('Event', eventSchema);

export default Event;
