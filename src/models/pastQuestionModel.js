import crypto from 'crypto';
import mongoose from 'mongoose';
import PastQuestion from './schemas/PastQuestion.js';

const memoryPastQuestions = [];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

export async function createPastQuestion(data) {
  if (isMongoConnected()) {
    const pastQuestion = new PastQuestion({
      title: data.title,
      subject: data.subject,
      class_name: data.className,
      year: data.year,
      file_key: data.fileKey,
      file_name: data.fileName,
      mime_type: data.mimeType,
      size: data.size,
    });

    await pastQuestion.save();
    return pastQuestion;
  }

  const now = new Date();
  const pastQuestion = {
    _id: crypto.randomUUID(),
    title: data.title,
    subject: data.subject,
    class_name: data.className,
    year: data.year,
    file_key: data.fileKey,
    file_name: data.fileName,
    mime_type: data.mimeType,
    size: data.size,
    created_at: now,
    updated_at: now,
  };

  memoryPastQuestions.push(pastQuestion);
  return pastQuestion;
}

export async function getPastQuestionById(id) {
  if (isMongoConnected()) {
    return await PastQuestion.findById(id);
  }

  return memoryPastQuestions.find((item) => item._id === id) || null;
}

export async function listPastQuestions(filters) {
  const limit = Number(filters.limit || 20);
  const offset = Number(filters.offset || 0);

  if (isMongoConnected()) {
    const query = {};

    // Text search
    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    // Exact match filters
    if (filters.year) {
      query.year = String(filters.year);
    }

    if (filters.subject) {
      query.subject = new RegExp(filters.subject, 'i');
    }

    if (filters.className) {
      query.class_name = new RegExp(filters.className, 'i');
    }

    const [items, total] = await Promise.all([
      PastQuestion.find(query)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      PastQuestion.countDocuments(query),
    ]);

    return { items, total };
  }

  let items = memoryPastQuestions.slice();

  if (filters.q) {
    const queryText = normalizeText(filters.q);
    items = items.filter((item) => {
      const haystack = [
        item.title,
        item.subject,
        item.year,
        item.class_name,
      ]
        .map(normalizeText)
        .join(' ');
      return haystack.includes(queryText);
    });
  }

  if (filters.year) {
    items = items.filter((item) => normalizeText(item.year) === normalizeText(filters.year));
  }

  if (filters.subject) {
    const subject = normalizeText(filters.subject);
    items = items.filter((item) => normalizeText(item.subject).includes(subject));
  }

  if (filters.className) {
    const className = normalizeText(filters.className);
    items = items.filter((item) => normalizeText(item.class_name).includes(className));
  }

  items = items
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = items.length;
  items = items.slice(offset, offset + limit);

  return { items, total };
}
