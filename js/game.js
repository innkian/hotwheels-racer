// ===================== Save data =====================
const STORAGE_KEY = 'twr_save_v1';
function defaultSave() {
  return {
    unlocked: [CAR_DESIGNS[0].id, CAR_DESIGNS[1].id],
    selected: CAR_DESIGNS[0].id,
    wins: 0,
    difficulty: 'easy',
    coins: 0,
    winProgress: 0,
    customCars: [],
    gear: { engine: 1, tyres: 'normal', driver: 'max', hat: 'none', horn: 'beep', trail: 'none', gadgets: [] },
    owned: { engines: [1], tyres: ['normal'], drivers: ['max', 'mia'], hats: ['none', 'cap'], gadgets: [], horns: ['beep'], trails: ['none'] },
  };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const s = Object.assign(defaultSave(), parsed);
      // deep-merge nested objects so older saves gain new gear/owned fields
      s.gear = Object.assign(defaultSave().gear, parsed.gear || {});
      s.owned = Object.assign(defaultSave().owned, parsed.owned || {});
      return s;
    }
  } catch (e) {}
  return defaultSave();
}
let save = loadSave();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }

function getDesign(id) {
  return CAR_DESIGNS.find(c => c.id === id)
    || (save.customCars || []).find(c => c.id === id)
    || CAR_DESIGNS[0];
}
function playerEquip(boost) {
  return { tyres: save.gear.tyres, driver: save.gear.driver, hat: save.gear.hat, boost: !!boost };
}
function isUnlocked(id) { return save.unlocked.includes(id); }
function unlockNext() {
  const next = CAR_DESIGNS.find(c => !save.unlocked.includes(c.id));
  if (next) { save.unlocked.push(next.id); persist(); }
  return next || null;
}
// New cars get harder to earn as the garage fills up.
function winsNeededForNextCar() {
  const n = save.unlocked.length;
  if (n < 6) return 1;
  if (n < 12) return 2;
  if (n < 18) return 3;
  return 4;
}

// ===================== Screen management =====================
const screens = {
  title: document.getElementById('screen-title'),
  garage: document.getElementById('screen-garage'),
  race: document.getElementById('screen-race'),
  listen: document.getElementById('screen-listen'),
  build: document.getElementById('screen-build'),
  workshop: document.getElementById('screen-workshop'),
  maker: document.getElementById('screen-maker'),
  multi: document.getElementById('screen-multi'),
};
let currentScreen = 'title';
function showScreen(name) {
  currentScreen = name;
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  if (name === 'title') renderTitle();
  if (name === 'garage') renderGarage();
  if (name === 'race') initRace();
  if (name === 'listen' && window.initListen) window.initListen();
  if (name === 'build' && window.initBuild) window.initBuild();
  if (name === 'workshop' && window.initWorkshop) window.initWorkshop();
  if (name === 'maker' && window.initMaker) window.initMaker();
  if (name === 'multi' && window.initMulti) window.initMulti();
  if (name === 'title' && window.MP && MP.state.active) MP.leave();
}

// ===================== Title screen =====================
const titleCanvas = document.getElementById('title-canvas');
function renderTitle() {
  document.getElementById('garage-count').textContent = `${save.unlocked.length}/${CAR_DESIGNS.length}`;
  const dpr = window.devicePixelRatio || 1;
  const w = titleCanvas.clientWidth, h = titleCanvas.clientHeight;
  titleCanvas.width = w * dpr; titleCanvas.height = h * dpr;
  const tctx = titleCanvas.getContext('2d');
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tctx.clearRect(0, 0, w, h);
  const design = getDesign(save.selected);
  const s = Math.min(w / 70, h / 48);
  drawCar(tctx, design, w / 2, h / 2 + 14 * s, s, 0, 0, playerEquip(false));
  const wallet = document.getElementById('title-wallet');
  if (wallet) wallet.textContent = '🪙 ' + save.coins;
}
document.getElementById('btn-play').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('race'); });
document.getElementById('btn-garage').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('garage'); });
document.getElementById('btn-listen').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('listen'); });
document.getElementById('btn-build').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('build'); });
document.getElementById('btn-workshop').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('workshop'); });
document.getElementById('btn-maker').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('maker'); });
document.getElementById('btn-multi').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('multi'); });

// difficulty picker
function renderDifficulty() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.diff === (save.difficulty || 'easy'));
  });
}
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    save.difficulty = btn.dataset.diff;
    persist();
    SFX.click();
    Speech.say(DIFFICULTIES[btn.dataset.diff].label + '!');
    renderDifficulty();
  });
});
renderDifficulty();

// speech on/off toggle
const speechToggleBtn = document.getElementById('btn-speech-toggle');
if (save.speechOff) Speech.enabled = false;
function renderSpeechToggle() { speechToggleBtn.textContent = Speech.enabled ? '🔊' : '🔇'; }
renderSpeechToggle();
speechToggleBtn.addEventListener('click', () => {
  Speech.enabled = !Speech.enabled;
  save.speechOff = !Speech.enabled;
  persist();
  renderSpeechToggle();
  SFX.click();
});

// grown-ups panel (hold to open, so little fingers don't wander in)
const grownupsBtn = document.getElementById('btn-grownups');
let holdTimer = null;
grownupsBtn.addEventListener('pointerdown', () => {
  holdTimer = setTimeout(showGrownups, 1200);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
  grownupsBtn.addEventListener(ev, () => clearTimeout(holdTimer)));

function showGrownups() {
  const s = Learning.summary();
  const bar = (score) => {
    const pct = score == null ? 0 : Math.round(score * 100);
    const color = score == null ? '#ccc' : score >= 0.75 ? '#2a9d4f' : score >= 0.5 ? '#ffb703' : '#e63946';
    return `<div class="mastery-bar"><div style="width:${pct}%;background:${color};"></div></div>`;
  };
  const group = (title, items) => `
    <div class="mastery-group"><h3>${title}</h3>
    ${items.map(c => `<div class="mastery-row"><span>${c.word}${c.seen === 0 ? ' <small>(not tried)</small>' : ''}</span>${bar(c.seen ? c.score : null)}</div>`).join('')}
    </div>`;
  document.getElementById('grownups-panel').innerHTML = `
    <h2>👪 Progress</h2>
    <p style="margin:0;color:#1d3557;">Listening level: <b>${s.level} of 4</b> · Correct answers: <b>${s.totalCorrect}</b>${s.recentAccuracy != null ? ` · Recent accuracy: <b>${s.recentAccuracy}%</b>` : ''}</p>
    ${s.practiceWords.length ? `<p style="margin:0;color:#e63946;font-weight:700;">Words to practice in real life: ${s.practiceWords.join(', ')}</p>` : ''}
    <div class="mastery-groups">
      ${group('Colors', s.groups.color)}
      ${group('Vehicles', s.groups.type)}
      ${group('Patterns', s.groups.decal)}
    </div>
    <p style="font-size:13px;color:#555;margin:0;">Tip: when he wins a car, ask him to tell you its color and name out loud — retelling builds the skills the teacher flagged.</p>
    <button id="btn-grownups-close" class="big-btn gray">Close</button>
  `;
  document.getElementById('grownups-overlay').classList.remove('hidden');
  document.getElementById('btn-grownups-close').addEventListener('click', () => {
    document.getElementById('grownups-overlay').classList.add('hidden');
  });
}

// ===================== Garage screen =====================
function renderGarage() {
  const grid = document.getElementById('garage-grid');
  grid.innerHTML = '';
  // his own built cars first, with a star badge
  (save.customCars || []).forEach(design => {
    const card = document.createElement('div');
    card.className = 'car-card' + (design.id === save.selected ? ' selected' : '');
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const badge = document.createElement('div');
    badge.className = 'lock-icon';
    badge.textContent = '🌟';
    card.appendChild(badge);
    const nameEl = document.createElement('div');
    nameEl.className = 'car-name';
    nameEl.textContent = design.name;
    card.appendChild(nameEl);
    grid.appendChild(card);
    requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 100, h = canvas.clientHeight || 90;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const cctx = canvas.getContext('2d');
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = Math.min(w / 68, h / 46);
      drawCar(cctx, design, w / 2, h / 2 + 12 * s, s, 0, 0, design.id === save.selected ? playerEquip(false) : null);
    });
    card.addEventListener('click', () => {
      save.selected = design.id; persist(); SFX.click();
      Speech.say(describeCar(design));
      renderGarage();
    });
  });
  CAR_DESIGNS.forEach(design => {
    const unlocked = isUnlocked(design.id);
    const card = document.createElement('div');
    card.className = 'car-card' + (unlocked ? '' : ' locked') + (design.id === save.selected ? ' selected' : '');
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const nameEl = document.createElement('div');
    nameEl.className = 'car-name';
    nameEl.textContent = unlocked ? design.name : '???';
    if (!unlocked) {
      const lock = document.createElement('div');
      lock.className = 'lock-icon';
      lock.textContent = '🔒';
      card.appendChild(lock);
    }
    card.appendChild(nameEl);
    grid.appendChild(card);

    requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 100, h = canvas.clientHeight || 90;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const cctx = canvas.getContext('2d');
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = Math.min(w / 68, h / 46);
      if (unlocked) drawCar(cctx, design, w / 2, h / 2 + 12 * s, s, 0, 0, design.id === save.selected ? playerEquip(false) : null);
      else drawLockedCar(cctx, design, w / 2, h / 2 + 12 * s, s);
    });

    card.addEventListener('click', () => {
      if (!unlocked) { SFX.click(); Speech.say('Win a race to unlock this car!'); return; }
      save.selected = design.id; persist(); SFX.click();
      Speech.say(describeCar(design));
      renderGarage();
    });
  });
}
document.getElementById('btn-garage-back').addEventListener('click', () => { SFX.click(); showScreen('title'); });

