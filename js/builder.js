// Track builder — snap segments together like LEGO pieces, then race them.
// Tapping a palette piece appends it (and says its name — more vocabulary);
// tapping a placed piece removes it. The track auto-saves.

(() => {
  const LSKEY = 'twr_track_v1';
  const MAX_PIECES = 8;
  const strip = document.getElementById('build-strip');
  const palette = document.getElementById('build-palette');

  let pieces = [];
  try {
    const raw = localStorage.getItem(LSKEY);
    if (raw) pieces = JSON.parse(raw).filter(t => SEGMENT_TYPES[t]).slice(0, MAX_PIECES);
  } catch (e) {}
  function persistTrack() { localStorage.setItem(LSKEY, JSON.stringify(pieces)); }

  // little terrain silhouette so non-readers can tell pieces apart
  function drawPieceIcon(canvas, type) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 110, h = canvas.clientHeight || 60;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gy = h * 0.72;
    const groundAt = (t) => {
      if (type === 'hills') return gy - 14 * Math.sin(t * Math.PI) * Math.sin(t * 3 * Math.PI);
      if (type === 'bumps') return gy - 4.5 * Math.sin(t * Math.PI) * Math.sin(t * 14 * Math.PI);
      if (type === 'mountain') return gy - h * 0.5 * Math.sin(t * Math.PI);
      if (type === 'jump') return (t > 0.35 && t < 0.62) ? gy - ((t - 0.35) / 0.27) * h * 0.38 : gy;
      return gy;
    };
    // ground
    c.beginPath();
    c.moveTo(0, h);
    for (let i = 0; i <= 40; i++) c.lineTo((i / 40) * w, groundAt(i / 40));
    c.lineTo(w, h);
    c.closePath();
    c.fillStyle = '#8b5e34';
    c.fill();
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * w, y = groundAt(i / 40);
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.strokeStyle = '#57a639';
    c.lineWidth = 4;
    c.stroke();
    if (type === 'cave') {
      c.fillStyle = '#5a4632';
      c.fillRect(0, 0, w, h * 0.34);
      c.fillStyle = '#4a3826';
      for (let k = 0; k < 4; k++) {
        const x = w * (0.15 + k * 0.23);
        c.beginPath();
        c.moveTo(x - 6, h * 0.34); c.lineTo(x + 6, h * 0.34); c.lineTo(x, h * 0.34 + 11);
        c.closePath(); c.fill();
      }
    }
    if (type === 'coins') {
      c.fillStyle = '#ffbf00';
      c.strokeStyle = '#b07d00';
      c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.arc(w * (0.3 + k * 0.2), gy - 16 - 6 * Math.sin(k * 2), 6, 0, Math.PI * 2);
        c.fill(); c.stroke();
      }
    }
  }

  function renderStrip() {
    strip.innerHTML = '';
    pieces.forEach((type, i) => {
      const tile = document.createElement('div');
      tile.className = 'build-tile';
      const canvas = document.createElement('canvas');
      tile.appendChild(canvas);
      const num = document.createElement('div');
      num.className = 'build-tile-num';
      num.textContent = i + 1;
      tile.appendChild(num);
      strip.appendChild(tile);
      requestAnimationFrame(() => drawPieceIcon(canvas, type));
      tile.addEventListener('pointerdown', () => {
        SFX.click();
        pieces.splice(i, 1);
        persistTrack();
        renderStrip();
      });
    });
    // finish flag slot at the end
    const flag = document.createElement('div');
    flag.className = 'build-tile flag';
    flag.textContent = '🏁';
    strip.appendChild(flag);
    document.getElementById('btn-build-race').disabled = pieces.length === 0;
  }

  function renderPalette() {
    palette.innerHTML = '';
    Object.entries(SEGMENT_TYPES).forEach(([type, info]) => {
      const card = document.createElement('div');
      card.className = 'build-piece';
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const label = document.createElement('div');
      label.className = 'build-piece-label';
      label.textContent = info.label;
      card.appendChild(label);
      palette.appendChild(card);
      requestAnimationFrame(() => drawPieceIcon(canvas, type));
      card.addEventListener('pointerdown', () => {
        if (pieces.length >= MAX_PIECES) {
          Speech.say('Track is full! Tap race!');
          return;
        }
        SFX.coin();
        Speech.say(info.speak);
        pieces.push(type);
        persistTrack();
        renderStrip();
      });
    });
  }

  document.getElementById('btn-build-clear').addEventListener('click', () => {
    SFX.click();
    Speech.say('All clear! Build a new track!');
    pieces = [];
    persistTrack();
    renderStrip();
  });
  document.getElementById('btn-build-back').addEventListener('click', () => {
    SFX.click();
    Speech.stop();
    showScreen('title');
  });
  document.getElementById('btn-build-race').addEventListener('click', () => {
    if (!pieces.length) return;
    SFX.go();
    startCustomRace(pieces);
  });

  window.initBuild = () => {
    renderPalette();
    renderStrip();
    Speech.say('Build your own track! Tap the pieces!');
  };
})();
