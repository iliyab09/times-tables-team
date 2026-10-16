// quiz.js — pure logic, no DOM. Contract: see TEAM.md.

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const QUESTIONS_PER_QUIZ = 10;
export const STORAGE_KEY = 'ttq-best-scores'; // JSON {"7": 8, "3": 10}

// Fisher–Yates shuffle (returns a new array).
function shuffle(items, random = Math.random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeQuestions(table, random = Math.random) {
  const multipliers = Array.from({ length: QUESTIONS_PER_QUIZ }, (_, i) => i + 1);
  return shuffle(multipliers, random).map((b) => ({ a: table, b, answer: table * b }));
}

// Digits only (leading zeros allowed, surrounding spaces ignored); anything else is wrong.
export function isCorrect(question, typedString) {
  const s = String(typedString ?? '').trim();
  if (!/^\d+$/.test(s)) return false;
  return Number(s) === question.answer;
}

// Storage is anything with getItem/setItem (localStorage or a test stub).
// Missing, corrupt or blocked storage behaves like "no scores yet".
function readAll(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function validScore(v) {
  return Number.isInteger(v) && v >= 0 && v <= QUESTIONS_PER_QUIZ;
}

export function getAllBest(storage = globalThis.localStorage) {
  const all = readAll(storage);
  const out = {};
  for (const t of TABLES) {
    if (validScore(all[t])) out[t] = all[t];
  }
  return out;
}

export function getBest(table, storage = globalThis.localStorage) {
  return getAllBest(storage)[table] ?? null;
}

export function saveBest(table, score, storage = globalThis.localStorage) {
  const all = getAllBest(storage);
  const prev = all[table] ?? null;
  if (!validScore(score) || (prev !== null && score <= prev)) return prev;
  all[table] = score;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked (e.g. private mode): keep playing, just don't persist.
  }
  return score;
}

export function resultMessage(score) {
  const total = QUESTIONS_PER_QUIZ;
  let cheer;
  if (score === total) cheer = 'Perfect score — amazing!';
  else if (score >= 8) cheer = 'Great job!';
  else if (score >= 5) cheer = 'Nice work — keep practising!';
  else cheer = 'Good try — practice makes perfect!';
  return `You got ${score} out of ${total}! ${cheer}`;
}