// ===================== Race constants =====================
const CAR_SCALE = 1.5;              // car draw scale in the race
const WHEEL_X = 18 * CAR_SCALE;     // half wheelbase in world px
const WHEEL_R = 9 * CAR_SCALE;
const CAR_TOP = 40 * CAR_SCALE / 1.5; // approx roof height above axle (world px)
const GRAVITY = 1500;
const MAX_SPEED = 560;
const ACCEL = 520;
const BRAKE_DECEL = 900;
const REVERSE_MAX = -140;
const AIR_ROT_ACCEL = 5.5;          // rad/s^2 from pedals while airborne
const STUN_DURATION = 1.0;
const VIEW_W = 1000;                // world px visible across the canvas width

const CAVE_CLEARANCE = 115;         // roof height above the base floor inside caves

const OPP_NAMES = ['Rusty', 'Bolt', 'Turbo Rex'];
const OPP_COLORS = ['#b5651d', '#2b6cff', '#2a9d4f'];
const OPP_BASE_SPEED = [200, 260, 320];

// ===================== Difficulty =====================
const DIFFICULTIES = {
  easy:   { label: 'Easy',   icon: '🐢', oppMult: 0.72, hearts: 5, caves: 1, headStart: 900, hazards: 0, hazardPool: [], rockRate: 1.6 },
  medium: { label: 'Medium', icon: '🚗', oppMult: 1.0,  hearts: 3, caves: 2, headStart: 500, hazards: 1, hazardPool: ['water', 'rocks'], rockRate: 1.4 },
  hard:   { label: 'Hard',   icon: '🚀', oppMult: 1.15, hearts: 3, caves: 3, headStart: 250, hazards: 2, hazardPool: ['water', 'rocks', 'steep'], rockRate: 1.0 },
};
function currentDifficulty() { return DIFFICULTIES[save.difficulty] || DIFFICULTIES.easy; }

// ===================== Track segments (the LEGO pieces) =====================
// A track is a sequence of segments. Random races shuffle them; the builder
// screen lets the kid snap his own together.
const SEG_LEN = 900;
const START_PAD = 500;
const FINISH_PAD = 400;
const SEGMENT_TYPES = {
  road:     { label: 'ROAD',     speak: 'Road!',         code: 'r' },
  hills:    { label: 'HILLS',    speak: 'Hills!',        code: 'h' },
  bumps:    { label: 'BUMPS',    speak: 'Bumpy road!',   code: 'b' },
  jump:     { label: 'JUMP',     speak: 'Big jump!',     code: 'j' },
  mountain: { label: 'MOUNTAIN', speak: 'Big mountain!', code: 'm' },
  cave:     { label: 'CAVE',     speak: 'Cave! Go slow!', code: 'c' },
  coins:    { label: 'COINS',    speak: 'Coins!',        code: 'o' },
  water:    { label: 'WATER',    speak: 'Water! Jump on the logs!', code: 'w' },
  rocks:    { label: 'ROCKS',    speak: 'Falling rocks! Watch out!', code: 'k' },
  steep:    { label: 'STEEP',    speak: 'A super steep wall! You need monster tyres or a rocket engine!', code: 's' },
};

// Track codes for share links: one letter per piece, e.g. "jcmho"
function encodeTrack(segs) {
  return segs.map(s => SEGMENT_TYPES[s].code).join('');
}
function decodeTrack(code) {
  const byCode = {};
  for (const [type, info] of Object.entries(SEGMENT_TYPES)) byCode[info.code] = type;
  const segs = [...String(code).toLowerCase()].map(ch => byCode[ch]);
  return segs.length >= 1 && segs.length <= 8 && segs.every(Boolean) ? segs : null;
}

// Remember recent random tracks so new ones never feel like reruns:
// generate several candidates and keep the one least similar to anything
// he's raced lately.
const RECENT_TRACKS_KEY = 'twr_tracks_recent';
let recentTracks = [];
try {
  const raw = localStorage.getItem(RECENT_TRACKS_KEY);
  if (raw) recentTracks = JSON.parse(raw);
} catch (e) {}

function rollSegments() {
  const D = currentDifficulty();
  const fun = ['hills', 'bumps', 'jump', 'coins', 'mountain', 'hills', 'jump', 'coins'];
  const segs = [];
  for (let i = 0; i < 8; i++) segs.push(fun[Math.floor(Math.random() * fun.length)]);
  // caves and hazards land anywhere except the first segment
  const spots = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
  let s = 0;
  for (let c = 0; c < D.caves; c++) segs[spots[s++]] = 'cave';
  for (let h = 0; h < D.hazards && D.hazardPool.length; h++) {
    segs[spots[s++]] = D.hazardPool[Math.floor(Math.random() * D.hazardPool.length)];
  }
  return segs;
}
function similarity(a, b) {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}
function randomSegments() {
  let best = null, bestScore = Infinity;
  for (let tries = 0; tries < 12; tries++) {
    const candidate = rollSegments();
    const score = recentTracks.length
      ? Math.max(...recentTracks.map(r => similarity(candidate, r)))
      : 0;
    if (score < bestScore) { bestScore = score; best = candidate; }
    if (bestScore <= 0.375) break;   // at most 3 of 8 pieces match anything recent
  }
  recentTracks.push(best);
  if (recentTracks.length > 6) recentTracks.shift();
  localStorage.setItem(RECENT_TRACKS_KEY, JSON.stringify(recentTracks));
  return best;
}

