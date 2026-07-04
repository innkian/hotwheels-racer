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
];

// Spoken-word attributes for the listening game. Color words are what a
// 4-year-old would say, not the exact paint shade.
const CAR_WORDS = {
  c01: 'red',  c02: 'yellow', c03: 'green',  c04: 'blue',   c05: 'blue',
  c06: 'orange', c07: 'purple', c08: 'pink', c09: 'silver', c10: 'gold',
  c11: 'white', c12: 'purple', c13: 'green', c14: 'blue',   c15: 'red',
};
const TYPE_WORDS = { sporty: 'race car', sedan: 'race car', muscle: 'race car', truck: 'truck', buggy: 'buggy' };
const DECAL_WORDS = { flames: 'flames', stripe: 'stripes', stars: 'stars', camo: 'spots', none: null };

function carWords(design) {
  return {
    color: CAR_WORDS[design.id] || 'red',
    type: TYPE_WORDS[design.body] || 'race car',
    decal: DECAL_WORDS[design.decal] || null,
  };
}
function describeCar(design) {
  const w = carWords(design);
  let s = `${design.name}! A ${w.color} ${w.type}`;
  if (w.decal) s += ` with ${w.decal}`;
  return s + '.';
}

// Geometry in "car units": axle line is y=0, car faces +x (right).
// Wheels sit at x = -18 and +18. A car is ~56 units long.
const BODY_GEOM = {
  //           wheel radius, body outline builder
  sedan:  { wheelR: 9 },
  sporty: { wheelR: 8.5 },
  muscle: { wheelR: 9 },
  truck:  { wheelR: 12 },
  buggy:  { wheelR: 10 },
};

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
function drawCar(ctx, design, x, y, scale, angle, wheelSpin) {
  const geom = BODY_GEOM[design.body] || BODY_GEOM.sedan;
  const c = design.colors;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.scale(scale, scale);

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

  // window
  ctx.fillStyle = c.window;
  ctx.fill(windowPath(design.body));

  // spoiler
  if (design.spoiler) {
    ctx.fillStyle = c.accent;
    ctx.fillRect(-30, -26, 8, 2.5);
    ctx.fillRect(-27, -24, 2.5, 8);
  }

  // headlight + taillight
  ctx.fillStyle = '#fff6c8';
  ctx.fillRect(25, -9, 3, 3.5);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(-28, -10, 2.5, 3.5);

  // wheels
  drawWheel(ctx, -18, 0, geom.wheelR, wheelSpin);
  drawWheel(ctx, 18, 0, geom.wheelR, wheelSpin);

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
