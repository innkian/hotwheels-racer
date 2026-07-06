// Car roster: hand-drawn side-view vector cars (no external images/logos needed).
// Each car is procedurally drawn from a small "recipe" so we can have
// lots of visually distinct cars without any art assets.

const CAR_DESIGNS = [
  { id: 'c01', name: 'Blaze',        body: 'sporty', colors: { body: '#e63946', accent: '#ffd166', window: '#1d3557' }, decal: 'flames',  spoiler: true  },
  { id: 'c02', name: 'Sunny',        body: 'sedan',  colors: { body: '#ffd60a', accent: '#f77f00', window: '#264653' }, decal: 'stripe',  spoiler: false },
  { id: 'c03', name: 'Jungle Jeep',  body: 'truck',  colors: { body: '#2a9d8f', accent: '#e9c46a', window: '#1d3557' }, decal: 'camo',    spoiler: false },
  { id: 'c04', name: 'Night Rider',  body: 'muscle', colors: { body: '#14213d', accent: '#00f5d4', window: '#000000' }, decal: 'stripe',  spoiler: true  },
  { id: 'c05', name: 'Ice Racer',    body: 'sporty', colors: { body: '#a8dadc', accent: '#1d3557', window: '#023047' }, decal: 'stars',   spoiler: true  },
  { id: 'c06', name: 'Volcano',      body: 'muscle', colors: { body: '#ff5400', accent: '#ffba08', window: '#22223b' }, decal: 'flames',  spoiler: true  },
  { id: 'c07', name: 'Purple Comet', body: 'sporty', colors: { body: '#7b2cbf', accent: '#e0aaff', window: '#10002b' }, decal: 'stars',   spoiler: true  },
  { id: 'c08', name: 'Pink Blaze',   body: 'buggy',  colors: { body: '#ff8fab', accent: '#ffffff', window: '#590d22' }, decal: 'stripe',  spoiler: false },
  { id: 'c09', name: 'Silver Bullet',body: 'sedan',  colors: { body: '#c9c9c9', accent: '#3a86ff', window: '#212529' }, decal: 'none',    spoiler: false },
  { id: 'c10', name: 'Gold Rush',    body: 'muscle', colors: { body: '#ffbf00', accent: '#7f5539', window: '#1b1b1b' }, decal: 'stripe',  spoiler: true  },
  { id: 'c11', name: 'Rainbow Dash', body: 'sporty', colors: { body: '#ffffff', accent: '#ff006e', window: '#3a0ca3' }, decal: 'stars',   spoiler: true  },
  { id: 'c12', name: 'Monster Max',  body: 'truck',  colors: { body: '#3d348b', accent: '#f7b801', window: '#000000' }, decal: 'stripe',  spoiler: false },
  { id: 'c13', name: 'Camo Crawler', body: 'truck',  colors: { body: '#606c38', accent: '#283618', window: '#1b1b1b' }, decal: 'camo',    spoiler: false },
  { id: 'c14', name: 'Turbo Teal',   body: 'sporty', colors: { body: '#00b4d8', accent: '#03045e', window: '#0a1128' }, decal: 'stripe',  spoiler: true  },
  { id: 'c15', name: 'Rocket Red',   body: 'muscle', colors: { body: '#d00000', accent: '#ffffff', window: '#03071e' }, decal: 'flames',  spoiler: true  },
  { id: 'c16', name: 'Police Chase', body: 'sedan',  colors: { body: '#f4f4f4', accent: '#1d3557', window: '#22333b' }, decal: 'stripe',  spoiler: false, lights: true,  typeWord: 'police car' },
  { id: 'c17', name: 'Lightning F1', body: 'f1',     colors: { body: '#e63946', accent: '#ffffff', window: '#111111' }, decal: 'stripe',  spoiler: true,  typeWord: 'formula one car' },
  { id: 'c18', name: 'Turbo Tank',   body: 'tank',   colors: { body: '#606c38', accent: '#283618', window: '#1b1b1b' }, decal: 'camo',    spoiler: false, weapon: true,  typeWord: 'tank' },
  { id: 'c19', name: 'Speedy Taxi',  body: 'sedan',  colors: { body: '#ffd60a', accent: '#1b1b1b', window: '#22333b' }, decal: 'stripe',  spoiler: false, typeWord: 'taxi' },
  { id: 'c20', name: 'Night Patrol', body: 'muscle', colors: { body: '#22223b', accent: '#f4f4f4', window: '#0a0a0a' }, decal: 'stripe',  spoiler: false, lights: true,  typeWord: 'police car' },
  { id: 'c21', name: 'Silver F1',    body: 'f1',     colors: { body: '#c9c9c9', accent: '#2b6cff', window: '#111111' }, decal: 'stripe',  spoiler: true,  typeWord: 'formula one car' },
  { id: 'c22', name: 'Fire Rescue',  body: 'truck',  colors: { body: '#d00000', accent: '#ffd60a', window: '#1b1b1b' }, decal: 'stripe',  spoiler: false, lights: true,  typeWord: 'fire truck' },
  { id: 'c23', name: 'Steel Tank',   body: 'tank',   colors: { body: '#6c757d', accent: '#343a40', window: '#1b1b1b' }, decal: 'camo',    spoiler: false, weapon: true,  typeWord: 'tank' },
  { id: 'c24', name: 'Golden F1',    body: 'f1',     colors: { body: '#ffbf00', accent: '#7f5539', window: '#111111' }, decal: 'stars',   spoiler: true,  typeWord: 'formula one car' },
  { id: 'c25', name: 'Blue 911',     body: 'porsche',  colors: { body: '#2b6cff', accent: '#f4f4f4', window: '#12263a' }, decal: 'none',   spoiler: false },
  { id: 'c26', name: 'Blue Spyder',  body: 'porsche',  colors: { body: '#48cae4', accent: '#023e8a', window: '#12263a' }, decal: 'stripe', spoiler: true  },
  { id: 'c27', name: 'Blue GT Cup',  body: 'porsche',  colors: { body: '#1d4ed8', accent: '#ffd60a', window: '#0a0a0a' }, decal: 'stripe', spoiler: true  },
  { id: 'c28', name: 'Rosso Red',    body: 'ferrari',  colors: { body: '#d90429', accent: '#ffd60a', window: '#0a0a0a' }, decal: 'none',   spoiler: true  },
  { id: 'c29', name: 'Rosso Yellow', body: 'ferrari',  colors: { body: '#ffd60a', accent: '#1b1b1b', window: '#0a0a0a' }, decal: 'stripe', spoiler: true  },
  { id: 'c30', name: 'Defender Green', body: 'defender', colors: { body: '#3a5a40', accent: '#dad7cd', window: '#1b1b1b' }, decal: 'none', spoiler: false, typeWord: 'jeep' },
  { id: 'c31', name: 'Defender Sand',  body: 'defender', colors: { body: '#d4a373', accent: '#6b4220', window: '#1b1b1b' }, decal: 'camo', spoiler: false, typeWord: 'jeep' },
];