// Build a playable track (terrain functions + feature lists) from segments.
let terra = null;
// deterministic RNG so two devices can build identical terrain from a seed
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildTrack(segments, seed) {
  const rng = seed !== undefined ? makeRng(seed) : Math.random;
  const p1 = rng() * Math.PI * 2;
  const p2 = rng() * Math.PI * 2;
  const length = START_PAD + segments.length * SEG_LEN + FINISH_PAD;
  const caves = [];
  const ramps = [];      // linear climb + sharp drop: fast cars launch off these
  const waters = [];     // pits full of water with floating log platforms
  const platforms = [];  // one-way platforms (logs): land on top, drive under
  const rockZones = [];  // ravines with falling rocks
  const steeps = [];     // steep walls needing grip or big speed
  // smooth base line (no pits/walls/ramps) — cave roofs and water surfaces use it
  const shapeBase = (x) => {
    const rampIn = Math.min(1, Math.max(0, (x - 300) / 600)); // flat start
    let y = 420 + rampIn * 14 * Math.sin(x / 210 + p1);
    const i = Math.floor((x - START_PAD) / SEG_LEN);
    if (i >= 0 && i < segments.length) {
      const t = (x - START_PAD - i * SEG_LEN) / SEG_LEN;
      const w = Math.sin(Math.PI * t);   // fades to 0 at segment edges
      const type = segments[i];
      if (type === 'hills') y += 44 * w * Math.sin(t * 3 * Math.PI + p2);
      else if (type === 'bumps') y += 11 * w * Math.sin(t * 16 * Math.PI);
      else if (type === 'mountain') y -= 100 * Math.sin(Math.PI * t);
      else if (type === 'rocks') y += 110 * Math.sin(Math.PI * t); // down into a ravine
    }
    return y;
  };
  // carved features on top of the base line
  const carve = (x) => {
    const i = Math.floor((x - START_PAD) / SEG_LEN);
    if (i < 0 || i >= segments.length) return 0;
    const t = (x - START_PAD - i * SEG_LEN) / SEG_LEN;
    const type = segments[i];
    if (type === 'water' && t > 0.21 && t < 0.84) {
      // water pit: quick drop in, 150 deep, drivable slope back out
      const u = (t - 0.21) / 0.63;
      const rampInP = Math.min(1, u / 0.10);
      const rampOutP = Math.min(1, (1 - u) / 0.44);
      return 150 * Math.min(rampInP, rampOutP);
    }
    if (type === 'steep') {
      // flat run-up, steep 260-high wall, small plateau, gentler ride down
      if (t <= 0.16) return 0;
      if (t <= 0.54) return -260 * (t - 0.16) / 0.38;
      if (t <= 0.60) return -260;
      if (t <= 1.0) return -260 * (1 - (t - 0.60) / 0.40);
    }
    return 0;
  };
  // register the physical features of one segment (also used by endless drives)
  const addSegmentFeatures = (type, i) => {
    const s0 = START_PAD + i * SEG_LEN;
    if (type === 'jump') ramps.push({ x: s0 + 370, L: 170, H: 70 });
    if (type === 'cave') {
      const z = { start: s0 + 100, end: s0 + SEG_LEN - 100 };
      caves.push(z);
      const len = z.end - z.start;
      ramps.push({ x: z.start + len * 0.22, L: 110, H: 50 });
      ramps.push({ x: z.start + len * 0.58, L: 110, H: 50 });
    }
    if (type === 'water') {
      // pit t: 0.21..0.84 of segment; small launch ramp before it
      waters.push({ start: s0 + SEG_LEN * 0.21, end: s0 + SEG_LEN * 0.84, rescueX: s0 - 60 });
      ramps.push({ x: s0 + 40, L: 130, H: 45 });
      [0.36, 0.53, 0.70].forEach(f => {
        const lx = s0 + SEG_LEN * f;
        platforms.push({ x: lx, half: 58, y: shapeBase(lx) - 8 });
      });
    }
    if (type === 'rocks') rockZones.push({ start: s0 + 100, end: s0 + 820 });
    if (type === 'steep') steeps.push({ start: s0 + 60, end: s0 + SEG_LEN, failX: s0 + 80 });
  };
  segments.forEach((type, i) => addSegmentFeatures(type, i));
  const ground = (x) => {
    let y = shapeBase(x) + carve(x);
    for (const r of ramps) {
      const u = x - r.x;
      if (u > 0 && u < r.L) y -= r.H * (u / r.L);
    }
    return y;
  };
  const ceiling = (x) => {
    for (const z of caves) {
      const t = Math.min((x - z.start) / 130, (z.end - x) / 130);
      if (t > 0) return shapeBase(x) - (CAVE_CLEARANCE + Math.max(0, 1 - t) * 320);
    }
    return -Infinity;
  };
  const inCave = (x) => caves.some(z => x > z.start && x < z.end);
  const waterAt = (x) => waters.find(z => x > z.start && x < z.end) || null;
  const track = { segments, length, caves, ramps, waters, platforms, rockZones, steeps, ground, ceiling, inCave, waterAt, surface: shapeBase };
  // grow the track by one segment (endless Long Drive mode); deterministic
  // when seeded, so two devices extend into identical terrain
  track.extend = () => {
    const roll = rng();
    const type = roll < 0.11 ? 'cave'
      : roll < 0.19 ? 'water'
      : roll < 0.26 ? 'rocks'
      : roll < 0.30 ? 'steep'
      : ['hills', 'bumps', 'jump', 'coins', 'mountain', 'road'][Math.floor(rng() * 6)];
    const i = segments.length;
    segments.push(type);
    addSegmentFeatures(type, i);
    track.length += SEG_LEN;
    // prune features far behind so endless drives stay fast
    const cutoff = START_PAD + (segments.length - 12) * SEG_LEN;
    const prune = (arr, endOf) => { while (arr.length && endOf(arr[0]) < cutoff) arr.shift(); };
    prune(ramps, r => r.x + r.L);
    prune(caves, z => z.end);
    prune(waters, z => z.end);
    prune(platforms, p => p.x + p.half);
    prune(rockZones, z => z.end);
    prune(steeps, z => z.end);
    return { type, i };
  };
  return track;
}

// refY: the car's current y — log platforms only count when the car is at or
// above them (one-way), so you can also drive underneath through the water.
function sampleGround(x, refY) {
  let y = terra.ground(x);
  if (refY !== undefined && terra.platforms) {
    for (const p of terra.platforms) {
      if (Math.abs(x - p.x) <= p.half && refY <= p.y - WHEEL_R + 14 && p.y < y) y = p.y;
    }
  }
  return y;
}
function groundPose(x, refY) {
  const gy1 = sampleGround(x - WHEEL_X, refY);
  const gy2 = sampleGround(x + WHEEL_X, refY);
  return {
    y: (gy1 + gy2) / 2 - WHEEL_R,
    slope: Math.atan2(gy2 - gy1, WHEEL_X * 2),
  };
}

function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// ===================== Race state =====================
const raceCanvas = document.getElementById('race-canvas');
const rctx = raceCanvas.getContext('2d');
let viewScale = 1;

let race = null;

function makeCoins(track) {
  return track.segments.flatMap((type, i) => coinsForSegment(track, type, i));
}
function coinsForSegment(track, type, i) {
  const coins = [];
  {
    const s0 = START_PAD + i * SEG_LEN;
    if (type === 'cave' || type === 'rocks') return coins;
    if (type === 'water') {
      // one coin floating over each log — reward for the brave jumper
      [0.36, 0.53, 0.70].forEach(f => {
        const cx = s0 + SEG_LEN * f;
        coins.push({ x: cx, y: track.surface(cx) - 70, got: false });
      });
      return coins;
    }
    if (type === 'steep') {
      // treasure on the plateau
      for (let k = 0; k < 3; k++) {
        const cx = s0 + SEG_LEN * (0.55 + k * 0.02);
        coins.push({ x: cx, y: track.ground(cx) - 55, got: false });
      }
      return coins;
    }
    if (type === 'coins') {
      // a generous wavy line of coins across the whole segment,
      // low enough to grab just by driving through
      for (let k = 0; k < 10; k++) {
        const cx = s0 + 90 + k * 78;
        coins.push({ x: cx, y: track.ground(cx) - 55 - 20 * Math.abs(Math.sin(k * 0.9)), got: false });
      }
    } else if (type === 'jump') {
      // coins along the flight path after the ramp crest
      const crestX = s0 + 370 + 168;
      const crestY = track.ground(crestX);
      for (let k = 0; k < 4; k++) {
        coins.push({ x: crestX + 60 + k * 75, y: crestY - 45 + k * 16, got: false });
      }
    } else if (Math.random() < 0.45) {
      const cx = s0 + 330 + Math.random() * 200;
      for (let k = 0; k < 3; k++) {
        coins.push({ x: cx + k * 55, y: track.ground(cx + k * 55) - 55, got: false });
      }
    }
  }
  return coins;
}
function makeOpponents() {
  // rivals keep pace with his engine upgrades so wins stay earned
  const engine = gearItem('engines', save.gear.engine);
  const D = currentDifficulty();
  const mult = D.oppMult * (1 + (engine.speed - 1) * 0.7);
  return OPP_BASE_SPEED.map((sp, i) => ({
    name: OPP_NAMES[i],
    speed: sp * mult * (0.95 + Math.random() * 0.12),
    // rivals start ahead — races are chases (slowest gets the biggest lead)
    x: 200 + D.headStart * (1 - i * 0.3),
    slowUntil: 0,
    design: { body: i === 2 ? 'sporty' : i === 1 ? 'sedan' : 'truck', colors: { body: OPP_COLORS[i], accent: '#ffffff', window: '#111' }, decal: 'stripe', spoiler: i === 2 },
  }));
}

// Set by the builder screen before launching a race on a custom track.
let pendingSegments = null;
let pendingOpts = null;      // { mode: 'race'|'drive', seed } from multiplayer
let currentSegments = null;
let currentCustom = false;
let currentOpts = null;
function startCustomRace(segs, opts) {
  pendingSegments = segs.slice();
  pendingOpts = opts || null;
  showScreen('race');
}

