import PastQuestion from './schemas/PastQuestion.js';

export async function createPastQuestion(data) {
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

export async function getPastQuestionById(id) {
  return await PastQuestion.findById(id);
}

export async function listPastQuestions(filters) {
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

  const limit = Number(filters.limit || 20);
  const offset = Number(filters.offset || 0);

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
