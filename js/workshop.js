// Workshop — spend race coins on engines, tyres, drivers, and hats.
// Every item is spoken aloud with a what-it-does sentence, so upgrading
// doubles as listening practice (cause-and-effect words: faster, climbs,
// bouncy). Owned items equip with one tap; locked ones show a coin price.

(() => {
  const grid = document.getElementById('shop-grid');
  const walletEl = document.getElementById('shop-wallet');
  const previewCanvas = document.getElementById('shop-car-canvas');
  let category = 'engines';

  // which save fields each catalog category maps to
  // gadgets are toggles (several can be on at once); the rest are single slots
  const SLOTS = {
    engines: { equipped: () => save.gear.engine,  setEquip: v => save.gear.engine = v,  owned: () => save.owned.engines },
    tyres:   { equipped: () => save.gear.tyres,   setEquip: v => save.gear.tyres = v,   owned: () => save.owned.tyres },
    drivers: { equipped: () => save.gear.driver,  setEquip: v => save.gear.driver = v,  owned: () => save.owned.drivers },
    hats:    { equipped: () => save.gear.hat,     setEquip: v => save.gear.hat = v,     owned: () => save.owned.hats },
    horns:   { equipped: () => save.gear.horn,    setEquip: v => save.gear.horn = v,    owned: () => save.owned.horns },
    trails:  { equipped: () => save.gear.trail,   setEquip: v => save.gear.trail = v,   owned: () => save.owned.trails },
    gadgets: {
      toggle: true,
      isOn: id => save.gear.gadgets.includes(id),
      setOn: (id, on) => {
        save.gear.gadgets = save.gear.gadgets.filter(g => g !== id);
        if (on) save.gear.gadgets.push(id);
      },
      owned: () => save.owned.gadgets,
    },
  };

  function renderWallet() {
    walletEl.textContent = '🪙 ' + save.coins;
  }

  function renderPreview() {
    const dpr = window.devicePixelRatio || 1;
    const w = previewCanvas.clientWidth || 300, h = previewCanvas.clientHeight || 120;
    previewCanvas.width = w * dpr; previewCanvas.height = h * dpr;
    const c = previewCanvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const s = Math.min(w / 72, h / 52);
    drawCar(c, getDesign(save.selected), w / 2, h / 2 + 13 * s, s, 0, 0, playerEquip(save.gear.engine >= 2));
  }

  function drawItemIcon(canvas, cat, item) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 90, h = canvas.clientHeight || 64;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (cat === 'tyres') {
      drawWheel(c, w / 2, h / 2, (h / 2.6) * item.wheelMult, 0.4);
    } else if (cat === 'drivers') {
      drawDriverHead(c, w / 2, h / 2 + 4, h / 3.1, item.id);
    } else if (cat === 'hats') {
      c.fillStyle = '#f1c27d';
      c.beginPath(); c.arc(w / 2, h / 2 + 10, h / 3.4, 0, Math.PI * 2); c.fill();
      drawHat(c, w / 2, h / 2 + 10 - h / 3.4, h / 3.4, item.id);
    } else {
      c.font = `${Math.round(h * 0.62)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(item.icon, w / 2, h / 2 + 2);
    }
  }

  function renderGrid() {
    document.querySelectorAll('.shop-tab').forEach(t =>
      t.classList.toggle('selected', t.dataset.cat === category));
    grid.innerHTML = '';
    const slot = SLOTS[category];
    GEAR_CATALOG[category].forEach(item => {
      const owned = slot.owned().includes(item.id);
      const equipped = slot.toggle ? slot.isOn(item.id) : slot.equipped() === item.id;
      const card = document.createElement('div');
      card.className = 'shop-item' + (equipped ? ' equipped' : '') + (owned ? '' : ' locked');
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      const name = document.createElement('div');
      name.className = 'shop-item-name';
      name.textContent = item.name;
      card.appendChild(name);
      const tag = document.createElement('div');
      tag.className = 'shop-item-tag';
      tag.textContent = equipped ? '✓ ON' : owned ? 'TAP!' : '🪙 ' + item.price;
      card.appendChild(tag);
      grid.appendChild(card);
      requestAnimationFrame(() => drawItemIcon(canvas, category, item));
      card.addEventListener('pointerdown', () => onTap(item, slot, owned));
    });
  }

  function onTap(item, slot, owned) {
    if (owned) {
      if (slot.toggle) {
        const nowOn = !slot.isOn(item.id);
        slot.setOn(item.id, nowOn);
        Speech.say(nowOn ? item.say : `${item.name.toLowerCase()} off.`);
      } else {
        slot.setEquip(item.id);
        Speech.say(item.say);
      }
      persist();
      SFX.click();
      if (category === 'horns') SFX.horn(item.id);
    } else if (save.coins >= item.price) {
      save.coins -= item.price;
      slot.owned().push(item.id);
      if (slot.toggle) slot.setOn(item.id, true);
      else slot.setEquip(item.id);
      persist();
      SFX.unlockCar();
      Speech.say(`You bought it! ${item.say}`);
      if (category === 'horns') setTimeout(() => SFX.horn(item.id), 700);
    } else {
      SFX.click();
      Speech.say(`You need ${item.price - save.coins} more coins! Win races and grab coins to get it!`);
      return;
    }
    renderWallet();
    renderGrid();
    renderPreview();
  }

  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('pointerdown', () => {
      category = tab.dataset.cat;
      SFX.click();
      renderGrid();
    });
  });
  document.getElementById('btn-shop-back').addEventListener('click', () => {
    SFX.click();
    Speech.stop();
    showScreen('title');
  });

  window.initWorkshop = () => {
    renderWallet();
    renderGrid();
    renderPreview();
    Speech.say('Welcome to the workshop! Make your car super cool!');
  };
})();
