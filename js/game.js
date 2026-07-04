// ===================== Save data =====================
const STORAGE_KEY = 'twr_save_v1';
function defaultSave() {
  return { unlocked: [CAR_DESIGNS[0].id, CAR_DESIGNS[1].id], selected: CAR_DESIGNS[0].id, wins: 0 };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(defaultSave(), JSON.parse(raw));
  } catch (e) {}
  return defaultSave();
}
let save = loadSave();
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); }

function getDesign(id) { return CAR_DESIGNS.find(c => c.id === id) || CAR_DESIGNS[0]; }
function isUnlocked(id) { return save.unlocked.includes(id); }
function unlockNext() {
  const next = CAR_DESIGNS.find(c => !save.unlocked.includes(c.id));
  if (next) { save.unlocked.push(next.id); persist(); }
  return next || null;
}

// ===================== Screen management =====================
const screens = {
  title: document.getElementById('screen-title'),
  garage: document.getElementById('screen-garage'),
  race: document.getElementById('screen-race'),
  listen: document.getElementById('screen-listen'),
};
let currentScreen = 'title';
function showScreen(name) {
  currentScreen = name;
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  if (name === 'title') renderTitle();
  if (name === 'garage') renderGarage();
  if (name === 'race') initRace();
  if (name === 'listen' && window.initListen) window.initListen();
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
  drawCar(tctx, design, w / 2, h / 2 + 14 * s, s, 0, 0);
}
document.getElementById('btn-play').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('race'); });
document.getElementById('btn-garage').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('garage'); });
document.getElementById('btn-listen').addEventListener('click', () => { SFX.unlock(); SFX.click(); showScreen('listen'); });

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
      if (unlocked) drawCar(cctx, design, w / 2, h / 2 + 12 * s, s, 0, 0);
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
const TRACK_LENGTH = 8000;          // world px to the finish line
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

const CAVE_ZONES_TEMPLATE = [
  { start: 2400, end: 3300 },
  { start: 4600, end: 5500 },
  { start: 6600, end: 7400 },
];
const CAVE_CLEARANCE = 115;         // roof height above the base floor inside caves

const OPP_NAMES = ['Rusty', 'Bolt', 'Turbo Rex'];
const OPP_COLORS = ['#b5651d', '#2b6cff', '#2a9d4f'];
const OPP_BASE_SPEED = [200, 260, 320];

// ===================== Terrain =====================
// Heightfield: worldY (canvas y, down = positive) of the ground at world x.
// Rebuilt with random phases each race.
let terra = null;
function buildTerrain() {
  const p1 = Math.random() * Math.PI * 2;
  const p2 = Math.random() * Math.PI * 2;
  const p3 = Math.random() * Math.PI * 2;
  const baseY = 420;
  // rolling hills WITHOUT the cave floor bumps (the cave roof hangs from this)
  const groundBase = (x) => {
    const ramp = Math.min(1, Math.max(0, (x - 350) / 900)); // flat start
    let y = baseY;
    y += ramp * 48 * Math.sin(x / 99 * 1.0 + p1) * Math.sin(x / 631 + p2);
    y += ramp * 30 * Math.sin(x / 151 + p2);
    y += ramp * 9 * Math.sin(x / 53 + p3);
    return y;
  };
  // Ramp kickers: linear climb then a sharp drop, so a fast car leaves the
  // crest still carrying its climb velocity and flies up — into cave roofs
  // if it's going too fast, or into fun open-air jumps outside them.
  const ramps = [];
  for (const z of CAVE_ZONES_TEMPLATE) {
    const len = z.end - z.start;
    ramps.push({ x: z.start + len * 0.28, L: 110, H: 50 });
    ramps.push({ x: z.start + len * 0.62, L: 110, H: 50 });
  }
  ramps.push({ x: 1500, L: 170, H: 70 });  // open-air jump ramps
  ramps.push({ x: 4000, L: 170, H: 70 });
  ramps.push({ x: 6100, L: 170, H: 70 });
  const ground = (x) => {
    let y = groundBase(x);
    for (const r of ramps) {
      const u = x - r.x;
      if (u > 0 && u < r.L) y -= r.H * (u / r.L);
    }
    return y;
  };
  // cave roof: canvas y of the ceiling (or -Infinity meaning "open sky").
  // Hangs from the smooth base line so floor bumps pinch the gap.
  const ceiling = (x) => {
    for (const z of CAVE_ZONES_TEMPLATE) {
      const fadeIn = (x - z.start) / 130;
      const fadeOut = (z.end - x) / 130;
      const t = Math.min(fadeIn, fadeOut);
      if (t > 0) {
        const clear = CAVE_CLEARANCE + Math.max(0, (1 - t)) * 320;
        return groundBase(x) - clear;
      }
    }
    return -Infinity;
  };
  const inCave = (x) => CAVE_ZONES_TEMPLATE.some(z => x > z.start && x < z.end);
  terra = { ground, groundBase, ceiling, inCave };
}