// Spoken-word attributes for the listening game. Color words are what a
// 4-year-old would say, not the exact paint shade.
const CAR_WORDS = {
  c01: 'red',  c02: 'yellow', c03: 'green',  c04: 'blue',   c05: 'blue',
  c06: 'orange', c07: 'purple', c08: 'pink', c09: 'silver', c10: 'gold',
  c11: 'white', c12: 'purple', c13: 'green', c14: 'blue',   c15: 'red',
  c16: 'white', c17: 'red',    c18: 'green', c19: 'yellow', c20: 'black',
  c21: 'silver', c22: 'red',   c23: 'silver', c24: 'gold',
  c25: 'blue', c26: 'blue', c27: 'blue', c28: 'red', c29: 'yellow',
  c30: 'green', c31: 'yellow',
};
const TYPE_WORDS = { sporty: 'race car', sedan: 'race car', muscle: 'race car', truck: 'truck', buggy: 'buggy', f1: 'race car', tank: 'tank', porsche: 'race car', ferrari: 'race car', defender: 'truck' };
const DECAL_WORDS = { flames: 'flames', stripe: 'stripes', stars: 'stars', camo: 'spots', none: null };

function carWords(design) {
  return {
    color: design.colorWord || CAR_WORDS[design.id] || 'red',
    type: design.typeWord || TYPE_WORDS[design.body] || 'race car',
    decal: DECAL_WORDS[design.decal] || null,
  };
}
function describeCar(design) {
  const w = carWords(design);
  let s = `${design.name}! A ${w.color} ${w.type}`;
  if (w.decal) s += ` with ${w.decal}`;
  return s + '.';
}

