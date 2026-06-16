import z from "zod";

// ── UTILITAIRE ────────────────────────────────────────────────────────────────

export async function parseIntFromParams(id: unknown) {
  return await z.coerce.number().int().min(1).parseAsync(id);
}

function requireAtLeastOneField(parsed: object) {
  if (Object.keys(parsed).length === 0) {
    throw new z.ZodError([
      { code: "custom", path: [], message: "Au moins un champ doit être fourni pour la mise à jour" },
    ]);
  }
}

// ── LEVELS ───────────────────────────────────────────────────────────────────

const levelBodySchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide").max(100, "Le nom ne peut pas dépasser 100 caractères").trim(),
}).strict();

const levelPatchSchema = levelBodySchema.partial();

export async function parseLevelBody(response: unknown) {
  return await levelBodySchema.parseAsync(response);
}

export async function parseLevelPatchBody(response: unknown) {
  const parsed = await levelPatchSchema.parseAsync(response);
  requireAtLeastOneField(parsed);
  return parsed;
}

// ── TAGS ─────────────────────────────────────────────────────────────────────

const tagBodySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  parent_id: z.number().int().min(1).optional(),
}).strict();

const tagPatchSchema = tagBodySchema.partial();

export async function parseTagBody(body: unknown) {
  return await tagBodySchema.parseAsync(body);
}

export async function parseTagPatchBody(body: unknown) {
  const parsed = await tagPatchSchema.parseAsync(body);
  requireAtLeastOneField(parsed);
  return parsed;
}

// ── QUIZ ─────────────────────────────────────────────────────────────────────

const quizBodySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().trim().optional(),
}).strict();

const quizPatchSchema = quizBodySchema.partial();

export async function parseQuizBody(body: unknown) {
  return await quizBodySchema.parseAsync(body);
}

export async function parseQuizPatchBody(body: unknown) {
  const parsed = await quizPatchSchema.parseAsync(body);
  requireAtLeastOneField(parsed);
  return parsed;
}

// ── QUESTION ─────────────────────────────────────────────────────────────────

const questionBodySchema = z.object({
  statement: z.string().min(1).trim(),
  anecdote: z.string().trim().optional(),
  link: z.string().url().optional(),
  level_id: z.number().int().min(1),
}).strict();

const questionPatchSchema = questionBodySchema.partial();

export async function parseQuestionBody(body: unknown) {
  return await questionBodySchema.parseAsync(body);
}

export async function parseQuestionPatchBody(body: unknown) {
  const parsed = await questionPatchSchema.parseAsync(body);
  requireAtLeastOneField(parsed);
  return parsed;
}

// ── ANSWER ───────────────────────────────────────────────────────────────────

const answerBodySchema = z.object({
  description: z.string().min(1).trim(),
  is_valid: z.boolean(),
}).strict();

const answerPatchSchema = answerBodySchema.partial();

export async function parseAnswerBody(body: unknown) {
  return await answerBodySchema.parseAsync(body);
}

export async function parseAnswerPatchBody(body: unknown) {
  const parsed = await answerPatchSchema.parseAsync(body);
  requireAtLeastOneField(parsed);
  return parsed;
}

// ── ATTEMPT ──────────────────────────────────────────────────────────────────

export async function parseAttemptBody(body: unknown) {
  return await z.array(
    z.object({
      question_id: z.number().int().min(1),
      answer_id: z.number().int().min(1),
    })
  ).min(1).parseAsync(body);
}