// keepTrack=true reuses the last track (retry / race again);
// otherwise every race gets a freshly generated one.
function initRace(keepTrack) {
  if (pendingSegments) {
    currentSegments = pendingSegments;
    currentCustom = true;
    currentOpts = pendingOpts;
    pendingSegments = null;
    pendingOpts = null;
  } else if (!(keepTrack && currentSegments)) {
    currentSegments = randomSegments();
    currentCustom = false;
    currentOpts = null;
  }
  const mode = (currentOpts && currentOpts.mode) || 'race';
  const track = buildTrack(currentSegments, currentOpts ? currentOpts.seed : undefined);
  terra = track;
  const hearts = currentDifficulty().hearts;
  const startPose = groundPose(200);
  const engine = gearItem('engines', save.gear.engine);
  const tyres = gearItem('tyres', save.gear.tyres);
  race = {
    track,
    mode,                       // 'race' or endless 'drive'
    milestone: 0,               // last spoken distance milestone (drive mode)
    customTrack: currentCustom,
    maxHearts: hearts,
    maxSpeed: MAX_SPEED * engine.speed * tyres.speed,
    accel: ACCEL * engine.speed,
    slopeK: tyres.slope,
    grip: tyres.grip,
    engineLevel: engine.id,
    rocks: [],
    rockTimer: 1,
    waterStuckTimer: 0,
    steepFails: 0,
    steepFailCooldown: 0,
    magicBoost: 0,
    state: 'countdown', // countdown | running | paused | crashed | finished
    countdownVal: 3,
    countdownTimer: 0,
    hearts,
    coins: 0,
    elapsed: 0,
    car: {
      x: 200, y: startPose.y, vx: 0, vy: 0,
      angle: startPose.slope, angVel: 0,
      grounded: true, wheelSpin: 0, vyGround: 0,
      stunTimer: 0, bonkCooldown: 0,
    },
    camX: 0, camY: 0, camInit: false,
    coinsList: makeCoins(track),
    opponents: mode === 'drive' ? [] : makeOpponents(),
    input: { gas: false, brake: false },
    flash: 0,
    missiles: [],
    booms: [],
    fireCooldown: 0,
    particles: [],
    trailTimer: 0,
    magnet: save.gear.gadgets.includes('magnet'),
    shieldCharge: save.gear.gadgets.includes('shield') ? 1 : 0,
    hornCooldown: 0,
  };
  // FIRE button only for weapon cars (tanks)
  document.getElementById('fire-btn').classList.toggle('hidden', !getDesign(save.selected).weapon);
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('result-overlay').classList.add('hidden');
  // dice = "give me a different track" — not offered on tracks he built himself
  document.getElementById('btn-newtrack').classList.toggle('hidden', currentCustom);
  document.getElementById('btn-pause-newtrack').classList.toggle('hidden', currentCustom);
  document.getElementById('btn-countdown-newtrack').classList.toggle('hidden', currentCustom);
  // endless drives show an odometer instead of the finish-line progress bar
  document.getElementById('race-track-bar').classList.toggle('hidden', mode === 'drive');
  document.getElementById('distance-hud').classList.toggle('hidden', mode !== 'drive');
  updateHearts();
  updateCoins();
  resizeRaceCanvas();
  startCountdown();
}

function startCountdown() {
  race.state = 'countdown';
  race.countdownVal = 3;
  race.countdownTimer = 0;
  const el = document.getElementById('countdown-overlay');
  document.getElementById('countdown-text').textContent = '3';
  el.classList.remove('hidden');
  SFX.countBeep();
}

function updateHearts() {
  const h = Math.max(race.hearts, 0);
  document.getElementById('hearts').textContent = '❤️'.repeat(h) + '🖤'.repeat(race.maxHearts - h);
}
function updateCoins() {
  document.getElementById('coin-count').textContent = '🪙 ' + race.coins;
}

function resizeRaceCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = raceCanvas.clientWidth, h = raceCanvas.clientHeight;
  raceCanvas.width = w * dpr; raceCanvas.height = h * dpr;
  rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  viewScale = w / VIEW_W;
}
window.addEventListener('resize', () => { if (currentScreen === 'race') resizeRaceCanvas(); });

// ===================== Input: pedals =====================
const gasEl = document.getElementById('gas-pedal');
const brakeEl = document.getElementById('brake-pedal');
function bindPedal(el, prop) {
  const down = (e) => { e.preventDefault(); if (race) race.input[prop] = true; el.classList.add('pressed'); };
  const up = () => { if (race) race.input[prop] = false; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('touchstart', down, { passive: false });
  el.addEventListener('touchend', up);
}
bindPedal(gasEl, 'gas');
bindPedal(brakeEl, 'brake');

// tank missile fire
function fireMissile() {
  if (!race || race.state !== 'running' || race.fireCooldown > 0) return;
  if (!getDesign(save.selected).weapon) return;
  race.fireCooldown = 1.6;
  race.missiles.push({ x: race.car.x + 45, y: race.car.y - 34, vx: Math.max(race.car.vx, 0) + 520 });
  SFX.go();
}
const fireEl = document.getElementById('fire-btn');
fireEl.addEventListener('pointerdown', (e) => { e.preventDefault(); fireMissile(); });
fireEl.addEventListener('touchstart', (e) => { e.preventDefault(); fireMissile(); }, { passive: false });

// horn — always available, sound depends on the equipped horn
let hornReadyAt = 0;
function honk() {
  if (!race || race.state === 'paused' || race.state === 'crashed') return;
  if (performance.now() < hornReadyAt) return;
  hornReadyAt = performance.now() + 450;
  SFX.horn(save.gear.horn);
}
const hornEl = document.getElementById('horn-btn');
hornEl.addEventListener('pointerdown', (e) => { e.preventDefault(); honk(); });
hornEl.addEventListener('touchstart', (e) => { e.preventDefault(); honk(); }, { passive: false });

// keyboard (desktop testing)
window.addEventListener('keydown', (e) => {
  if (!race) return;
  if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'ArrowUp') { race.input.gas = true; gasEl.classList.add('pressed'); }
  if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') { race.input.brake = true; brakeEl.classList.add('pressed'); }
  if (e.code === 'KeyF') fireMissile();
  if (e.code === 'KeyH') honk();
  if (e.code === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (!race) return;
  if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'ArrowUp') { race.input.gas = false; gasEl.classList.remove('pressed'); }
  if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') { race.input.brake = false; brakeEl.classList.remove('pressed'); }
});

// ===================== Pause / Resume / Quit =====================
function togglePause() {
  if (!race) return;
  if (race.state === 'running') {
    race.state = 'paused';
    document.getElementById('pause-overlay').classList.remove('hidden');
  } else if (race.state === 'paused') {
    race.state = 'running';
    document.getElementById('pause-overlay').classList.add('hidden');
  }
}
document.getElementById('btn-pause').addEventListener('click', () => { SFX.click(); togglePause(); });
document.getElementById('btn-resume').addEventListener('click', () => { SFX.click(); togglePause(); });
document.getElementById('btn-quit').addEventListener('click', () => { SFX.click(); showScreen('title'); });

// dice: throw away this track and generate a brand-new one
function rollNewTrack() {
  SFX.click();
  Speech.say("Here's a brand new track!");
  initRace();   // no keepTrack -> fresh random layout
}
document.getElementById('btn-newtrack').addEventListener('click', rollNewTrack);
document.getElementById('btn-pause-newtrack').addEventListener('click', rollNewTrack);
document.getElementById('btn-countdown-newtrack').addEventListener('click', rollNewTrack);

// ===================== Damage =====================
function bonk(pushDown) {
  const car = race.car;
  if (car.bonkCooldown > 0) return;
  if (race.shieldCharge > 0) {
    // the shield eats this hit — no heart lost
    race.shieldCharge = 0;
    car.bonkCooldown = 1.4;
    car.vx *= 0.6;
    if (pushDown) car.vy = Math.max(car.vy, 160);
    race.booms.push({ x: car.x, y: car.y - 20, t: 0, blue: true });
    SFX.click();
    Speech.say('The shield protected you!');
    return;
  }
  car.bonkCooldown = 1.4;
  car.stunTimer = STUN_DURATION;
  race.hearts -= 1;
  race.flash = 1;
  updateHearts();
  SFX.crash();
  if (race.hearts > 0) Speech.say('Ouch! Too fast!');
  if (navigator.vibrate) navigator.vibrate(120);
  car.vx *= 0.35;
  if (pushDown) car.vy = Math.max(car.vy, 160);
  if (race.hearts <= 0) {
    if (race.mode === 'drive') {
      // long drives never end in a crash — the mechanic patches you up
      race.hearts = race.maxHearts;
      updateHearts();
      Speech.say('The magic mechanic fixed your car! Keep driving!');
    } else {
      race.state = 'crashed';
      setTimeout(showCrashOverlay, 400);
    }
  }
}