// ===================== Workshop gear catalog =====================
// Every item has a spoken line that names it AND explains what it does —
// cause-and-effect language ("faster", "climbs hills") is the learning bit.
const GEAR_CATALOG = {
  engines: [
    { id: 1, name: 'STANDARD', icon: '⚙️', price: 0,  speed: 1,    say: 'Standard engine. It goes nice and steady.' },
    { id: 2, name: 'TURBO',    icon: '🌀', price: 30, speed: 1.08, say: 'Turbo engine! It makes your car go faster!' },
    { id: 3, name: 'ROCKET',   icon: '🚀', price: 60, speed: 1.16, say: 'Rocket engine! Super duper fast! Be extra careful in the caves!' },
  ],
  tyres: [
    { id: 'normal',  name: 'NORMAL',  price: 0,  speed: 1,    slope: 0.6,  grip: 0.6,  wheelMult: 1,    say: 'Normal tyres. Good for everywhere.' },
    { id: 'monster', name: 'MONSTER', price: 25, speed: 0.96, slope: 0.42, grip: 0.85, wheelMult: 1.3,  say: 'Monster tyres! Big and bouncy! They climb big hills really well!' },
    { id: 'speedy',  name: 'SPEEDY',  price: 25, speed: 1.06, slope: 0.68, grip: 0.5,  wheelMult: 0.92, say: 'Speedy tyres! Zoom! They are the fastest on flat roads!' },
  ],
  drivers: [
    { id: 'max',   name: 'MAX',   price: 0,  say: 'Max is driving! Hi Max!' },
    { id: 'mia',   name: 'MIA',   price: 0,  say: 'Mia is driving! Hi Mia!' },
    { id: 'rex',   name: 'REX',   price: 20, say: 'Rex the green dinosaur is driving! Roar!' },
    { id: 'robo',  name: 'ROBO',  price: 20, say: 'Robo the robot is driving! Beep beep boop!' },
    { id: 'astro', name: 'ASTRO', price: 20, say: 'Astro the astronaut is driving! Three, two, one, blast off!' },
    { id: 'puppy', name: 'PUPPY', price: 20, say: 'Puppy is driving! Woof woof!' },
  ],
  hats: [
    { id: 'none',   name: 'NO HAT',  price: 0,  say: 'No hat today!' },
    { id: 'cap',    name: 'CAP',     price: 0,  say: 'A red cap! Looking cool!' },
    { id: 'helmet', name: 'HELMET',  price: 10, say: 'A blue racing helmet! Safety first!' },
    { id: 'party',  name: 'PARTY',   price: 10, say: 'A party hat! Hooray! It is a race party!' },
    { id: 'cowboy', name: 'COWBOY',  price: 12, say: 'A cowboy hat! Yee-haw!' },
    { id: 'crown',  name: 'CROWN',   price: 15, say: 'A golden crown! You are the king of the race!' },
  ],
  gadgets: [
    { id: 'magnet', name: 'MAGNET', icon: '🧲', price: 40, say: 'Coin magnet! It pulls coins to your car so you catch more!' },
    { id: 'shield', name: 'SHIELD', icon: '🛡️', price: 50, say: 'Shield! It protects your car from one big bump every race!' },
  ],
  horns: [
    { id: 'beep',     name: 'BEEP',     icon: '📯', price: 0,  say: 'Beep beep! The classic horn!' },
    { id: 'train',    name: 'TRAIN',    icon: '🚂', price: 15, say: 'A train horn! Choo choo!' },
    { id: 'dog',      name: 'DOG',      icon: '🐶', price: 15, say: 'A doggy horn! It barks! Woof woof!' },
    { id: 'cow',      name: 'COW',      icon: '🐮', price: 15, say: 'A cow horn! It moos! Moo!' },
    { id: 'elephant', name: 'ELEPHANT', icon: '🐘', price: 20, say: 'An elephant horn! It trumpets! Toot!' },
  ],
  trails: [
    { id: 'none',    name: 'NONE',    icon: '⭕', price: 0,  say: 'No trail today.' },
    { id: 'rainbow', name: 'RAINBOW', icon: '🌈', price: 25, say: 'A rainbow trail! It leaves so many colors behind you!' },
    { id: 'bubbles', name: 'BUBBLES', icon: '🫧', price: 20, say: 'A bubble trail! Pop pop pop!' },
    { id: 'stars',   name: 'STARS',   icon: '⭐', price: 20, say: 'A star trail! Super sparkly!' },
    { id: 'fire',    name: 'FIRE',    icon: '🔥', price: 30, say: 'A fire trail! Blazing fast!' },
  ],
};
function gearItem(cat, id) {
  return GEAR_CATALOG[cat].find(i => i.id === id) || GEAR_CATALOG[cat][0];
}

