import express from 'express';
import { upload, uploadImage, deleteImage } from '../services/cloudinary.js';
import {
  createEvent,
  getEventById,
  listEvents,
  updateEvent,
  deleteEvent
} from '../models/eventModel.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * GET /api/events - List all events
 */
router.get('/events', async (req, res, next) => {
  try {
    const filters = {
      q: req.query.q
    };
    const events = await listEvents(filters);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/events/:id', async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events - Create a new event (Admin only)
 */
router.post('/events', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, date, location } = req.body;

    // Validate required fields
    if (!title || !description || !date || !location) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, date, location'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer, 'events');

    // Create event record
    const event = await createEvent({
      title,
      description,
      date,
      location,
      imageUrl: uploadResult.url,
      imagePublicId: uploadResult.publicId
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/events/:id - Update an event (Admin only)
 */
router.put('/events/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, date, location } = req.body;
    const eventId = req.params.id;

    // Check if event exists
    const existingEvent = await getEventById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updateData = {
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      date: date || existingEvent.date,
      location: location || existingEvent.location
    };

    // If new image is uploaded, replace the old one
    if (req.file) {
      // Delete old image from Cloudinary
      if (existingEvent.image_public_id) {
        try {
          await deleteImage(existingEvent.image_public_id);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const uploadResult = await uploadImage(req.file.buffer, 'events');
      updateData.image_url = uploadResult.url;
      updateData.image_public_id = uploadResult.publicId;
    }

    // Update event
    const updatedEvent = await updateEvent(eventId, updateData);
    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/events/:id - Delete an event (Admin only)
 */
router.delete('/events/:id', requireAdmin, async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Get event to retrieve image public ID
    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete image from Cloudinary
    if (event.image_public_id) {
      try {
        await deleteImage(event.image_public_id);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
      }
    }

    // Delete event from database
    await deleteEvent(eventId);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