// ===================== Race update =====================
function updateRace(dt) {
  if (race.state === 'countdown') {
    race.countdownTimer += dt;
    const txt = document.getElementById('countdown-text');
    if (race.countdownTimer > 0.7) {
      race.countdownTimer = 0;
      race.countdownVal -= 1;
      if (race.countdownVal <= 0) {
        txt.textContent = 'GO!';
        SFX.go();
        Speech.say('GO!');
        document.getElementById('countdown-overlay').classList.add('hidden');
        race.state = 'running';
      } else {
        txt.textContent = String(race.countdownVal);
        SFX.countBeep();
      }
    }
    return;
  }
  if (race.state !== 'running') return;

  race.elapsed += dt;
  const car = race.car;
  const inp = race.input;
  if (car.stunTimer > 0) car.stunTimer -= dt;
  if (car.bonkCooldown > 0) car.bonkCooldown -= dt;
  const canDrive = car.stunTimer <= 0;

  // water: submerged when below the surface line inside a water pit
  const waterZone = terra.waterAt ? terra.waterAt(car.x) : null;
  const submerged = waterZone && car.y > terra.surface(car.x) + 6;
  if (race.magicBoost > 0) race.magicBoost -= dt;

  if (car.grounded) {
    const pose = groundPose(car.x, car.y);
    // wheels slip on slopes steeper than the tyres' grip (monster tyres grip best)
    const climbing = pose.slope < 0 && car.vx > -20;
    const slipping = climbing && Math.abs(pose.slope) > race.grip && race.magicBoost <= 0;
    let accelMult = slipping ? 0.15 : 1;
    let speedCap = race.maxSpeed;
    if (submerged) {
      // engine power decides if you can drive under water
      accelMult *= 0.55 + 0.25 * (race.engineLevel - 1);
      speedCap = 200 + 60 * (race.engineLevel - 1);
      car.vx *= Math.max(0, 1 - 0.9 * dt);
    }
    if (race.magicBoost > 0) { accelMult = 3; speedCap = 720; }
    // pedals (extra torque at low speed so gentle climbs never trap the car —
    // but not under water, where engine power is the whole challenge)
    if (canDrive && inp.gas) car.vx += race.accel * accelMult * (car.vx < 220 && !submerged ? 1.8 : 1) * dt;
    if (canDrive && inp.brake) car.vx -= BRAKE_DECEL * dt;
    // gravity along the slope (tyre grip reduces it) + rolling drag
    car.vx += GRAVITY * Math.sin(pose.slope) * dt * race.slopeK;
    car.vx *= Math.max(0, 1 - 0.28 * dt);
    car.vx = Math.min(speedCap, Math.max(REVERSE_MAX, car.vx));

    const prevY = car.y;
    car.x += car.vx * dt;
    const newPose = groundPose(car.x, car.y);

    // Launch when the terrain drops away faster than gravity could pull the
    // car down — preserves the upward velocity gained climbing a bump, so
    // speeding over a crest really sends you flying (and into cave roofs).
    const requiredVy = (newPose.y - prevY) / dt;
    const ballisticVy = (car.vyGround || 0) + GRAVITY * dt;
    if (requiredVy > ballisticVy + 80 * dt && Math.abs(car.vx) > 120) {
      car.grounded = false;
      car.vy = ballisticVy;
      car.angVel = 0;
      car.vyGround = 0;
    } else {
      car.y = newPose.y;
      car.vyGround = requiredVy;
      car.angle += normAngle(newPose.slope - car.angle) * Math.min(1, dt * 12);
    }
  } else {
    // airborne
    if (canDrive) {
      if (inp.gas) car.angVel -= AIR_ROT_ACCEL * dt;   // nose up
      if (inp.brake) car.angVel += AIR_ROT_ACCEL * dt; // nose down
    }
    car.angVel = Math.max(-4, Math.min(4, car.angVel));
    car.angle += car.angVel * dt;
    // water is buoyant: sink slowly, swim sluggishly
    car.vy += GRAVITY * (submerged ? 0.4 : 1) * dt;
    if (submerged) { car.vx *= Math.max(0, 1 - 1.1 * dt); car.vy *= Math.max(0, 1 - 1.4 * dt); }
    car.x += car.vx * dt;
    car.y += car.vy * dt;

    const pose = groundPose(car.x, car.y);
    if (car.y >= pose.y) {
      // landing
      car.y = pose.y;
      car.grounded = true;
      const diff = Math.abs(normAngle(car.angle - pose.slope));
      if (diff > 2.0 && !submerged) {
        car.angle = pose.slope;   // flip back onto wheels
        bonk(false);
      } else if (car.vy > 950 && !submerged) {
        car.angle = pose.slope;
        bonk(false);
      } else if (submerged && diff > 2.0) {
        car.angle = pose.slope;   // water landings are soft — just right the car
      } else {
        car.angle = pose.slope + normAngle(car.angle - pose.slope) * 0.3;
      }
      car.vy = 0;
      car.angVel = 0;
    }
  }

  // cave roof collision
  const ceilY = terra.ceiling(car.x);
  if (isFinite(ceilY) && car.y - CAR_TOP < ceilY) {
    car.y = ceilY + CAR_TOP;
    bonk(true);
    if (!car.grounded && car.vy < 0) car.vy = 120;
  }

  car.wheelSpin += (car.vx / WHEEL_R) * dt;

  // stream our position to the other player in a two-player race
  if (window.MP && MP.state.active) MP.publish(car);

  // opponents advance (missile hits slow them down)
  for (const o of race.opponents) {
    const slowed = race.elapsed < o.slowUntil;
    o.x += o.speed * (slowed ? 0.45 : 1) * dt;
  }

  // missiles (tank cars only)
  if (race.fireCooldown > 0) race.fireCooldown -= dt;
  for (const m of race.missiles) {
    m.x += m.vx * dt;
    if (m.y > terra.ground(m.x) - 8 || m.x > car.x + 1400) { m.dead = true; race.booms.push({ x: m.x, y: terra.ground(m.x) - 12, t: 0 }); continue; }
    for (const o of race.opponents) {
      if (Math.abs(m.x - o.x) < 45 && Math.abs(m.y - (groundPose(o.x).y - 20)) < 70) {
        m.dead = true;
        o.slowUntil = race.elapsed + 3;
        race.booms.push({ x: o.x, y: groundPose(o.x).y - 30, t: 0 });
        SFX.crash();
        break;
      }
    }
  }
  race.missiles = race.missiles.filter(m => !m.dead);
  for (const b of race.booms) b.t += dt;
  race.booms = race.booms.filter(b => b.t < 0.5);

  // ---- water: stuck rescue (engine too weak to swim out) ----
  if (submerged && inp.gas && Math.abs(car.vx) < 45) {
    race.waterStuckTimer += dt;
    if (race.waterStuckTimer > 2.5) {
      race.waterStuckTimer = 0;
      car.bonkCooldown = 0;
      race.shieldCharge = 0;  // rescue costs the heart even with a shield
      bonk(false);
      Speech.say('The water is too deep for this engine! The tow truck carried you across. A bigger engine can drive under water!');
      if (race.state === 'running') {
        car.x = waterZone.end + 80;   // towed to the far bank
        const p = groundPose(car.x, undefined);
        car.y = p.y; car.angle = p.slope; car.vx = 0; car.vy = 0; car.grounded = true;
      }
    }
  } else {
    race.waterStuckTimer = 0;
  }
  // splash-y bubbles while under water
  if (submerged && Math.random() < 0.3) {
    race.particles.push({ x: car.x - 20 + Math.random() * 40, y: car.y - 20, t: 0, seed: Math.random(), kind: 'bubbles' });
  }

  // ---- falling rocks in ravines ----
  const inRockZone = race.track.rockZones.some(z => car.x > z.start - 200 && car.x < z.end);
  if (inRockZone && race.state === 'running') {
    race.rockTimer -= dt;
    if (race.rockTimer <= 0) {
      race.rockTimer = currentDifficulty().rockRate * (0.8 + Math.random() * 0.5);
      const rx = car.x + 320 + Math.random() * 260;
      race.rocks.push({ x: rx, y: terra.ground(rx) - 520, vy: 0, r: 14 + Math.random() * 9, settled: 0 });
    }
  }
  for (const rock of race.rocks) {
    if (rock.settled > 0) { rock.settled += dt; continue; }
    rock.vy += GRAVITY * 0.85 * dt;
    rock.y += rock.vy * dt;
    const gy = terra.ground(rock.x) - rock.r;
    if (rock.y >= gy) { rock.y = gy; rock.settled = 0.001; }
    if (Math.abs(rock.x - car.x) < 42 && Math.abs(rock.y - (car.y - 20)) < 48) {
      rock.settled = 99;
      bonk(false);
    }
  }
  race.rocks = race.rocks.filter(r => r.settled < 2.5 && r.x > car.x - 900);

  // ---- steep wall: coach after failed climbs, magic push after three ----
  if (race.steepFailCooldown > 0) race.steepFailCooldown -= dt;
  const steepZone = race.track.steeps.find(z => car.x > z.start && car.x < z.end);
  if (steepZone && car.grounded && inp.gas && race.steepFailCooldown <= 0) {
    const pose = groundPose(car.x, car.y);
    if (pose.slope < -0.5 && car.vx < 12) {
      race.steepFails += 1;
      race.steepFailCooldown = 3;
      if (race.steepFails >= 3) {
        race.steepFails = 0;
        race.magicBoost = 3;
        Speech.say('Here is a magic push! Wheee!');
        SFX.win();
      } else {
        Speech.say(race.steepFails === 1
          ? 'Too steep! Go super duper fast, or get monster tyres!'
          : 'So close! Monster tyres or a rocket engine can climb this!');
      }
    }
  }

  // hazard warnings (spoken once each, just before arriving; tagged on the
  // zone objects so extending/pruning endless tracks can't confuse them)
  const warnGroups = [
    [race.track.waters, 'Water ahead! Jump on the logs!'],
    [race.track.rockZones, 'Watch out! Falling rocks!'],
    [race.track.steeps, 'A big wall is coming! Go super fast!'],
  ];
  for (const [zones, say] of warnGroups) {
    for (const z of zones) {
      if (!z._hwarned && car.x > z.start - 550 && car.x < z.start) {
        z._hwarned = true;
        Speech.say(say);
      }
    }
  }

  // spoken cave coaching: warn before, praise a clean pass
  for (const z of race.track.caves) {
    if (!z._warned && car.x > z.start - 600 && car.x < z.start) {
      z._warned = true;
      z._entryHearts = race.hearts;
      Speech.say('Slow down! Cave ahead!');
    }
    if (!z._praised && z._warned && car.x > z.end + 50) {
      z._praised = true;
      if (race.hearts === z._entryHearts) Speech.say('Great driving!');
    }
  }

  // coin magnet pulls nearby coins toward the car
  if (race.magnet) {
    for (const c of race.coinsList) {
      if (c.got) continue;
      const dx = c.x - car.x, dy = c.y - car.y;
      if (Math.abs(dx) < 220 && Math.abs(dy) < 180) {
        c.x -= dx * 5 * dt;
        c.y -= dy * 5 * dt;
      }
    }
  }

  // trail particles
  if (race.trailTimer > 0) race.trailTimer -= dt;
  const trail = save.gear.trail;
  if (trail !== 'none' && inp.gas && Math.abs(car.vx) > 140 && race.trailTimer <= 0) {
    race.trailTimer = 0.035;
    race.particles.push({
      x: car.x - 42 + (Math.random() - 0.5) * 10,
      y: car.y - 6 + (Math.random() - 0.5) * 12,
      t: 0,
      seed: Math.random(),
      kind: trail,
    });
    if (race.particles.length > 70) race.particles.shift();
  }
  for (const p of race.particles) p.t += dt;
  race.particles = race.particles.filter(p => p.t < 0.8);

  // coins
  for (const c of race.coinsList) {
    if (!c.got && Math.abs(c.x - car.x) < 60 && Math.abs(c.y - car.y) < 95) {
      c.got = true;
      race.coins += 1;
      updateCoins();
      SFX.coin();
    }
  }

  if (race.flash > 0) race.flash = Math.max(0, race.flash - dt * 3);

  // endless drive: keep growing the world ahead, celebrate distance
  if (race.mode === 'drive') {
    if (car.x > race.track.length - 2600) {
      const seg = race.track.extend();
      race.coinsList.push(...coinsForSegment(race.track, seg.type, seg.i));
      race.coinsList = race.coinsList.filter(c => !c.got && c.x > car.x - 1500);
    }
    const meters = Math.max(0, Math.floor((car.x - 200) / 10));
    if (meters - race.milestone >= 1000) {
      race.milestone += 1000;
      const km = race.milestone / 1000;
      Speech.say(`${km} kilometer${km > 1 ? 's' : ''}! Amazing driving!`);
      SFX.win();
    }
    return; // no finish line on a long drive
  }

  // finish
  if (car.x >= race.track.length && race.state === 'running') {
    race.state = 'finished';
    finishRace();
  }
}