// Geometry in "car units": axle line is y=0, car faces +x (right).
// Wheels sit at x = -18 and +18. A car is ~56 units long.
// head = where the driver's head shows through the window.
const BODY_GEOM = {
  sedan:  { wheelR: 9,   head: { x: -3, y: -18, r: 4.6 } },
  sporty: { wheelR: 8.5, head: { x: -2, y: -17, r: 4.2 } },
  muscle: { wheelR: 9,   head: { x: -5, y: -17, r: 4.2 } },
  truck:  { wheelR: 12,  head: { x: 1,  y: -24, r: 4.8 } },
  buggy:  { wheelR: 10,  head: { x: -1, y: -16, r: 5.2 } },
  f1:     { wheelR: 8,   head: { x: -4, y: -17, r: 3.8 } },
  tank:   { wheelR: 8,   head: { x: -2, y: -29, r: 4 } },
  porsche:  { wheelR: 8.5,  head: { x: -4, y: -16, r: 4 } },
  ferrari:  { wheelR: 8.5,  head: { x: -9, y: -14, r: 3.8 } },
  defender: { wheelR: 10.5, head: { x: -8, y: -20, r: 4.6 } },
};
// roof line for police/fire light bars
const ROOF_Y = { sedan: -24, sporty: -24, muscle: -23, truck: -30, buggy: -22, f1: -16, tank: -26, porsche: -22, ferrari: -19, defender: -26 };

function bodyPath(body) {
  const p = new Path2D();
  if (body === 'sporty') {
    p.moveTo(-27, -3);
    p.lineTo(-28, -12);
    p.quadraticCurveTo(-24, -16, -14, -17);
    p.quadraticCurveTo(-8, -24, 2, -24);   // roof
    p.quadraticCurveTo(12, -23, 17, -13);  // windshield slope
    p.quadraticCurveTo(26, -12, 28, -8);   // nose
    p.lineTo(28, -3);
    p.closePath();
  } else if (body === 'sedan') {
    p.moveTo(-27, -3);
    p.lineTo(-27, -13);
    p.quadraticCurveTo(-22, -15, -17, -15);
    p.lineTo(-13, -24);
    p.lineTo(7, -24);                       // cabin
    p.lineTo(13, -14);
    p.quadraticCurveTo(24, -14, 27, -9);
    p.lineTo(27, -3);
    p.closePath();
  } else if (body === 'muscle') {
    p.moveTo(-28, -3);
    p.lineTo(-28, -15);
    p.lineTo(-18, -16);
    p.lineTo(-13, -23);
    p.lineTo(1, -23);                       // cabin set back
    p.lineTo(6, -14);
    p.lineTo(26, -13);                      // long hood
    p.lineTo(28, -7);
    p.lineTo(28, -3);
    p.closePath();
  } else if (body === 'truck') {
    p.moveTo(-27, -6);
    p.lineTo(-27, -20);
    p.lineTo(-8, -20);
    p.lineTo(-8, -30);
    p.lineTo(8, -30);                       // tall cab
    p.lineTo(14, -20);
    p.lineTo(27, -20);
    p.lineTo(27, -6);
    p.closePath();
  } else if (body === 'f1') {
    p.moveTo(-28, -3);
    p.lineTo(-28, -10);
    p.lineTo(-14, -11);
    p.lineTo(-10, -16);          // cockpit hump
    p.lineTo(-1, -16);
    p.lineTo(5, -10);
    p.lineTo(24, -8);            // long low nose
    p.lineTo(28, -5);
    p.lineTo(28, -3);
    p.closePath();
  } else if (body === 'tank') {
    p.moveTo(-26, -4);
    p.lineTo(-21, -15);          // sloped hull
    p.lineTo(21, -15);
    p.lineTo(26, -4);
    p.closePath();
  } else if (body === 'porsche') {
    // classic rounded 911 silhouette: sloping rear deck, curved roof, long nose
    p.moveTo(-27, -3);
    p.lineTo(-27, -9);
    p.quadraticCurveTo(-26, -14, -19, -15);
    p.quadraticCurveTo(-13, -22, -3, -22.5);
    p.quadraticCurveTo(9, -21, 15, -13);
    p.quadraticCurveTo(24, -11, 27, -7);
    p.lineTo(27, -3);
    p.closePath();
  } else if (body === 'ferrari') {
    // low mid-engine wedge: high tail, cockpit forward, knife nose
    p.moveTo(-28, -3);
    p.lineTo(-28, -11);
    p.lineTo(-20, -13);
    p.lineTo(-16, -19);
    p.lineTo(-4, -19);
    p.quadraticCurveTo(6, -18, 12, -9);
    p.lineTo(26, -7);
    p.lineTo(28, -4);
    p.lineTo(28, -3);
    p.closePath();
  } else if (body === 'defender') {
    // boxy 4x4: flat long roof, stepped bonnet
    p.moveTo(-26, -4);
    p.lineTo(-26, -26);
    p.lineTo(10, -26);
    p.lineTo(12, -15);
    p.lineTo(27, -14);
    p.lineTo(27, -4);
    p.closePath();
  } else { // buggy
    p.moveTo(-24, -3);
    p.quadraticCurveTo(-26, -20, -8, -22);
    p.quadraticCurveTo(4, -23, 12, -18);
    p.quadraticCurveTo(24, -14, 25, -3);
    p.closePath();
  }
  return p;
}

