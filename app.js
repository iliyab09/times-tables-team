import {
  TABLES,
  QUESTIONS_PER_QUIZ,
  makeQuestions,
  isCorrect,
  getBest,
  getAllBest,
  saveBest,
  resultMessage,
} from './quiz.js';

const FEEDBACK_MS = 1000;
const MAX_DIGITS = 3;

const $ = (id) => document.getElementById(id);
const screens = { home: $('home'), quiz: $('quiz'), result: $('result') };

let table = null;
let questions = [];
let index = 0;
let score = 0;
let typed = '';
let locked = false;

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function renderHome() {
  const best = getAllBest();
  const list = $('tables');
  list.replaceChildren();
  for (const t of TABLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'table-btn';
    const label = document.createElement('span');
    label.textContent = `× ${t}`;
    const sub = document.createElement('span');
    sub.className = 'best';
    sub.textContent = best[t] != null ? `Best ${best[t]}/${QUESTIONS_PER_QUIZ}` : '—';
    btn.append(label, sub);
    btn.addEventListener('click', () => startQuiz(t));
    list.append(btn);
  }
  show('home');
}

function startQuiz(t) {
  table = t;
  questions = makeQuestions(t);
  index = 0;
  score = 0;
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = questions[index];
  typed = '';
  locked = false;
  setKeypadDisabled(false);
  $('progress').textContent = `Question ${index + 1} of ${questions.length}`;
  $('question').textContent = `${q.a} × ${q.b} = ?`;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  renderTyped();
}

function renderTyped() {
  $('answer').textContent = typed;
}

function setKeypadDisabled(disabled) {
  for (const b of $('keypad').querySelectorAll('button')) b.disabled = disabled;
}

function press(key) {
  if (locked) return;
  if (key === 'back') {
    typed = typed.slice(0, -1);
  } else if (key === 'ok') {
    submit();
    return;
  } else if (/^[0-9]$/.test(key) && typed.length < MAX_DIGITS) {
    typed = typed === '0' ? key : typed + key;
  }
  renderTyped();
}

function submit() {
  if (typed === '') return;
  const q = questions[index];
  locked = true;
  setKeypadDisabled(true);
  const fb = $('feedback');
  if (isCorrect(q, typed)) {
    score++;
    fb.textContent = `Yes! ${q.answer} ✓`;
    fb.className = 'feedback good';
  } else {
    fb.textContent = `Not quite — ${q.a} × ${q.b} = ${q.answer}`;
    fb.className = 'feedback bad';
  }
  setTimeout(next, FEEDBACK_MS);
}

function next() {
  index++;
  if (index < questions.length) renderQuestion();
  else finish();
}

function finish() {
  const before = getBest(table);
  saveBest(table, score);
  $('result-message').textContent = resultMessage(score);
  $('new-best').hidden = !(score > (before ?? 0));
  show('result');
  $('play-again').focus();
}

$('keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-key]');
  if (btn) press(btn.dataset.key);
});

document.addEventListener('keydown', (e) => {
  if (screens.quiz.hidden) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') press('back');
  else if (e.key === 'Enter') press('ok');
  else return;
  e.preventDefault();
});

$('play-again').addEventListener('click', () => startQuiz(table));
$('go-home').addEventListener('click', renderHome);

renderHome();