function finishRace() {
  if (window.MP && MP.state.active) MP.reportFinish();
  const results = [{ name: 'You', time: race.elapsed, isPlayer: true }];
  // rivals' projected finish from where they actually are (missile slowdowns count)
  race.opponents.forEach(o => results.push({ name: o.name, time: race.elapsed + (race.track.length - o.x) / o.speed, isPlayer: false }));
  results.sort((a, b) => a.time - b.time);
  const place = results.findIndex(r => r.isPlayer) + 1;
  setTimeout(() => showFinishOverlay(place), 500);
}

// ===================== Rendering =====================
function renderRace() {
  const w = raceCanvas.clientWidth, h = raceCanvas.clientHeight;
  const car = race.car;

  // camera follows the car
  const targetCamX = car.x - VIEW_W * 0.32;
  const targetCamY = car.y - (h / viewScale) * 0.52;
  if (!race.camInit) { race.camX = targetCamX; race.camY = targetCamY; race.camInit = true; }
  race.camX += (targetCamX - race.camX) * 0.15;
  race.camY += (targetCamY - race.camY) * 0.08;

  // sky
  const sky = rctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#7ec8ff');
  sky.addColorStop(1, '#d9f0ff');
  rctx.fillStyle = sky;
  rctx.fillRect(0, 0, w, h);

  // sun + parallax clouds
  rctx.fillStyle = '#ffd60a';
  rctx.beginPath();
  rctx.arc(w * 0.85, h * 0.15, 36, 0, Math.PI * 2);
  rctx.fill();
  rctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 700 - race.camX * 0.25) % (VIEW_W + 400) + VIEW_W + 400) % (VIEW_W + 400) - 200;
    const cy = 60 + (i % 2) * 55;
    rctx.beginPath();
    rctx.ellipse(cx * viewScale, cy, 46, 18, 0, 0, Math.PI * 2);
    rctx.ellipse(cx * viewScale + 30, cy - 12, 34, 15, 0, 0, Math.PI * 2);
    rctx.fill();
  }

  rctx.save();
  rctx.scale(viewScale, viewScale);
  rctx.translate(-race.camX, -race.camY);

  const x0 = race.camX - 60;
  const x1 = race.camX + VIEW_W + 60;
  const bottomY = race.camY + h / viewScale + 80;

  // terrain
  rctx.beginPath();
  rctx.moveTo(x0, bottomY);
  for (let x = x0; x <= x1; x += 12) rctx.lineTo(x, terra.ground(x));
  rctx.lineTo(x1, bottomY);
  rctx.closePath();
  rctx.fillStyle = '#8b5e34';
  rctx.fill();
  // grass lip
  rctx.beginPath();
  for (let x = x0; x <= x1; x += 12) {
    if (x === x0) rctx.moveTo(x, terra.ground(x));
    else rctx.lineTo(x, terra.ground(x));
  }
  rctx.strokeStyle = '#57a639';
  rctx.lineWidth = 12;
  rctx.stroke();

  // caves
  for (const z of race.track.caves) {
    if (z.end < x0 || z.start > x1) continue;
    const cx0 = Math.max(x0, z.start - 140);
    const cx1 = Math.min(x1, z.end + 140);
    // dark interior
    rctx.beginPath();
    rctx.moveTo(cx0, terra.ceiling(cx0) === -Infinity ? terra.ground(cx0) : terra.ceiling(cx0));
    for (let x = cx0; x <= cx1; x += 12) {
      const cy = terra.ceiling(x);
      rctx.lineTo(x, cy === -Infinity ? terra.ground(x) - 400 : cy);
    }
    for (let x = cx1; x >= cx0; x -= 12) rctx.lineTo(x, terra.ground(x));
    rctx.closePath();
    rctx.fillStyle = 'rgba(20, 18, 34, 0.5)';
    rctx.fill();
    // rock roof
    rctx.beginPath();
    rctx.moveTo(cx0, race.camY - 100);
    for (let x = cx0; x <= cx1; x += 12) {
      const cy = terra.ceiling(x);
      rctx.lineTo(x, cy === -Infinity ? race.camY - 100 : cy);
    }
    rctx.lineTo(cx1, race.camY - 100);
    rctx.closePath();
    rctx.fillStyle = '#5a4632';
    rctx.fill();
    // stalactites
    rctx.fillStyle = '#4a3826';
    for (let x = z.start + 60; x < z.end - 40; x += 110) {
      if (x < x0 || x > x1) continue;
      const cy = terra.ceiling(x);
      if (!isFinite(cy)) continue;
      rctx.beginPath();
      rctx.moveTo(x - 14, cy);
      rctx.lineTo(x + 14, cy);
      rctx.lineTo(x, cy + 30);
      rctx.closePath();
      rctx.fill();
    }
    // SLOW! warning sign before the entrance
    const signX = z.start - 220;
    if (signX > x0 && signX < x1) {
      const gy = terra.ground(signX);
      rctx.fillStyle = '#8d6e4b';
      rctx.fillRect(signX - 4, gy - 70, 8, 70);
      rctx.fillStyle = '#ffd60a';
      rctx.strokeStyle = '#e63946';
      rctx.lineWidth = 5;
      rctx.beginPath();
      rctx.moveTo(signX, gy - 130);
      rctx.lineTo(signX + 38, gy - 66);
      rctx.lineTo(signX - 38, gy - 66);
      rctx.closePath();
      rctx.fill();
      rctx.stroke();
      rctx.fillStyle = '#1d3557';
      rctx.font = 'bold 17px sans-serif';
      rctx.textAlign = 'center';
      rctx.fillText('SLOW', signX, gy - 76);
    }
  }

  // water pools + floating logs
  for (const z of race.track.waters) {
    if (z.end < x0 || z.start > x1) continue;
    rctx.beginPath();
    rctx.moveTo(z.start, terra.surface(z.start));
    for (let x = z.start; x <= z.end; x += 14) rctx.lineTo(x, terra.surface(x) - 2);
    for (let x = z.end; x >= z.start; x -= 14) rctx.lineTo(x, terra.ground(x) + 4);
    rctx.closePath();
    rctx.fillStyle = 'rgba(50, 140, 235, 0.55)';
    rctx.fill();
    // shimmering surface line
    rctx.strokeStyle = 'rgba(220, 245, 255, 0.8)';
    rctx.lineWidth = 3;
    rctx.beginPath();
    for (let x = z.start; x <= z.end; x += 14) {
      const wy = terra.surface(x) - 2 + Math.sin(x / 40 + performance.now() / 350) * 2;
      x === z.start ? rctx.moveTo(x, wy) : rctx.lineTo(x, wy);
    }
    rctx.stroke();
  }
  for (const p of race.track.platforms) {
    if (p.x + p.half < x0 || p.x - p.half > x1) continue;
    rctx.fillStyle = '#8d6e4b';
    rctx.beginPath();
    rctx.roundRect(p.x - p.half, p.y, p.half * 2, 16, 8);
    rctx.fill();
    rctx.strokeStyle = '#6b5236';
    rctx.lineWidth = 2;
    rctx.stroke();
    // wood end rings
    rctx.fillStyle = '#c9a06a';
    rctx.beginPath();
    rctx.ellipse(p.x + p.half - 4, p.y + 8, 4, 7, 0, 0, Math.PI * 2);
    rctx.fill();
  }

  // falling rocks
  for (const rock of race.rocks) {
    if (rock.x < x0 || rock.x > x1) continue;
    rctx.globalAlpha = rock.settled > 1.5 ? Math.max(0, 1 - (rock.settled - 1.5)) : 1;
    rctx.fillStyle = '#7d7468';
    rctx.beginPath();
    rctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
    rctx.fill();
    rctx.fillStyle = '#5f574c';
    rctx.beginPath();
    rctx.arc(rock.x - rock.r * 0.3, rock.y - rock.r * 0.25, rock.r * 0.4, 0, Math.PI * 2);
    rctx.fill();
    rctx.globalAlpha = 1;
  }

  // hazard warning signs (like the cave SLOW sign)
  const hazardSigns = [
    ...race.track.waters.map(z => ({ x: z.start - 200, txt: 'SPLASH' })),
    ...race.track.rockZones.map(z => ({ x: z.start - 150, txt: 'ROCKS' })),
    ...race.track.steeps.map(z => ({ x: z.start - 60, txt: 'STEEP' })),
  ];
  for (const sign of hazardSigns) {
    if (sign.x < x0 || sign.x > x1) continue;
    const gy = terra.ground(sign.x);
    rctx.fillStyle = '#8d6e4b';
    rctx.fillRect(sign.x - 4, gy - 70, 8, 70);
    rctx.fillStyle = '#ffd60a';
    rctx.strokeStyle = '#e63946';
    rctx.lineWidth = 5;
    rctx.beginPath();
    rctx.moveTo(sign.x, gy - 130);
    rctx.lineTo(sign.x + 38, gy - 66);
    rctx.lineTo(sign.x - 38, gy - 66);
    rctx.closePath();
    rctx.fill();
    rctx.stroke();
    rctx.fillStyle = '#1d3557';
    rctx.font = 'bold 14px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillText(sign.txt, sign.x, gy - 76);
  }

  // finish line
  const FIN = race.track.length;
  if (FIN > x0 && FIN < x1 + 300) {
    const gy = terra.ground(FIN);
    rctx.fillStyle = '#333';
    rctx.fillRect(FIN - 3, gy - 170, 6, 170);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        rctx.fillStyle = (r + c) % 2 ? '#111' : '#fff';
        rctx.fillRect(FIN + 3 + c * 14, gy - 170 + r * 14, 14, 14);
      }
    }
  }

  // coins
  for (const c of race.coinsList) {
    if (c.got || c.x < x0 || c.x > x1) continue;
    const squash = 0.55 + 0.45 * Math.abs(Math.sin(performance.now() / 300 + c.x));
    rctx.fillStyle = '#ffbf00';
    rctx.beginPath();
    rctx.ellipse(c.x, c.y, 14 * squash, 14, 0, 0, Math.PI * 2);
    rctx.fill();
    rctx.strokeStyle = '#b07d00';
    rctx.lineWidth = 3;
    rctx.stroke();
  }

  // opponents
  for (const o of race.opponents) {
    const ox = Math.min(o.x, race.track.length + 100);
    if (ox < x0 - 100 || ox > x1 + 100) continue;
    const pose = groundPose(ox);
    drawCar(rctx, o.design, ox, pose.y, CAR_SCALE * 0.95, pose.slope, (ox / WHEEL_R));
    if (race.elapsed < o.slowUntil) {
      // smoke puffs over a missile-slowed rival
      rctx.fillStyle = 'rgba(90,90,90,0.6)';
      for (let i = 0; i < 3; i++) {
        rctx.beginPath();
        rctx.arc(ox - 10 + i * 14, pose.y - 55 - Math.sin(performance.now() / 120 + i) * 6, 8 + i * 2, 0, Math.PI * 2);
        rctx.fill();
      }
    }
  }

  // missiles + explosions
  for (const m of race.missiles) {
    rctx.save();
    rctx.translate(m.x, m.y);
    rctx.fillStyle = '#495057';
    rctx.beginPath();
    rctx.roundRect(-14, -5, 24, 10, 4);
    rctx.fill();
    rctx.fillStyle = '#e63946';
    rctx.beginPath();
    rctx.moveTo(10, -5); rctx.lineTo(20, 0); rctx.lineTo(10, 5);
    rctx.closePath(); rctx.fill();
    rctx.fillStyle = '#ff7b00';
    rctx.beginPath();
    rctx.moveTo(-14, -3); rctx.lineTo(-24 - Math.random() * 6, 0); rctx.lineTo(-14, 3);
    rctx.closePath(); rctx.fill();
    rctx.restore();
  }
  for (const b of race.booms) {
    const r = 18 + b.t * 130;
    rctx.globalAlpha = Math.max(0, 1 - b.t * 2);
    rctx.fillStyle = b.blue ? '#2b6cff' : '#ff7b00';
    rctx.beginPath(); rctx.arc(b.x, b.y, r, 0, Math.PI * 2); rctx.fill();
    rctx.fillStyle = b.blue ? '#a8dadc' : '#ffd60a';
    rctx.beginPath(); rctx.arc(b.x, b.y, r * 0.55, 0, Math.PI * 2); rctx.fill();
    rctx.globalAlpha = 1;
  }

  // boost trail particles
  for (const p of race.particles) {
    const fade = 1 - p.t / 0.8;
    rctx.globalAlpha = fade;
    if (p.kind === 'rainbow') {
      rctx.fillStyle = `hsl(${(p.seed * 360 + p.t * 90) % 360}, 90%, 60%)`;
      rctx.beginPath(); rctx.arc(p.x, p.y, 7 + p.t * 6, 0, Math.PI * 2); rctx.fill();
    } else if (p.kind === 'bubbles') {
      rctx.strokeStyle = 'rgba(160, 220, 255, 0.95)';
      rctx.lineWidth = 2.5;
      rctx.beginPath(); rctx.arc(p.x, p.y - p.t * 55, 5 + p.seed * 6, 0, Math.PI * 2); rctx.stroke();
    } else if (p.kind === 'stars') {
      rctx.save();
      rctx.translate(p.x, p.y - p.t * 20);
      rctx.rotate(p.seed * 6 + p.t * 5);
      rctx.fillStyle = '#ffd60a';
      drawStar(rctx, 0, 0, 6 + p.seed * 4);
      rctx.restore();
    } else if (p.kind === 'fire') {
      rctx.fillStyle = p.seed > 0.5 ? '#ff7b00' : '#ffd60a';
      rctx.beginPath(); rctx.arc(p.x, p.y - p.t * 45, 8 * fade + 2, 0, Math.PI * 2); rctx.fill();
    }
    rctx.globalAlpha = 1;
  }

  // shield bubble around the car while charged
  if (race.shieldCharge > 0) {
    const pulse = 1 + 0.05 * Math.sin(performance.now() / 200);
    rctx.strokeStyle = 'rgba(43, 108, 255, 0.55)';
    rctx.fillStyle = 'rgba(43, 108, 255, 0.10)';
    rctx.lineWidth = 3;
    rctx.beginPath();
    rctx.arc(race.car.x, race.car.y - 18, 62 * pulse, 0, Math.PI * 2);
    rctx.fill();
    rctx.stroke();
  }

  // the other human player's car (two-player race)
  if (window.MP && MP.state.active && MP.state.remote) {
    const r = MP.state.remote;
    if (!MP.state.remoteDisp) MP.state.remoteDisp = { x: r.x, y: r.y, a: r.a || 0 };
    const d = MP.state.remoteDisp;
    d.x += (r.x - d.x) * 0.2;
    d.y += (r.y - d.y) * 0.2;
    d.a += ((r.a || 0) - d.a) * 0.2;
    // custom-built cars travel as a design snapshot the other device can draw
    drawCar(rctx, r.design || getDesign(r.car), d.x, d.y, CAR_SCALE, d.a, d.x / WHEEL_R);
    rctx.fillStyle = '#1d3557';
    rctx.font = 'bold 16px sans-serif';
    rctx.textAlign = 'center';
    rctx.fillText('⭐ Player 2', d.x, d.y - 60);
  }

  // player car
  const design = getDesign(save.selected);
  const boosting = race.state === 'running' && race.input.gas && race.engineLevel >= 2;
  drawCar(rctx, design, car.x, car.y, CAR_SCALE, car.angle, car.wheelSpin, playerEquip(boosting));
  // speed dust when grounded and fast
  if (car.grounded && car.vx > 300) {
    rctx.fillStyle = 'rgba(180, 150, 110, 0.5)';
    for (let i = 0; i < 3; i++) {
      rctx.beginPath();
      rctx.arc(car.x - 40 - i * 18, car.y + 8 + Math.sin(performance.now() / 60 + i) * 5, 8 + i * 3, 0, Math.PI * 2);
      rctx.fill();
    }
  }

  rctx.restore();

  // underwater tint over the whole view
  if (terra.waterAt && terra.waterAt(car.x) && car.y > terra.surface(car.x) + 6) {
    rctx.fillStyle = 'rgba(40, 120, 210, 0.22)';
    rctx.fillRect(0, 0, w, h);
  }

  // damage flash
  document.getElementById('flash-overlay').style.opacity = race.flash * 0.5;

  // HUD: odometer on long drives, progress markers in races
  if (race.mode === 'drive') {
    document.getElementById('distance-hud').textContent = '🛣 ' + Math.max(0, Math.floor((car.x - 200) / 10)) + ' m';
  } else {
    document.getElementById('marker-player').style.left = Math.min(100, (car.x / race.track.length) * 100) + '%';
    race.opponents.forEach((o, i) => {
      const pct = Math.min(100, (o.x / race.track.length) * 100);
      document.getElementById('marker-opp' + i).style.left = pct + '%';
    });
  }
}

