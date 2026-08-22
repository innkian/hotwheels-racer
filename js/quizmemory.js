// Quiz memory — the Quiz Racer remembers how each child is doing.
//
// Per subject+age it tracks a mastery score for every topic (addition,
// rotation, plurals…), which questions were seen recently, and a rolling
// accuracy. That drives three things:
//   1. weak topics come up more often (but never punishingly so)
//   2. recently-seen questions are skipped, so variety stays high
//   3. the band nudges up a level when accuracy is consistently high
//
// Everything lives in localStorage; nothing leaves the device.

const QuizMemory = (() => {
  const KEY = 'twr_quizmem_v1';
  const RECENT_MAX = 12;   // sized so small banks still rotate freely

  let store = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) store = JSON.parse(raw) || {};
  } catch (e) {}
  function save_() { localStorage.setItem(KEY, JSON.stringify(store)); }

  function bucket(subject, age) {
    const k = `${subject}-${age}`;
    if (!store[k]) store[k] = { topics: {}, recent: [], asked: 0, right: 0, last: [] };
    return store[k];
  }
  function topic(b, name) {
    if (!b.topics[name]) b.topics[name] = { seen: 0, right: 0, score: 0.5 };
    return b.topics[name];
  }

  // How much this topic deserves practice right now (higher = weaker).
  function weightFor(b, name) {
    const t = b.topics[name];
    if (!t) return 1.5;                     // never tried — prioritise it
    // weak topics come round more often, but everything keeps appearing
    return 0.6 + (1 - t.score) * 0.85;
  }

  // Choose from candidate questions: weak topics are more likely, but this is
  // a weighted draw — not "always the worst" — so practice stays varied and
  // never feels like being hammered on one thing.
  function choose(subject, age, candidates) {
    const b = bucket(subject, age);
    const fresh = candidates.filter(c => !b.recent.includes(c.q));
    const pool = fresh.length ? fresh : candidates;
    const weights = pool.map(c => weightFor(b, c.topic || subject));
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function record(subject, age, question, correct) {
    const b = bucket(subject, age);
    const t = topic(b, question.topic || subject);
    t.seen += 1;
    if (correct) { t.right += 1; b.right += 1; }
    b.asked += 1;
    // smoothed mastery, so one slip doesn't erase progress
    t.score = Math.max(0, Math.min(1, t.score * 0.7 + (correct ? 1 : 0) * 0.3));
    b.recent.push(question.q);
    if (b.recent.length > RECENT_MAX) b.recent.shift();
    b.last.push(correct ? 1 : 0);
    if (b.last.length > 12) b.last.shift();
    save_();
  }

  // Is the child ready for the next age band? (needs a solid recent run)
  function readyToLevelUp(subject, age) {
    const b = bucket(subject, age);
    if (b.last.length < 10) return false;
    const acc = b.last.reduce((s, v) => s + v, 0) / b.last.length;
    return acc >= 0.9;
  }

  function accuracy(subject, age) {
    const b = bucket(subject, age);
    return b.asked ? Math.round((b.right / b.asked) * 100) : null;
  }

  // Parent-facing: which topics need work, across everything played.
  function report() {
    const rows = [];
    for (const [k, b] of Object.entries(store)) {
      if (!b.asked) continue;
      const weak = Object.entries(b.topics)
        .filter(([, t]) => t.seen >= 3 && t.score < 0.6)
        .sort((a, c) => a[1].score - c[1].score)
        .map(([name]) => name);
      const strong = Object.entries(b.topics)
        .filter(([, t]) => t.seen >= 3 && t.score >= 0.8)
        .map(([name]) => name);
      rows.push({
        key: k,
        asked: b.asked,
        accuracy: Math.round((b.right / b.asked) * 100),
        weak: weak.slice(0, 4),
        strong: strong.slice(0, 4),
      });
    }
    return rows;
  }

  function reset() { store = {}; save_(); }

  return { choose, record, readyToLevelUp, accuracy, report, reset };
})();
