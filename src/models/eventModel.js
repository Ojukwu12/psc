import crypto from 'crypto';
import mongoose from 'mongoose';
import Event from './schemas/Event.js';

const memoryEvents = [];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

/**
 * Create a new event
 * @param {Object} data - Event data
 * @param {string} data.title - Event title
 * @param {string} data.description - Event description
 * @param {string} data.date - Event date
 * @param {string} data.location - Event location
 * @param {string} data.imageUrl - Cloudinary image URL
 * @param {string} data.imagePublicId - Cloudinary public ID for deletion
 * @returns {Promise<Object>} Created event
 */
export async function createEvent(data) {
  if (isMongoConnected()) {
    const event = new Event({
      title: data.title,
      description: data.description,
      date: data.date,
      location: data.location,
      image_url: data.imageUrl,
      image_public_id: data.imagePublicId,
    });

    await event.save();
    return event;
  }

  const now = new Date();
  const event = {
    _id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    date: data.date ? new Date(data.date) : now,
    location: data.location,
    image_url: data.imageUrl,
    image_public_id: data.imagePublicId,
    created_at: now,
    updated_at: now,
  };

  memoryEvents.push(event);
  return event;
}

/**
 * Get event by ID
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>}
 */
export async function getEventById(id) {
  if (isMongoConnected()) {
    return await Event.findById(id);
  }

  return memoryEvents.find((item) => item._id === id) || null;
}

/**
 * List all events
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function listEvents(filters = {}) {
  if (isMongoConnected()) {
    const query = {};

    // Text search
    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    // Sort by date (most recent first)
    const events = await Event.find(query)
      .sort({ date: -1 })
      .lean();

    return events;
  }

  let events = memoryEvents.slice();

  if (filters.q) {
    const queryText = normalizeText(filters.q);
    events = events.filter((event) => {
      const haystack = [event.title, event.description, event.location]
        .map(normalizeText)
        .join(' ');
      return haystack.includes(queryText);
    });
  }

  events = events
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return events;
}

/**
 * Update an event
 * @param {string} id - Event ID
 * @param {Object} data - Updated event data
 * @returns {Promise<Object|null>}
 */
export async function updateEvent(id, data) {
  if (isMongoConnected()) {
    const event = await Event.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    return event;
  }

  const index = memoryEvents.findIndex((item) => item._id === id);
  if (index === -1) {
    return null;
  }

  const current = memoryEvents[index];
  const updated = {
    ...current,
    ...data,
    date: data.date ? new Date(data.date) : current.date,
    updated_at: new Date(),
  };

  memoryEvents[index] = updated;
  return updated;
}

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>} Deleted event or null
 */
export async function deleteEvent(id) {
  if (isMongoConnected()) {
    return await Event.findByIdAndDelete(id);
  }

  const index = memoryEvents.findIndex((item) => item._id === id);
  if (index === -1) {
    return null;
  }

  const [removed] = memoryEvents.splice(index, 1);
  return removed;
}