function windowPath(body) {
  const p = new Path2D();
  if (body === 'sporty') {
    p.moveTo(-8, -21); p.lineTo(1, -21); p.quadraticCurveTo(8, -20, 12, -14); p.lineTo(-8, -14); p.closePath();
  } else if (body === 'sedan') {
    p.moveTo(-11, -22); p.lineTo(5, -22); p.lineTo(10, -15); p.lineTo(-13, -15); p.closePath();
  } else if (body === 'muscle') {
    p.moveTo(-11, -21); p.lineTo(0, -21); p.lineTo(4, -15); p.lineTo(-13, -15); p.closePath();
  } else if (body === 'truck') {
    p.moveTo(-6, -28); p.lineTo(6, -28); p.lineTo(11, -21); p.lineTo(-6, -21); p.closePath();
  } else if (body === 'f1') {
    p.moveTo(-9, -15); p.lineTo(-2, -15); p.lineTo(2, -11); p.lineTo(-10, -11); p.closePath();
  } else if (body === 'tank') {
    p.moveTo(-9, -24); p.lineTo(-2, -24); p.lineTo(-2, -18); p.lineTo(-9, -18); p.closePath();
  } else if (body === 'porsche') {
    p.moveTo(-13, -19.5); p.lineTo(-1, -19.5); p.quadraticCurveTo(6, -18, 10, -13); p.lineTo(-14, -13); p.closePath();
  } else if (body === 'ferrari') {
    p.moveTo(-14, -17); p.lineTo(-5, -17); p.lineTo(1, -10.5); p.lineTo(-16, -10.5); p.closePath();
  } else if (body === 'defender') {
    p.moveTo(-22, -24); p.lineTo(7, -24); p.lineTo(8, -17); p.lineTo(-22, -17); p.closePath();
  } else { // buggy
    p.moveTo(-8, -20); p.lineTo(6, -19); p.lineTo(10, -13); p.lineTo(-10, -13); p.closePath();
  }
  return p;
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI / 5) * (2 * i) - Math.PI / 2;
    const a2 = (Math.PI / 5) * (2 * i + 1) - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