function groundPose(x) {
  const gy1 = terra.ground(x - WHEEL_X);
  const gy2 = terra.ground(x + WHEEL_X);
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

function makeCoins() {
  const coins = [];
  for (let x = 800; x < TRACK_LENGTH - 300; x += 420 + Math.random() * 260) {
    // keep coins out of caves so they don't overlap the rock roof
    if (CAVE_ZONES_TEMPLATE.some(z => x + 160 > z.start - 150 && x < z.end + 150)) continue;
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 55;
      coins.push({ x: cx, y: terra.ground(cx) - 85, got: false });
    }
  }
  return coins;
}
function makeOpponents() {
  return OPP_BASE_SPEED.map((sp, i) => ({
    name: OPP_NAMES[i],
    speed: sp * (0.95 + Math.random() * 0.12),
    design: { body: i === 2 ? 'sporty' : i === 1 ? 'sedan' : 'truck', colors: { body: OPP_COLORS[i], accent: '#ffffff', window: '#111' }, decal: 'stripe', spoiler: i === 2 },
  }));
}

function initRace() {
  buildTerrain();
  const startPose = groundPose(200);
  race = {
    state: 'countdown', // countdown | running | paused | crashed | finished
    countdownVal: 3,
    countdownTimer: 0,
    hearts: 3,
    coins: 0,
    elapsed: 0,
    car: {
      x: 200, y: startPose.y, vx: 0, vy: 0,
      angle: startPose.slope, angVel: 0,
      grounded: true, wheelSpin: 0, vyGround: 0,
      stunTimer: 0, bonkCooldown: 0,
    },
    camX: 0, camY: 0, camInit: false,
    coinsList: makeCoins(),
    opponents: makeOpponents(),
    input: { gas: false, brake: false },
    flash: 0,
    caveWarned: CAVE_ZONES_TEMPLATE.map(() => false),
    caveEntryHearts: CAVE_ZONES_TEMPLATE.map(() => null),
    cavePraised: CAVE_ZONES_TEMPLATE.map(() => false),
  };
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('result-overlay').classList.add('hidden');
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
  document.getElementById('hearts').textContent = '❤️'.repeat(Math.max(race.hearts, 0)) + '🖤'.repeat(3 - Math.max(race.hearts, 0));
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

// keyboard (desktop testing)
window.addEventListener('keydown', (e) => {
  if (!race) return;
  if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'ArrowUp') { race.input.gas = true; gasEl.classList.add('pressed'); }
  if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') { race.input.brake = true; brakeEl.classList.add('pressed'); }
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

// ===================== Damage =====================
function bonk(pushDown) {
  const car = race.car;
  if (car.bonkCooldown > 0) return;
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
    race.state = 'crashed';
    setTimeout(showCrashOverlay, 400);
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

  if (car.grounded) {
    const pose = groundPose(car.x);
    // pedals (extra torque at low speed so steep climbs never trap the car)
    if (canDrive && inp.gas) car.vx += ACCEL * (car.vx < 220 ? 1.8 : 1) * dt;
    if (canDrive && inp.brake) car.vx -= BRAKE_DECEL * dt;
    // gravity along the slope + rolling drag
    car.vx += GRAVITY * Math.sin(pose.slope) * dt * 0.6;
    car.vx *= Math.max(0, 1 - 0.28 * dt);
    car.vx = Math.min(MAX_SPEED, Math.max(REVERSE_MAX, car.vx));

    const prevY = car.y;
    car.x += car.vx * dt;
    const newPose = groundPose(car.x);

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
    car.vy += GRAVITY * dt;
    car.x += car.vx * dt;
    car.y += car.vy * dt;

    const pose = groundPose(car.x);
    if (car.y >= pose.y) {
      // landing
      car.y = pose.y;
      car.grounded = true;
      const diff = Math.abs(normAngle(car.angle - pose.slope));
      if (diff > 2.0) {
        car.angle = pose.slope;   // flip back onto wheels
        bonk(false);
      } else if (car.vy > 950) {
        car.angle = pose.slope;
        bonk(false);
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

  // spoken cave coaching: warn before, praise a clean pass
  CAVE_ZONES_TEMPLATE.forEach((z, i) => {
    if (!race.caveWarned[i] && car.x > z.start - 600 && car.x < z.start) {
      race.caveWarned[i] = true;
      race.caveEntryHearts[i] = race.hearts;
      Speech.say('Slow down! Cave ahead!');
    }
    if (!race.cavePraised[i] && race.caveWarned[i] && car.x > z.end + 50) {
      race.cavePraised[i] = true;
      if (race.hearts === race.caveEntryHearts[i]) Speech.say('Great driving!');
    }
  });

  // coins
  for (const c of race.coinsList) {
    if (!c.got && Math.abs(c.x - car.x) < 50 && Math.abs(c.y - car.y) < 70) {
      c.got = true;
      race.coins += 1;
      updateCoins();
      SFX.coin();
    }
  }

  if (race.flash > 0) race.flash = Math.max(0, race.flash - dt * 3);

  // finish
  if (car.x >= TRACK_LENGTH && race.state === 'running') {
    race.state = 'finished';
    finishRace();
  }
}

function finishRace() {
  const results = [{ name: 'You', time: race.elapsed, isPlayer: true }];
  race.opponents.forEach(o => results.push({ name: o.name, time: TRACK_LENGTH / o.speed, isPlayer: false }));
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
  for (const z of CAVE_ZONES_TEMPLATE) {
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

  // finish line
  if (TRACK_LENGTH > x0 && TRACK_LENGTH < x1 + 300) {
    const gy = terra.ground(TRACK_LENGTH);
    rctx.fillStyle = '#333';
    rctx.fillRect(TRACK_LENGTH - 3, gy - 170, 6, 170);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        rctx.fillStyle = (r + c) % 2 ? '#111' : '#fff';
        rctx.fillRect(TRACK_LENGTH + 3 + c * 14, gy - 170 + r * 14, 14, 14);
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
    const ox = Math.min(o.speed * race.elapsed, TRACK_LENGTH + 100);
    if (ox < x0 - 100 || ox > x1 + 100) continue;
    const pose = groundPose(ox);
    drawCar(rctx, o.design, ox, pose.y, CAR_SCALE * 0.95, pose.slope, (ox / WHEEL_R));
  }

  // player car
  const design = getDesign(save.selected);
  drawCar(rctx, design, car.x, car.y, CAR_SCALE, car.angle, car.wheelSpin);
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

  // damage flash
  document.getElementById('flash-overlay').style.opacity = race.flash * 0.5;

  // HUD progress markers
  document.getElementById('marker-player').style.left = Math.min(100, (car.x / TRACK_LENGTH) * 100) + '%';
  race.opponents.forEach((o, i) => {
    const pct = Math.min(100, ((o.speed * race.elapsed) / TRACK_LENGTH) * 100);
    document.getElementById('marker-opp' + i).style.left = pct + '%';
  });
}

// ===================== Overlays: crash / finish =====================
function showCrashOverlay() {
  const panel = document.getElementById('result-panel');
  panel.innerHTML = `
    <h2>💥 Oh no! Let's try again!</h2>
    <button id="btn-retry" class="big-btn">🔄 Try Again</button>
    <button id="btn-result-home" class="big-btn gray">🏠 Home</button>
  `;
  document.getElementById('result-overlay').classList.remove('hidden');
  SFX.lose();
  Speech.say("Oh no! Let's try again!");
  document.getElementById('btn-retry').addEventListener('click', () => { SFX.click(); initRace(); });
  document.getElementById('btn-result-home').addEventListener('click', () => { SFX.click(); showScreen('title'); });
}

function showFinishOverlay(place) {
  const panel = document.getElementById('result-panel');
  const suffix = place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th';
  let bodyHtml = '';
  if (place === 1) {
    save.wins += 1;
    const unlocked = unlockNext();
    SFX.win();
    Speech.say(unlocked ? `You won the race! New car! ${unlocked.name}!` : 'You won the race! You are the champion!');
    if (unlocked) {
      bodyHtml = `
        <h2>🏆 You Won 1st Place!</h2>
        <p style="font-size:20px;color:#1d3557;font-weight:700;">New car unlocked!</p>
        <canvas id="unlock-canvas" width="160" height="120"></canvas>
        <p style="font-size:22px;color:#e63946;font-weight:800;">${unlocked.name}</p>
      `;
    } else {
      bodyHtml = `
        <h2>🏆 You Won 1st Place!</h2>
        <p style="font-size:20px;color:#1d3557;font-weight:700;">You've unlocked every car! You're a champion! 🎉</p>
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
  bodyHtml += `<p style="font-size:18px;color:#b07d00;font-weight:700;">🪙 Coins collected: ${race.coins}</p>`;
  panel.innerHTML = bodyHtml + `
    <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
      <button id="btn-race-again" class="big-btn">🔄 Race Again</button>
      <button id="btn-result-garage" class="big-btn blue">🚗 Garage</button>
      <button id="btn-result-home" class="big-btn gray">🏠 Home</button>
    </div>
  `;
  document.getElementById('result-overlay').classList.remove('hidden');
  if (place === 1) {
    SFX.unlockCar();
    const cvs = document.getElementById('unlock-canvas');
    if (cvs) {
      const cctx = cvs.getContext('2d');
      const unlocked = CAR_DESIGNS.find(c => save.unlocked[save.unlocked.length - 1] === c.id);
      if (unlocked) drawCar(cctx, unlocked, 80, 78, 2.2, 0, 0);
    }
  }
  document.getElementById('btn-race-again').addEventListener('click', () => { SFX.click(); initRace(); });
  document.getElementById('btn-result-garage').addEventListener('click', () => { SFX.click(); showScreen('garage'); });
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
