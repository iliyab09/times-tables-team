import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TABLES, QUESTIONS_PER_QUIZ, STORAGE_KEY,
  makeQuestions, isCorrect, getBest, getAllBest, saveBest, resultMessage,
} from './quiz.js';

// Tiny in-memory stand-in for localStorage.
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('constants', () => {
  assert.deepEqual(TABLES, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(QUESTIONS_PER_QUIZ, 10);
  assert.equal(STORAGE_KEY, 'ttq-best-scores');
});

test('makeQuestions: every multiplier 1..10 exactly once, correct answers', () => {
  for (const table of TABLES) {
    const qs = makeQuestions(table);
    assert.equal(qs.length, 10);
    assert.deepEqual(qs.map((q) => q.b).sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const q of qs) {
      assert.equal(q.a, table);
      assert.equal(q.answer, table * q.b);
    }
  }
});

test('makeQuestions: is shuffled', () => {
  const orders = new Set(Array.from({ length: 20 }, () => makeQuestions(7).map((q) => q.b).join()));
  assert.ok(orders.size > 1, 'expected different orders across 20 runs');
});

test('isCorrect', () => {
  const q = { a: 7, b: 4, answer: 28 };
  assert.equal(isCorrect(q, '28'), true);
  assert.equal(isCorrect(q, '028'), true); // leading zeros are fine
  assert.equal(isCorrect(q, ' 28 '), true);
  assert.equal(isCorrect(q, '27'), false);
  assert.equal(isCorrect(q, ''), false);
  assert.equal(isCorrect(q, 'abc'), false);
  assert.equal(isCorrect(q, '2 8'), false);
  assert.equal(isCorrect(q, '28.0'), false);
  assert.equal(isCorrect(q, '-28'), false);
  assert.equal(isCorrect(q, undefined), false);
  assert.equal(isCorrect({ a: 1, b: 0, answer: 0 }, '0'), true);
  assert.equal(isCorrect({ a: 1, b: 0, answer: 0 }, ''), false);
});

test('getBest is null when unknown; getAllBest empty', () => {
  const s = memoryStorage();
  assert.equal(getBest(7, s), null);
  assert.deepEqual(getAllBest(s), {});
});

test('saveBest only raises and returns the stored best', () => {
  const s = memoryStorage();
  assert.equal(saveBest(7, 6, s), 6);
  assert.equal(saveBest(7, 4, s), 6);
  assert.equal(getBest(7, s), 6);
  assert.equal(saveBest(7, 9, s), 9);
  assert.equal(getBest(7, s), 9);
  assert.equal(saveBest(3, 0, s), 0);
  assert.equal(getBest(3, s), 0);
  assert.deepEqual(getAllBest(s), { 3: 0, 7: 9 });
  assert.deepEqual(JSON.parse(s.getItem(STORAGE_KEY)), { 3: 0, 7: 9 });
});

test('corrupt or blocked storage behaves like no scores', () => {
  assert.equal(getBest(7, memoryStorage({ [STORAGE_KEY]: 'not json' })), null);
  assert.equal(getBest(7, memoryStorage({ [STORAGE_KEY]: '{"7":"lots"}' })), null);
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(getBest(7, blocked), null);
  assert.equal(saveBest(7, 5, blocked), 5);
});

test('resultMessage', () => {
  assert.match(resultMessage(8), /^You got 8 out of 10!/);
  assert.match(resultMessage(10), /^You got 10 out of 10!/);
  assert.match(resultMessage(0), /^You got 0 out of 10!/);
});
