// Car Maker — assemble a car from parts (body, paint, stickers, wing) and
// save it to the garage. The first build is free; later builds cost coins.
// Every tap speaks the part name, so building doubles as vocabulary time.

(() => {
  const BUILD_PRICE = 30;
  const MAX_CUSTOM = 3;

  const BODIES = [
    ['sporty',   'RACE CAR',  'A race car body!'],
    ['porsche',  '911',       'A nine eleven body! Vroom!'],
    ['ferrari',  'SUPER CAR', 'A super car body! So fast!'],
    ['defender', '4X4',       'A big four by four body!'],
    ['sedan',    'CAR',       'A car body!'],
    ['muscle',   'MUSCLE',    'A muscle car body!'],
    ['truck',    'TRUCK',     'A monster truck body!'],
    ['buggy',    'BUGGY',     'A bouncy buggy body!'],
    ['f1',       'FORMULA 1', 'A formula one body!'],
    ['tank',     'TANK',      'A tank body! It can shoot missiles!'],
  ];
  const PAINTS = [
    ['#e63946', 'red'], ['#2b6cff', 'blue'], ['#48cae4', 'blue'], ['#ffd60a', 'yellow'],
    ['#2a9d4f', 'green'], ['#f77f00', 'orange'], ['#7b2cbf', 'purple'], ['#ff8fab', 'pink'],
    ['#f4f4f4', 'white'], ['#22223b', 'black'], ['#ffbf00', 'gold'], ['#c9c9c9', 'silver'],
  ];
  const DECALS = [
    ['none',   '⭕ NONE',    'No stickers!'],
    ['stripe', '➖ STRIPE',  'A racing stripe!'],
    ['flames', '🔥 FLAMES',  'Hot flames!'],
    ['stars',  '⭐ STARS',   'Shiny stars!'],
    ['camo',   '🟢 SPOTS',   'Camo spots!'],
  ];
  const FUN_NAMES = {
    sporty: 'Racer', porsche: 'Speedster', ferrari: 'Turbo', defender: 'Explorer',
    sedan: 'Cruiser', muscle: 'Thunder', truck: 'Crusher', buggy: 'Bouncer',
    f1: 'Lightning', tank: 'Blaster',
  };

  const draft = {
    body: 'porsche',
    colors: { body: '#2b6cff', accent: '#f4f4f4', window: '#12263a' },
    decal: 'stripe',
    spoiler: true,
    colorWord: 'blue',
  };

  const canvas = document.getElementById('maker-canvas');

  function renderPreview() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 130;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const s = Math.min(w / 70, h / 50);
    drawCar(c, draft, w / 2, h / 2 + 13 * s, s, 0, 0, playerEquip(false));
    document.getElementById('maker-wallet').textContent = '🪙 ' + save.coins;
    document.getElementById('btn-maker-wing').textContent = '🪽 WING: ' + (draft.spoiler ? 'ON' : 'OFF');
    document.getElementById('btn-maker-save').textContent =
      (save.customCars || []).length === 0 ? '🏭 BUILD IT! (free)' : `🏭 BUILD IT! (🪙 ${BUILD_PRICE})`;
  }

  function markSelected(rowEl, matchFn) {
    [...rowEl.children].forEach(el => el.classList.toggle('selected', matchFn(el)));
  }

  function renderBodies() {
    const row = document.getElementById('maker-bodies');
    row.innerHTML = '';
    BODIES.forEach(([body, label, say]) => {
      const card = document.createElement('div');
      card.className = 'maker-piece';
      card.dataset.body = body;
      const cv = document.createElement('canvas');
      card.appendChild(cv);
      const lb = document.createElement('div');
      lb.className = 'maker-piece-label';
      lb.textContent = label;
      card.appendChild(lb);
      row.appendChild(card);
      requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth || 84, h = cv.clientHeight || 48;
        cv.width = w * dpr; cv.height = h * dpr;
        const cc = cv.getContext('2d');
        cc.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawCar(cc, { body, colors: { body: '#9aa5b1', accent: '#6c757d', window: '#495057' }, decal: 'none', spoiler: false }, w / 2, h / 2 + 8, Math.min(w / 70, h / 44), 0, 0);
      });
      card.addEventListener('pointerdown', () => {
        draft.body = body;
        SFX.click();
        Speech.say(say);
        markSelected(row, el => el.dataset.body === draft.body);
        renderPreview();
      });
    });
    markSelected(row, el => el.dataset.body === draft.body);
  }

  function renderSwatches(rowId, target) {
    const row = document.getElementById(rowId);
    row.innerHTML = '';
    PAINTS.forEach(([hex, word]) => {
      const sw = document.createElement('button');
      sw.className = 'maker-swatch';
      sw.style.background = hex;
      sw.dataset.hex = hex;
      row.appendChild(sw);
      sw.addEventListener('pointerdown', () => {
        SFX.click();
        if (target === 'body') {
          draft.colors.body = hex;
          draft.colorWord = word;
        } else {
          draft.colors.accent = hex;
        }
        Speech.say(word + '!');
        markSelected(row, el => el.dataset.hex === (target === 'body' ? draft.colors.body : draft.colors.accent));
        renderPreview();
      });
    });
    markSelected(row, el => el.dataset.hex === (target === 'body' ? draft.colors.body : draft.colors.accent));
  }

  function renderDecals() {
    const row = document.getElementById('maker-decals');
    row.innerHTML = '';
    DECALS.forEach(([decal, label, say]) => {
      const b = document.createElement('button');
      b.className = 'maker-chip';
      b.dataset.decal = decal;
      b.textContent = label;
      row.appendChild(b);
      b.addEventListener('pointerdown', () => {
        draft.decal = decal;
        SFX.click();
        Speech.say(say);
        markSelected(row, el => el.dataset.decal === draft.decal);
        renderPreview();
      });
    });
    markSelected(row, el => el.dataset.decal === draft.decal);
  }

  document.getElementById('btn-maker-wing').addEventListener('click', () => {
    draft.spoiler = !draft.spoiler;
    SFX.click();
    Speech.say(draft.spoiler ? 'Wing on! Extra racy!' : 'Wing off!');
    renderPreview();
  });

  document.getElementById('btn-maker-save').addEventListener('click', () => {
    save.customCars = save.customCars || [];
    const price = save.customCars.length === 0 ? 0 : BUILD_PRICE;
    if (save.coins < price) {
      SFX.click();
      Speech.say(`You need ${price - save.coins} more coins to build a car! Win races to earn them!`);
      return;
    }
    save.coins -= price;
    const cap = draft.colorWord.charAt(0).toUpperCase() + draft.colorWord.slice(1);
    const car = {
      id: 'cu' + Date.now(),
      name: `${cap} ${FUN_NAMES[draft.body] || 'Machine'}`,
      body: draft.body,
      colors: { ...draft.colors },
      decal: draft.decal,
      spoiler: draft.spoiler,
      colorWord: draft.colorWord,
      weapon: draft.body === 'tank',
    };
    if (save.customCars.length >= MAX_CUSTOM) {
      save.customCars.shift();
      Speech.say('Your oldest car drove away to make room!', { interrupt: false });
    }
    save.customCars.push(car);
    save.selected = car.id;
    persist();
    SFX.unlockCar();
    Speech.say(`You built ${car.name}! It is in your garage now!`);
    showScreen('garage');
  });

  document.getElementById('btn-maker-back').addEventListener('click', () => {
    SFX.click();
    Speech.stop();
    showScreen('title');
  });

  window.initMaker = () => {
    renderBodies();
    renderSwatches('maker-colors', 'body');
    renderSwatches('maker-accents', 'accent');
    renderDecals();
    renderPreview();
    Speech.say('Welcome to the car maker! Pick a body, paint, and stickers, then build it!');
  };
})();
