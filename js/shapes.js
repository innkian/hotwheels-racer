// Abstract shape reasoning — drawn puzzles, no text needed.
//
// Every figure is a small spec { shape, color, size, rot, fill, count } that
// can be drawn into any canvas, so questions and answers are pictures. This
// is the classic non-verbal reasoning family: sequences, odd-one-out,
// rotation, symmetry, and 2x2 matrix analogies (mini Raven's matrices).

const SHAPE_KINDS = ['circle', 'square', 'triangle', 'star', 'hexagon', 'diamond'];
const SHAPE_COLORS = {
  red: '#e63946', blue: '#2b6cff', green: '#2a9d4f', yellow: '#ffd60a',
  purple: '#7b2cbf', orange: '#f77f00',
};
const SHAPE_COLOR_KEYS = Object.keys(SHAPE_COLORS);

// Draw one figure spec centred in a box of the given size.
function drawFigure(ctx, spec, cx, cy, box) {
  const count = spec.count || 1;
  if (count > 1) {
    // lay repeated shapes in a row (or 2 rows for 4+)
    const cols = count <= 3 ? count : Math.ceil(count / 2);
    const rows = count <= 3 ? 1 : 2;
    const cellW = box / cols, cellH = box / rows;
    const sub = Math.min(cellW, cellH) * 0.82;
    let n = 0;
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(cols, count - r * cols);
      for (let c = 0; c < inRow; c++, n++) {
        const x = cx - (inRow - 1) * cellW / 2 + c * cellW;
        const y = cy - (rows - 1) * cellH / 2 + r * cellH;
        drawFigure(ctx, { ...spec, count: 1 }, x, y, sub);
      }
    }
    return;
  }

  const r = (box / 2) * (spec.size || 1);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((spec.rot || 0) * Math.PI) / 180);
  ctx.beginPath();
  const k = spec.shape;
  if (k === 'circle') {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (k === 'square') {
    ctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
  } else if (k === 'triangle') {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.92, r * 0.75);
    ctx.lineTo(-r * 0.92, r * 0.75);
    ctx.closePath();
  } else if (k === 'diamond') {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.78, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.78, 0);
    ctx.closePath();
  } else if (k === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else { // star
    for (let i = 0; i < 5; i++) {
      const a1 = (Math.PI / 5) * (2 * i) - Math.PI / 2;
      const a2 = (Math.PI / 5) * (2 * i + 1) - Math.PI / 2;
      ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * r * 0.46, Math.sin(a2) * r * 0.46);
    }
    ctx.closePath();
  }
  const col = SHAPE_COLORS[spec.color] || spec.color || '#2b6cff';
  if (spec.fill === 'outline') {
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(3, r * 0.22);
    ctx.stroke();
  } else {
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
}

