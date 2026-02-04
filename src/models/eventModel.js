import Event from './schemas/Event.js';

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

/**
 * Get event by ID
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>}
 */
export async function getEventById(id) {
  return await Event.findById(id);
}

/**
 * List all events
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function listEvents(filters = {}) {
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

/**
 * Update an event
 * @param {string} id - Event ID
 * @param {Object} data - Updated event data
 * @returns {Promise<Object|null>}
 */
export async function updateEvent(id, data) {
  const event = await Event.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );

  return event;
}

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>} Deleted event or null
 */
export async function deleteEvent(id) {
  return await Event.findByIdAndDelete(id);
}
