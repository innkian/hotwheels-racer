// Adaptive learning engine for the Listen & Find game.
//
// Tracks a mastery score (0..1) for every word concept the game can test
// (each color, vehicle type, and pattern word). Every answer updates the
// model; the next challenge is chosen to practice the weakest words while
// mixing in mastered ones for confidence. Instruction complexity (level)
// rises when he's consistently right and gently falls when he's struggling,
// so the game always sits at the edge of what he can do.
//
// Levels:
//   1 — one word, 3 cars to pick from   ("Tap the RED car")
//   2 — one word, 5 cars                 ("Tap the TRUCK")
//   3 — two words combined, 5 cars       ("Tap the RED TRUCK")
//   4 — two-step instruction, 4 cars     ("First tap the truck, THEN tap the red car")

const Learning = (() => {
  const LSKEY = 'twr_learning_v1';

  function blank() {
    return {
      concepts: {},   // "color:red" -> {score, seen, lastSeen}
      level: 1,
      streak: 0,
      totalCorrect: 0,
      freeUnlocks: 0,
      recent: [],     // last answers at current level: [{correct, level, ts}]
      stars: 0,
    };
  }
  let state = blank();
  try {
    const raw = localStorage.getItem(LSKEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) {}
  function persist() { localStorage.setItem(LSKEY, JSON.stringify(state)); }

  // ---- concept universe, derived from the car roster ----
  function allConcepts() {
    const set = new Set();
    CAR_DESIGNS.forEach(d => {
      const w = carWords(d);
      set.add('color:' + w.color);
      set.add('type:' + w.type);
      if (w.decal) set.add('decal:' + w.decal);
    });
    return [...set];
  }
  function conceptState(key) {
    if (!state.concepts[key]) state.concepts[key] = { score: 0.35, seen: 0, lastSeen: 0 };
    return state.concepts[key];
  }
  function conceptLabel(key) { return key.split(':')[1]; }
  function designMatches(design, key) {
    const [dim, val] = key.split(':');
    return carWords(design)[dim] === val;
  }

  // ---- adaptive selection ----
  function pickConcept(exclude) {
    const now = Date.now();
    const options = allConcepts().filter(k => !exclude || !exclude.includes(k));
    // small chance to review a mastered word (confidence + retention)
    const mastered = options.filter(k => conceptState(k).score >= 0.8);
    if (mastered.length && Math.random() < 0.25) {
      return mastered[Math.floor(Math.random() * mastered.length)];
    }
    let best = null, bestW = -1;
    for (const k of options) {
      const c = conceptState(k);
      const staleDays = Math.min(3, (now - c.lastSeen) / 86400000);
      const w = (1 - c.score) + staleDays * 0.08 + Math.random() * 0.15;
      if (w > bestW) { bestW = w; best = k; }
    }
    return best;
  }

  function pickTarget(concepts) {
    const matches = CAR_DESIGNS.filter(d => concepts.every(k => designMatches(d, k)));
    if (!matches.length) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }
  function pickDistractors(target, concepts, n) {
    // distractors must NOT fully match the instruction
    const pool = CAR_DESIGNS.filter(d => d.id !== target.id && !concepts.every(k => designMatches(d, k)));
    const out = [];
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    for (const d of shuffled) {
      if (out.length >= n) break;
      out.push(d);
    }
    return out;
  }

  function stepText(concepts) {
    const dims = Object.fromEntries(concepts.map(k => k.split(':')));
    const color = dims.color, type = dims.type, decal = dims.decal;
    if (color && type) return `the ${color} ${type}`;
    if (color && decal) return `the ${color} car with ${decal}`;
    if (type && decal) return `the ${type} with ${decal}`;
    if (color) return `the ${color} car`;
    if (type) return `the ${type}`;
    if (decal) return `the car with ${decal}`;
    return 'the car';
  }

  function makeStep(nChoices, excludeConcepts, forceTwoWords) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const first = pickConcept(excludeConcepts);
      let concepts = [first];
      if (forceTwoWords) {
        const dim1 = first.split(':')[0];
        const partners = allConcepts().filter(k => k.split(':')[0] !== dim1);
        const second = partners[Math.floor(Math.random() * partners.length)];
        concepts = [first, second];
      }
      const target = pickTarget(concepts);
      if (!target) continue;
      const distractors = pickDistractors(target, concepts, nChoices - 1);
      if (distractors.length < nChoices - 1) continue;
      return {
        concepts,
        targetId: target.id,
        text: stepText(concepts),
        choices: [target, ...distractors].sort(() => Math.random() - 0.5).map(d => d.id),
      };
    }
    return null;
  }

  function nextChallenge() {
    const L = state.level;
    if (L === 4) {
      // two sequential single-word steps over one shared set of 4 cars
      const s1 = makeStep(4, null, false);
      if (s1) {
        const s2 = makeStep(4, s1.concepts, false);
        if (s2) {
          // merge choice pools: target1 + target2 + 2 distractors from either
          const ids = new Set([s1.targetId, s2.targetId]);
          for (const id of [...s1.choices, ...s2.choices]) {
            if (ids.size >= 4) break;
            ids.add(id);
          }
          const choices = [...ids].sort(() => Math.random() - 0.5);
          return {
            level: 4,
            choices,
            steps: [s1, s2],
            prompt: `First tap ${s1.text}. Then tap ${s2.text}.`,
          };
        }
      }
      // fall through to level 3 style if we couldn't build one
    }
    const twoWords = L >= 3;
    const nChoices = L === 1 ? 3 : 5;
    const step = makeStep(nChoices, null, twoWords) || makeStep(3, null, false);
    return {
      level: L,
      choices: step.choices,
      steps: [step],
      prompt: `Tap ${step.text}.`,
    };
  }

  // ---- recording + level adaptation ----
  function record(concepts, correct) {
    const now = Date.now();
    for (const k of concepts) {
      const c = conceptState(k);
      const a = correct ? 0.3 : 0.45;
      c.score = Math.max(0, Math.min(1, c.score * (1 - a) + (correct ? 1 : 0) * a));
      c.seen += 1;
      c.lastSeen = now;
    }
    state.recent.push({ correct, level: state.level, ts: now });
    if (state.recent.length > 30) state.recent.shift();
    if (correct) {
      state.streak += 1;
      state.totalCorrect += 1;
    } else {
      state.streak = 0;
    }

    // level adaptation based on recent answers at the current level
    const atLevel = state.recent.filter(r => r.level === state.level).slice(-8);
    if (atLevel.length >= 6) {
      const acc = atLevel.filter(r => r.correct).length / atLevel.length;
      if (acc >= 0.8 && state.level < 4) {
        state.level += 1;
        state.recent = [];
        persist();
        return 'levelup';
      }
      if (acc <= 0.35 && state.level > 1) {
        state.level -= 1;
        state.recent = [];
        persist();
        return 'leveldown';
      }
    }
    persist();
    return null;
  }

  // every 10 correct answers earns a free car unlock
  function pendingFreeUnlock() {
    return Math.floor(state.totalCorrect / 10) > state.freeUnlocks;
  }
  function claimFreeUnlock() {
    state.freeUnlocks += 1;
    persist();
  }

  // ---- parent-facing summary ----
  function summary() {
    const groups = { color: [], type: [], decal: [] };
    for (const k of allConcepts()) {
      const c = state.concepts[k];
      groups[k.split(':')[0]].push({ word: conceptLabel(k), score: c ? c.score : null, seen: c ? c.seen : 0 });
    }
    for (const g of Object.values(groups)) g.sort((a, b) => (a.score ?? 0.35) - (b.score ?? 0.35));
    const last20 = state.recent.slice(-20);
    return {
      level: state.level,
      totalCorrect: state.totalCorrect,
      stars: state.stars,
      recentAccuracy: last20.length ? Math.round(100 * last20.filter(r => r.correct).length / last20.length) : null,
      groups,
      practiceWords: Object.values(groups).flat().filter(c => c.seen > 0 && c.score < 0.6).map(c => c.word).slice(0, 5),
    };
  }

  function addStar() { state.stars += 1; persist(); }

  return { nextChallenge, record, addStar, pendingFreeUnlock, claimFreeUnlock, summary, get state() { return state; } };
})();