// A row of figures with an optional "?" slot at the end.
function drawFigureRow(ctx, specs, w, h, withQuestionMark) {
  ctx.clearRect(0, 0, w, h);
  const n = specs.length + (withQuestionMark ? 1 : 0);
  const cell = Math.min(w / n, h);
  const box = cell * 0.78;
  const y = h / 2;
  specs.forEach((s, i) => {
    const x = (w / n) * (i + 0.5);
    if (s) drawFigure(ctx, s, x, y, box);
  });
  if (withQuestionMark) {
    const x = (w / n) * (specs.length + 0.5);
    ctx.fillStyle = 'rgba(29,53,87,0.18)';
    ctx.beginPath();
    ctx.roundRect(x - box / 2, y - box / 2, box, box, 10);
    ctx.fill();
    ctx.fillStyle = '#1d3557';
    ctx.font = `bold ${Math.round(box * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y + 2);
  }
}

// ---------- question generators ----------
const ShapeQuiz = (() => {
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const pickSome = (a, n) => shuffle(a).slice(0, n);

  const figKey = (f) =>
    `${f.shape}|${f.color}|${f.size || 1}|${f.rot || 0}|${f.fill || 'solid'}|${f.count || 1}`;

  // Build a question where the choices are figures.
  function figureQuestion({ topic, q, say, prompt, correct, wrongs, allowIdentical }) {
    // Options must look different from each other, or a child sees two
    // identical pictures and can't tell them apart. Odd-one-out is the one
    // puzzle that *needs* repeats, so it opts out.
    if (!allowIdentical) {
      const used = new Set([figKey(correct)]);
      const distinct = [];
      for (const w of wrongs) {
        const k = figKey(w);
        if (!used.has(k)) { used.add(k); distinct.push(w); }
      }
      let guard = 0;
      while (distinct.length < 3 && guard++ < 60) {
        const cand = {
          ...correct,
          shape: pick(SHAPE_KINDS),
          color: pick(SHAPE_COLOR_KEYS),
        };
        const k = figKey(cand);
        if (!used.has(k)) { used.add(k); distinct.push(cand); }
      }
      wrongs = distinct.slice(0, 3);
    }
    // tag the right one before shuffling, then give every option a unique key
    const tagged = shuffle([{ f: correct, ok: true }, ...wrongs.map(f => ({ f, ok: false }))]);
    const choices = tagged.map((t, i) => ({ key: 'opt' + i, fig: t.f }));
    const answer = choices[tagged.findIndex(t => t.ok)].key;
    return {
      topic,
      q,
      say,
      promptFigs: prompt || null,
      promptQMark: !!prompt,
      choices,
      answer,
    };
  }

  // --- AB / ABC repeating sequence: what comes next? ---
  function sequenceQ(age) {
    const shapes = pickSome(SHAPE_KINDS, age === 4 ? 2 : 3);
    const colors = pickSome(SHAPE_COLOR_KEYS, shapes.length);
    const unit = shapes.map((s, i) => ({ shape: s, color: colors[i] }));
    const len = age === 4 ? 4 : 6;
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(unit[i % unit.length]);
    const correct = unit[len % unit.length];
    const wrongs = unit.filter(u => figKey(u) !== figKey(correct)).slice(0, 3);
    while (wrongs.length < 3) {
      const extra = { shape: pick(SHAPE_KINDS), color: pick(SHAPE_COLOR_KEYS) };
      if (!wrongs.some(w => figKey(w) === figKey(extra)) && figKey(extra) !== figKey(correct)) wrongs.push(extra);
    }
    return figureQuestion({
      topic: 'sequence', q: 'What comes next?', say: 'What comes next in the pattern?',
      prompt: seq, correct, wrongs,
    });
  }

  // --- odd one out ---
  function oddOneOutQ(age) {
    const dimension = age === 4 ? pick(['shape', 'color']) : pick(['shape', 'color', 'size', 'fill']);
    const base = { shape: pick(SHAPE_KINDS), color: pick(SHAPE_COLOR_KEYS), size: 1, fill: 'solid' };
    const same = [{ ...base }, { ...base }, { ...base }];
    const odd = { ...base };
    if (dimension === 'shape') odd.shape = pick(SHAPE_KINDS.filter(s => s !== base.shape));
    else if (dimension === 'color') odd.color = pick(SHAPE_COLOR_KEYS.filter(c => c !== base.color));
    else if (dimension === 'size') odd.size = 0.55;
    else odd.fill = 'outline';
    // make the three "same" ones subtly varied in position only (identical spec)
    return figureQuestion({
      topic: 'odd-one-out', q: 'Which one is different?', say: 'Which one is different?',
      prompt: null, correct: odd, wrongs: same, allowIdentical: true,
    });
  }

  // --- growing pattern: 1, 2, 3, ? ---
  function growingQ(age) {
    const shape = pick(SHAPE_KINDS);
    const color = pick(SHAPE_COLOR_KEYS);
    const start = 1 + rnd(2);
    const step = age >= 8 ? pick([1, 2]) : 1;
    const seq = [0, 1, 2].map(i => ({ shape, color, count: start + i * step }));
    const answerCount = start + 3 * step;
    const correct = { shape, color, count: answerCount };
    const wrongs = [];
    [answerCount + 1, answerCount - 1, answerCount + 2].forEach(c => {
      if (c > 0 && c !== answerCount && c <= 6) wrongs.push({ shape, color, count: c });
    });
    while (wrongs.length < 3) {
      const c = 1 + rnd(6);
      if (c !== answerCount && !wrongs.some(w => w.count === c)) wrongs.push({ shape, color, count: c });
    }
    return figureQuestion({
      topic: 'growing', q: 'How many come next?', say: 'The pattern is growing. How many come next?',
      prompt: seq, correct, wrongs: wrongs.slice(0, 3),
    });
  }

  // --- rotation: which is the same shape turned around? ---
  function rotationQ() {
    const shape = pick(['triangle', 'diamond', 'star', 'hexagon']);
    const color = pick(SHAPE_COLOR_KEYS);
    const baseRot = pick([0, 30, 45, 60]);
    const target = { shape, color, rot: baseRot };
    const correct = { shape, color, rot: baseRot + pick([90, 180, 270]) };
    const wrongs = [
      { shape: pick(SHAPE_KINDS.filter(s => s !== shape)), color, rot: baseRot + 90 },
      { shape, color: pick(SHAPE_COLOR_KEYS.filter(c => c !== color)), rot: baseRot + 180 },
      { shape: pick(SHAPE_KINDS.filter(s => s !== shape)), color: pick(SHAPE_COLOR_KEYS.filter(c => c !== color)), rot: baseRot },
    ];
    return figureQuestion({
      topic: 'rotation', q: 'Which is the SAME shape, just turned?', say: 'Which one is the same shape, just turned around?',
      prompt: [target], correct, wrongs,
    });
  }

  // --- matrix analogy: A is to B as C is to ? ---
  function matrixQ() {
    const rule = pick(['recolour', 'grow', 'hollow']);
    const shapeA = pick(SHAPE_KINDS);
    const shapeC = pick(SHAPE_KINDS.filter(s => s !== shapeA));
    const c1 = pick(SHAPE_COLOR_KEYS);
    const c2 = pick(SHAPE_COLOR_KEYS.filter(c => c !== c1));
    let A, B, C, correct;
    if (rule === 'recolour') {
      A = { shape: shapeA, color: c1 }; B = { shape: shapeA, color: c2 };
      C = { shape: shapeC, color: c1 }; correct = { shape: shapeC, color: c2 };
    } else if (rule === 'grow') {
      A = { shape: shapeA, color: c1, size: 0.6 }; B = { shape: shapeA, color: c1, size: 1 };
      C = { shape: shapeC, color: c2, size: 0.6 }; correct = { shape: shapeC, color: c2, size: 1 };
    } else {
      A = { shape: shapeA, color: c1, fill: 'solid' }; B = { shape: shapeA, color: c1, fill: 'outline' };
      C = { shape: shapeC, color: c2, fill: 'solid' }; correct = { shape: shapeC, color: c2, fill: 'outline' };
    }
    const wrongs = [
      { ...correct, color: pick(SHAPE_COLOR_KEYS.filter(c => c !== correct.color)) },
      { ...C },
      { ...correct, shape: pick(SHAPE_KINDS.filter(s => s !== correct.shape)) },
    ];
    return figureQuestion({
      topic: 'matrix', q: 'A → B, so C → ?', say: 'Look how the first pair changes. What should come after the third shape?',
      prompt: [A, B, null, C], correct, wrongs,
    });
  }

  // --- biggest / smallest ---
  function sizeQ() {
    const shape = pick(SHAPE_KINDS);
    const color = pick(SHAPE_COLOR_KEYS);
    const wantBig = rnd(2) === 0;
    const sizes = shuffle([0.45, 0.65, 0.85, 1]);
    const figs = sizes.map(s => ({ shape, color, size: s }));
    const correct = figs.reduce((acc, f) => (wantBig ? (f.size > acc.size ? f : acc) : (f.size < acc.size ? f : acc)));
    return figureQuestion({
      topic: 'size', q: wantBig ? 'Which is the BIGGEST?' : 'Which is the SMALLEST?',
      say: wantBig ? 'Which one is the biggest?' : 'Which one is the smallest?',
      prompt: null, correct, wrongs: figs.filter(f => f !== correct),
    });
  }

  // --- count the sides ---
  function sidesQ() {
    const opts = { triangle: 3, square: 4, hexagon: 6, diamond: 4 };
    const shape = pick(Object.keys(opts));
    const ans = opts[shape];
    const color = pick(SHAPE_COLOR_KEYS);
    const wrongNums = shuffle([3, 4, 5, 6, 8].filter(n => n !== ans)).slice(0, 3);
    return {
      topic: 'sides',
      q: 'How many sides does this shape have?',
      say: 'How many sides does this shape have?',
      promptFigs: [{ shape, color }],
      promptQMark: false,
      choices: shuffle([String(ans), ...wrongNums.map(String)]).map(t => ({ key: t, text: t })),
      answer: String(ans),
    };
  }

  function next(age) {
    if (age === 4) return pick([sequenceQ, oddOneOutQ, sizeQ, sequenceQ, oddOneOutQ])(age);
    if (age === 6) return pick([sequenceQ, oddOneOutQ, growingQ, rotationQ, sidesQ, sizeQ])(age);
    return pick([matrixQ, rotationQ, growingQ, sequenceQ, matrixQ, sidesQ])(age);
  }

  return { next };
})();
