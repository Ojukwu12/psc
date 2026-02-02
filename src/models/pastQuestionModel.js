import { getDb } from "../config/db.js";

function matchesText(value, query) {
  if (!value) {
    return false;
  }
  return String(value).toLowerCase().includes(query);
}

function nextId(items) {
  if (!items.length) {
    return 1;
  }
  return Math.max(...items.map((item) => item.id)) + 1;
}

export async function createPastQuestion(data) {
  const db = await getDb();
  const createdAt = new Date().toISOString();
  const record = {
    id: nextId(db.data.past_questions),
    title: data.title,
    subject: data.subject,
    class_name: data.className,
    year: data.year,
    file_key: data.fileKey,
    file_name: data.fileName,
    mime_type: data.mimeType,
    size: data.size,
    created_at: createdAt,
  };

  db.data.past_questions.push(record);
  await db.write();
  return record;
}

export async function getPastQuestionById(id) {
  const db = await getDb();
  const numericId = Number(id);
  return db.data.past_questions.find((item) => item.id === numericId);
}

export async function listPastQuestions(filters) {
  const db = await getDb();
  const query = filters.q ? String(filters.q).toLowerCase() : "";
  const year = filters.year ? String(filters.year) : null;
  const subject = filters.subject ? String(filters.subject).toLowerCase() : null;
  const className = filters.className ? String(filters.className).toLowerCase() : null;

  let items = db.data.past_questions;

  if (query) {
    items = items.filter(
      (item) =>
        matchesText(item.title, query) ||
        matchesText(item.subject, query) ||
        matchesText(item.class_name, query) ||
        matchesText(item.year, query)
    );
  }

  if (year) {
    items = items.filter((item) => String(item.year) === year);
  }

  if (subject) {
    items = items.filter((item) => String(item.subject || "").toLowerCase() === subject);
  }

  if (className) {
    items = items.filter((item) => String(item.class_name || "").toLowerCase() === className);
  }

  items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const limit = Number(filters.limit || 20);
  const offset = Number(filters.offset || 0);
  const paged = items.slice(offset, offset + limit);

  return { items: paged, total: items.length };
}