// ===================== Overlays: crash / finish =====================
function showCrashOverlay() {
  save.coins += race.coins;
  persist();
  const panel = document.getElementById('result-panel');
  panel.innerHTML = `
    <h2>💥 Oh no! Let's try again!</h2>
    ${race.coins ? `<p style="font-size:18px;color:#b07d00;font-weight:700;">You kept your 🪙 ${race.coins} coins!</p>` : ''}
    <button id="btn-retry" class="big-btn">🔄 Try Again</button>
    <button id="btn-result-home" class="big-btn gray">🏠 Home</button>
  `;
  document.getElementById('result-overlay').classList.remove('hidden');
  SFX.lose();
  Speech.say("Oh no! Let's try again!");
  document.getElementById('btn-retry').addEventListener('click', () => { SFX.click(); initRace(true); });
  document.getElementById('btn-result-home').addEventListener('click', () => { SFX.click(); showScreen('title'); });
}

function showFinishOverlay(place) {
  save.coins += race.coins;
  persist();
  const panel = document.getElementById('result-panel');
  const suffix = place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th';
  let bodyHtml = '';
  let unlocked = null;
  if (place === 1) {
    save.wins += 1;
    save.winProgress = (save.winProgress || 0) + 1;
    const needed = winsNeededForNextCar();
    const allDone = save.unlocked.length >= CAR_DESIGNS.length;
    if (!allDone && save.winProgress >= needed) {
      unlocked = unlockNext();
      if (unlocked) save.winProgress = 0;
    }
    persist();
    SFX.win();
    if (unlocked) {
      Speech.say(`You won the race! New car! ${unlocked.name}!`);
      bodyHtml = `
        <h2>🏆 You Won 1st Place!</h2>
        <p style="font-size:20px;color:#1d3557;font-weight:700;">New car unlocked!</p>
        <canvas id="unlock-canvas" width="160" height="120"></canvas>
        <p style="font-size:22px;color:#e63946;font-weight:800;">${unlocked.name}</p>
      `;
    } else if (allDone) {
      Speech.say('You won the race! You have every car! You are the champion!');
      bodyHtml = `
        <h2>🏆 You Won 1st Place!</h2>
        <p style="font-size:20px;color:#1d3557;font-weight:700;">You've unlocked every car! You're a champion! 🎉</p>
      `;
    } else {
      const left = needed - save.winProgress;
      Speech.say(`You won the race! Win ${left} more ${left === 1 ? 'race' : 'races'} to get a new car!`);
      bodyHtml = `
        <h2>🏆 You Won 1st Place!</h2>
        <p style="font-size:20px;color:#1d3557;font-weight:700;">
          ${'⭐'.repeat(save.winProgress)}${'☆'.repeat(left)}<br>
          Win ${left} more ${left === 1 ? 'race' : 'races'} for a new car!
        </p>
      `;
    }
  } else {
    bodyHtml = `
      <h2>🏁 You finished ${place}${suffix} place!</h2>
      <p style="font-size:18px;color:#1d3557;">Win 1st place to unlock a new car. Try again!</p>
    `;
    SFX.lose();
    Speech.say('Good try! Race again and win a new car!');
  }
  bodyHtml += `<p style="font-size:18px;color:#b07d00;font-weight:700;">🪙 +${race.coins} coins · You have ${save.coins} — spend them in the Workshop!</p>`;
  const isMP = window.MP && MP.state.active;
  if (isMP) {
    const won = MP.iWon();
    bodyHtml = `<p style="font-size:22px;font-weight:800;color:${won ? '#2a9d4f' : '#e63946'};">
      ${won ? '🏆 You finished before Player 2!' : '⭐ Player 2 finished first! Good race!'}</p>` + bodyHtml;
    Speech.say(won ? 'You beat player two! Amazing!' : 'Player two was faster this time! Race again!', { interrupt: false });
  }
  panel.innerHTML = bodyHtml + `
    <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
      ${isMP
        ? '<button id="btn-result-multi" class="big-btn">👥 Race Again</button>'
        : `<button id="btn-race-again" class="big-btn">🔄 Race Again</button>
           ${race.customTrack
             ? '<button id="btn-result-build" class="big-btn orange">🧱 Build Again</button>'
             : '<button id="btn-result-newtrack" class="big-btn orange">🎲 New Track</button>'}
           <button id="btn-result-garage" class="big-btn blue">🚗 Garage</button>`}
      <button id="btn-result-home" class="big-btn gray">🏠 Home</button>
    </div>
  `;
  document.getElementById('result-overlay').classList.remove('hidden');
  if (unlocked) {
    SFX.unlockCar();
    const cvs = document.getElementById('unlock-canvas');
    if (cvs) drawCar(cvs.getContext('2d'), unlocked, 80, 78, 2.2, 0, 0);
  }
  const againBtn = document.getElementById('btn-race-again');
  if (againBtn) againBtn.addEventListener('click', () => { SFX.click(); initRace(true); });
  const buildBtn = document.getElementById('btn-result-build');
  if (buildBtn) buildBtn.addEventListener('click', () => { SFX.click(); showScreen('build'); });
  const newTrackBtn = document.getElementById('btn-result-newtrack');
  if (newTrackBtn) newTrackBtn.addEventListener('click', rollNewTrack);
  const multiBtn = document.getElementById('btn-result-multi');
  if (multiBtn) multiBtn.addEventListener('click', () => { SFX.click(); MP.leave(); showScreen('multi'); });
  const garageBtn = document.getElementById('btn-result-garage');
  if (garageBtn) garageBtn.addEventListener('click', () => { SFX.click(); showScreen('garage'); });
  document.getElementById('btn-result-home').addEventListener('click', () => { SFX.click(); showScreen('title'); });
}

// ===================== Main loop =====================
let lastTime = performance.now();
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (currentScreen === 'race' && race) {
    updateRace(dt);
    renderRace();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ===================== Init =====================
renderTitle();

// arriving via a shared track link? race it straight away
(() => {
  const code = new URLSearchParams(location.search).get('track');
  if (!code) return;
  const segs = decodeTrack(code);
  history.replaceState(null, '', location.pathname);  // keep the URL clean afterwards
  if (segs) {
    pendingSegments = segs;
    showScreen('race');
  }
})();