// Driver heads — a few shapes each, readable even at small sizes.
function drawDriverHead(ctx, x, y, r, driver) {
  ctx.save();
  ctx.translate(x, y);
  if (driver === 'robo') {
    ctx.fillStyle = '#aeb8c2';
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#6c757d'; ctx.lineWidth = r * 0.18;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 1.6); ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(0, -r * 1.7, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(r * 0.05, -r * 0.4, r * 0.6, r * 0.45);
  } else if (driver === 'rex') {
    ctx.fillStyle = '#57a639';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f6b1a';
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.18) * r, Math.sin(a - 0.18) * r);
      ctx.lineTo(Math.cos(a + 0.18) * r, Math.sin(a + 0.18) * r);
      ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.15, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(r * 0.42, -r * 0.15, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (driver === 'astro') {
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b6cff';
    ctx.beginPath();
    ctx.roundRect(-r * 0.35, -r * 0.45, r * 1.25, r * 0.85, r * 0.3);
    ctx.fill();
  } else if (driver === 'puppy') {
    ctx.fillStyle = '#b5793b';
    ctx.beginPath(); ctx.ellipse(-r * 0.75, -r * 0.75, r * 0.35, r * 0.6, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.85, r * 0.35, r * 0.6, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a05f';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.15, r * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.75, r * 0.25, r * 0.2, 0, Math.PI * 2); ctx.fill();
  } else {
    // max / mia — kid faces
    ctx.fillStyle = '#f1c27d';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = driver === 'mia' ? '#5b3a1a' : '#3a2412';
    ctx.beginPath(); ctx.arc(0, -r * 0.25, r, Math.PI, Math.PI * 2); ctx.fill();
    if (driver === 'mia') {
      ctx.beginPath(); ctx.arc(-r * 0.95, r * 0.1, r * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.95, r * 0.1, r * 0.38, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Hats sit on top of a head of radius r centered at (x, y).
function drawHat(ctx, x, y, r, hat) {
  if (!hat || hat === 'none') return;
  ctx.save();
  ctx.translate(x, y - r * 0.75);
  if (hat === 'cap') {
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(0, -r * 0.15, r * 1.5, r * 0.28);
  } else if (hat === 'helmet') {
    ctx.fillStyle = '#2b6cff';
    ctx.beginPath(); ctx.arc(0, 0.5, r * 1.05, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r * 0.2, -r * 1.05, r * 0.4, r * 1.0);
  } else if (hat === 'crown') {
    ctx.fillStyle = '#ffbf00';
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.lineTo(-r * 0.85, -r * 0.9);
    ctx.lineTo(-r * 0.4, -r * 0.35);
    ctx.lineTo(0, -r * 1.05);
    ctx.lineTo(r * 0.4, -r * 0.35);
    ctx.lineTo(r * 0.85, -r * 0.9);
    ctx.lineTo(r * 0.85, 0);
    ctx.closePath(); ctx.fill();
  } else if (hat === 'party') {
    ctx.fillStyle = '#ff8fab';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, -r * 1.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath(); ctx.arc(0, -r * 1.5, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (hat === 'cowboy') {
    ctx.fillStyle = '#8d6e4b';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.75, Math.PI, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawWheel(ctx, x, y, r, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin || 0);
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9aa5b1';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#495057';
  ctx.lineWidth = r * 0.18;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

// Draws a side-view car centered on its axle midpoint at (x, y), facing right.
// angle in radians (0 = flat ground), wheelSpin animates the wheels.
// equip (optional): { tyres, driver, hat, boost } from the workshop.
function drawCar(ctx, design, x, y, scale, angle, wheelSpin, equip) {
  const geom = BODY_GEOM[design.body] || BODY_GEOM.sedan;
  const c = design.colors;
  const wheelMult = equip ? gearItem('tyres', equip.tyres).wheelMult : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.scale(scale, scale);
  // lift the body so bigger tyres still touch the same ground line
  ctx.translate(0, -geom.wheelR * (wheelMult - 1));

  // exhaust flame while boosting
  if (equip && equip.boost) {
    const flick = 0.6 + 0.4 * Math.abs(Math.sin((wheelSpin || 0) * 3));
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.moveTo(-28, -10); ctx.lineTo(-28 - 11 * flick, -7); ctx.lineTo(-28, -4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.moveTo(-28, -9); ctx.lineTo(-28 - 6 * flick, -7); ctx.lineTo(-28, -5);
    ctx.closePath(); ctx.fill();
  }

  // body
  const bp = bodyPath(design.body);
  ctx.fillStyle = c.body;
  ctx.fill(bp);

  // decal (clipped to body)
  ctx.save();
  ctx.clip(bp);
  if (design.decal === 'stripe') {
    ctx.fillStyle = c.accent;
    ctx.fillRect(-28, -11, 56, 4.5);
  } else if (design.decal === 'flames') {
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(-28, -4);
    ctx.quadraticCurveTo(-14, -14, -4, -6);
    ctx.quadraticCurveTo(4, -13, 12, -5);
    ctx.quadraticCurveTo(20, -11, 28, -4);
    ctx.lineTo(28, -2);
    ctx.lineTo(-28, -2);
    ctx.closePath();
    ctx.fill();
  } else if (design.decal === 'stars') {
    ctx.fillStyle = c.accent;
    drawStar(ctx, -16, -9, 4.5);
    drawStar(ctx, 20, -8, 3.5);
  } else if (design.decal === 'camo') {
    ctx.fillStyle = c.accent;
    [[-18, -10], [-4, -16], [10, -9], [22, -13]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.ellipse(px, py, 6, 3.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();

  // body outline
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.2;
  ctx.stroke(bp);

  // tank extras: turret, cannon barrel, tread skirt
  if (design.body === 'tank') {
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.roundRect(-13, -26, 21, 11, 2.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(8, -23.5, 22, 3.2);       // barrel
    ctx.fillRect(28, -24.5, 3, 5.2);       // muzzle
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.roundRect(-27, -8, 54, 9, 4.5);    // tread skirt
    ctx.fill();
  }

  // defender spare wheel on the tailgate
  if (design.body === 'defender') {
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.arc(-26, -12, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.arc(-26, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // window
  ctx.fillStyle = c.window;
  ctx.fill(windowPath(design.body));

  // driver + hat
  if (equip && equip.driver) {
    drawDriverHead(ctx, geom.head.x, geom.head.y, geom.head.r, equip.driver);
    drawHat(ctx, geom.head.x, geom.head.y - geom.head.r, geom.head.r, equip.hat);
  }

  // spoiler / rear wing
  if (design.spoiler) {
    ctx.fillStyle = c.accent;
    if (design.body === 'f1') {
      ctx.fillRect(-31, -19, 9, 3);        // big F1 rear wing
      ctx.fillRect(-28, -16, 2.5, 6);
      ctx.fillRect(20, -10, 9, 2.2);       // front wing
    } else if (design.body === 'porsche') {
      ctx.fillRect(-28, -18, 10, 2.5);     // duck tail
    } else if (design.body === 'ferrari') {
      ctx.fillRect(-30, -20, 10, 2.5);     // low rear wing
      ctx.fillRect(-27, -18, 2.5, 5);
    } else {
      ctx.fillRect(-30, -26, 8, 2.5);
      ctx.fillRect(-27, -24, 2.5, 8);
    }
  }

  // police / fire light bar (flashes while driving)
  if (design.lights) {
    const roof = ROOF_Y[design.body] || -24;
    const phase = Math.sin((wheelSpin || 0) * 6) > 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(-7, roof - 1.5, 14, 2.2);
    ctx.fillStyle = phase ? '#ff2d2d' : '#7a1010';
    ctx.fillRect(-6.5, roof - 5, 6, 3.8);
    ctx.fillStyle = phase ? '#123a8a' : '#3f7bff';
    ctx.fillRect(0.5, roof - 5, 6, 3.8);
  }

  // headlight + taillight
  ctx.fillStyle = '#fff6c8';
  ctx.fillRect(25, -9, 3, 3.5);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(-28, -10, 2.5, 3.5);

  // wheels (context is lifted with the body, so bigger tyres still
  // touch the same ground line: bottom = -lift + r*mult = r)
  drawWheel(ctx, -18, 0, geom.wheelR * wheelMult, wheelSpin);
  drawWheel(ctx, 18, 0, geom.wheelR * wheelMult, wheelSpin);

  ctx.restore();
}

// Greyed-out silhouette for cars not yet unlocked.
function drawLockedCar(ctx, design, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#9aa5b1';
  ctx.fill(bodyPath(design.body));
  const geom = BODY_GEOM[design.body] || BODY_GEOM.sedan;
  ctx.beginPath();
  ctx.arc(-18, 0, geom.wheelR, 0, Math.PI * 2);
  ctx.arc(18, 0, geom.wheelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
