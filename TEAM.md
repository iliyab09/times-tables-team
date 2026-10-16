# Times Table Quiz — TEAM.md

Read this first. Director owns this file; change it only via the Director.

## Goal (the whole scope — nothing more)
A tiny phone-first web app for kids 7–10 to practise one multiplication table at a time.
1. **Home**: pick a table 1–10. Each table button shows its best score (e.g. "Best 8/10", or "—" if never played).
2. **Quiz**: 10 questions from that table (`table × 1..10`, each multiplier once, shuffled). Big on-screen number keypad (0–9, ⌫, ✓). Instant friendly feedback: correct → short praise; wrong → show the right answer. After 10: "You got 8 out of 10!" + **Play again** (same table) + a Home link. Best score per table saved in localStorage.

Rules: no accounts, no backend, no tracking, no analytics, no external requests. Deploy to GitHub Pages. **No extra features.** Ship when the two screens work.

## Stack (decided, don't relitigate)
- Plain static site: `index.html`, `style.css`, `app.js`, `quiz.js` (ES modules, no framework, no bundler, no npm deps). Works when served from a sub-path (`/times-tables-team/`) — use relative URLs only.
- Tests: Node built-in test runner (`node --test`), file `quiz.test.js`. Node 20+. No package.json needed except a minimal one with `"type": "module"` and `"test": "node --test"`.
- CI: `.github/workflows/ci.yml` — on PR and push to main: fail on conflict markers (`! git grep -nE '^(<<<<<<<|>>>>>>>)( |$)'`), run `npm test`. On push to main also deploy the repo root to GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`).
- Live URL will be `https://iliyab09.github.io/times-tables-team/`.

## Team and file ownership
| Agent | Role | Owns (only they edit these) |
|---|---|---|
| Ava | UI builder | `index.html`, `style.css`, `app.js` |
| Ben | Logic + deploy builder | `quiz.js`, `quiz.test.js`, `package.json`, `.github/**`, GitHub Pages settings |
| Quinn | Reviewer / QA | reviews every PR; owns nothing in the app. May add `tests/` e2e helpers if useful. |
| Director | | `TEAM.md`, `README.md` |

If you need a change in someone else's file, message them (or the Director); don't edit it.

## Shared contract: `quiz.js` (Ben produces, Ava consumes)
```js
// quiz.js — pure logic, no DOM.
export const TABLES = [1,2,3,4,5,6,7,8,9,10];
export const QUESTIONS_PER_QUIZ = 10;
export const STORAGE_KEY = 'ttq-best-scores';          // localStorage key, JSON {"7": 8, "3": 10}

export function makeQuestions(table)                    // -> [{ a: table, b: 1..10, answer: a*b }] length 10,
                                                        //    every b from 1..10 exactly once, shuffled
export function isCorrect(question, typedString)        // -> boolean; "" or non-numeric -> false
export function getBest(table, storage = localStorage)  // -> number | null
export function getAllBest(storage = localStorage)      // -> { [table:number]: number }
export function saveBest(table, score, storage = localStorage) // -> number (the stored best after save; only raises)
export function resultMessage(score)                    // -> "You got 8 out of 10!" (+ a short friendly line, optional)
```
Ava codes against this contract from minute one. Ben's first PR is `quiz.js` + tests, opened within ~5 turns so Ava can merge main early.

## UI spec (Ava)
- Phone-first (360px wide is the design target), big tap targets (min 56px), large type, one accent colour, high contrast. Scales fine to desktop (center a max-width ~480px column).
- Home: title, 10 big buttons "× 7" with best score beneath each. Tap → quiz.
- Quiz: progress "Question 3 of 10", the question "7 × 4 = ?" huge, the typed answer shown, keypad 0–9 / ⌫ / ✓. Enter is not required but ✓ submits; empty answer does nothing. Feedback shown ~1s (correct: "Yes! 28 ✓", wrong: "Not quite — 7 × 4 = 28") then next question. Keyboard typing also works (digits, Backspace, Enter).
- Result: "You got 8 out of 10!", shows "New best!" if improved, buttons **Play again** and **Home**.
- Routing: simple in-page state (no router, no hash needed). Back button is not required.

## Workflow
- Branch per task: `git checkout -b <name>/<topic>`; push; `gh pr create --base main`. Send PR link to Quinn. Quinn comments "APPROVED" or "CHANGES REQUESTED" (with repro). Owner merges with `gh pr merge <n> --squash` (never `--delete-branch`).
- Keep PRs small. Fix bugs in their own tiny PRs.
- Merge as its own step; check `git diff --name-only --diff-filter=U` is empty before committing.
- Testing level is LIGHT: CI is the baseline; Quinn play-tests at phone width only PRs that change screens/behaviour; one full play-through before we call it live.
- Report to the Director when done, blocked, or when a PR merges. Keep messages short.

## Milestones
1. Scaffold + contract: Ben's `quiz.js` + tests + CI on main; Ava's two screens on main. (target: ~15 turns each)
2. Pages live at the URL above; Quinn does one full play-through on phone width; fixes merged. → Director reports live. **Done.**
