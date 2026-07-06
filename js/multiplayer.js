// Two-player racing over Firebase Realtime Database.
//
// One device creates a room and gets a 3-letter code; the other joins with
// it. The host's generated track is shared so both race the same course,
// and each player streams their car position (~10x/s) so the other appears
// live in the race. First to the finish line wins (decided by a transaction
// on the room, so a near-tie can't produce two winners).

const MP = (() => {
  const state = {
    active: false,      // an MP race is running
    phase: 'idle',      // idle | waiting | joining | racing
    role: null,         // 'host' | 'guest'
    code: null,
    remote: null,       // latest snapshot of the other player's car
    remoteDisp: null,   // smoothed display position
    winner: null,
    opponentLeft: false,
  };

  let db = null;
  let roomRef = null;
  let lastPublish = 0;

  function sdkReady() {
    return typeof firebase !== 'undefined' && FIREBASE_CONFIG.databaseURL;
  }
  function getDb() {
    if (db) return db;
    if (!sdkReady()) return null;
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
    } catch (e) {
      db = null;
    }
    return db;
  }
  function timeout(ms) {
    return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  }

  const CODE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // no I/O/Q — easy to read aloud
  function randomCode() {
    let c = '';
    for (let i = 0; i < 3; i++) c += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
    return c;
  }

  // ---------- room lifecycle ----------
  async function createRoom(mode) {
    const d = getDb();
    if (!d) throw new Error('no-sdk');
    const code = randomCode();
    const segs = randomSegments();
    const seed = Math.floor(Math.random() * 2147483647);
    roomRef = d.ref('rooms/' + code);
    await Promise.race([
      roomRef.set({
        created: firebase.database.ServerValue.TIMESTAMP,
        track: encodeTrack(segs),
        seed,
        mode: mode || 'race',
        state: 'waiting',
      }),
      timeout(6000),
    ]);
    roomRef.onDisconnect().remove();
    state.role = 'host';
    state.code = code;
    state.phase = 'waiting';
    // when a guest appears, start the match
    roomRef.child('players/guest').on('value', snap => {
      if (snap.exists() && state.phase === 'waiting') {
        state.phase = 'racing';
        roomRef.child('state').set('racing');
        beginRace(segs, { mode: mode || 'race', seed });
      }
    });
    return code;
  }

  async function joinRoom(code) {
    const d = getDb();
    if (!d) throw new Error('no-sdk');
    roomRef = d.ref('rooms/' + code);
    const snap = await Promise.race([roomRef.get(), timeout(6000)]);
    if (!snap.exists()) throw new Error('no-room');
    const room = snap.val();
    if (room.state !== 'waiting') throw new Error('room-busy');
    state.role = 'guest';
    state.code = code;
    state.phase = 'joining';
    await roomRef.child('players/guest').set({ car: save.selected, joined: firebase.database.ServerValue.TIMESTAMP });
    roomRef.child('players/guest').onDisconnect().remove();
    const segs = decodeTrack(room.track);
    // host flips state to racing the moment it sees us
    roomRef.child('state').on('value', s => {
      if (s.val() === 'racing' && state.phase === 'joining') {
        state.phase = 'racing';
        beginRace(segs, { mode: room.mode || 'race', seed: room.seed });
      }
    });
  }

  function beginRace(segs, opts) {
    state.active = true;
    state.remote = null;
    state.remoteDisp = null;
    state.winner = null;
    state.opponentLeft = false;
    // listen to the other car
    const other = state.role === 'host' ? 'guest' : 'host';
    roomRef.child('players/' + other).on('value', snap => {
      const v = snap.val();
      if (v && v.x !== undefined) state.remote = v;
      else if (state.active && state.remote) state.opponentLeft = true;
    });
    roomRef.child('winner').on('value', snap => {
      if (snap.val()) state.winner = snap.val();
    });
    // share our car's design so custom-built cars render on the other device
    const myDesign = getDesign(save.selected);
    roomRef.child('players/' + state.role).update({
      design: {
        name: myDesign.name, body: myDesign.body, colors: myDesign.colors,
        decal: myDesign.decal, spoiler: !!myDesign.spoiler,
        lights: !!myDesign.lights, weapon: !!myDesign.weapon,
      },
    });
    startCustomRace(segs, opts);
    Speech.say(opts && opts.mode === 'drive'
      ? 'Player 2 is here! Time for a long, long drive!'
      : 'Player 2 is here! Ready to race!');
  }

  // ---------- during the race (called from game.js) ----------
  function publish(car) {
    if (!state.active || !roomRef) return;
    const now = performance.now();
    if (now - lastPublish < 100) return;
    lastPublish = now;
    roomRef.child('players/' + state.role).update({
      car: save.selected,
      x: Math.round(car.x),
      y: Math.round(car.y),
      a: Math.round(car.angle * 100) / 100,
    });
  }

  function reportFinish() {
    if (!state.active || !roomRef) return;
    roomRef.child('players/' + state.role).update({ done: true });
    // first finisher wins — transaction prevents double-winners
    roomRef.child('winner').transaction(cur => cur || state.role);
  }

  function iWon() { return state.winner === state.role; }

  function leave() {
    if (roomRef) {
      try {
        roomRef.child('players/' + state.role).off();
        roomRef.off();
        if (state.role === 'host') roomRef.remove();
        else roomRef.child('players/guest').remove();
      } catch (e) {}
    }
    roomRef = null;
    state.active = false;
    state.phase = 'idle';
    state.role = null;
    state.code = null;
    state.remote = null;
    state.winner = null;
  }

  return { state, createRoom, joinRoom, publish, reportFinish, iWon, leave, sdkReady };
})();
// game.js guards its integration points with `window.MP && ...`
window.MP = MP;

// ===================== Two Players screen =====================
(() => {
  const selectEl = document.getElementById('multi-select');
  const waitEl = document.getElementById('multi-wait');
  const joinEl = document.getElementById('multi-join');
  const errorEl = document.getElementById('multi-error');
  let joinCode = '';

  function showPart(part) {
    selectEl.classList.toggle('hidden', part !== 'select');
    waitEl.classList.toggle('hidden', part !== 'wait');
    joinEl.classList.toggle('hidden', part !== 'join');
    errorEl.classList.add('hidden');
  }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    Speech.say(msg);
  }

  async function createFlow(mode) {
    SFX.click();
    if (!MP.sdkReady()) { showError('Two-player racing needs one more setup step. Ask a grown-up!'); return; }
    showPart('wait');
    document.getElementById('multi-code').textContent = '…';
    try {
      const code = await MP.createRoom(mode);
      document.getElementById('multi-code').textContent = code;
      Speech.say('Tell the other player the secret code: ' + code.split('').join('. ') + '.');
    } catch (e) {
      showPart('select');
      showError(e.message === 'no-sdk' || e.message === 'timeout'
        ? 'Two-player racing needs one more setup step. Ask a grown-up!'
        : 'Something went wrong. Try again!');
    }
  }
  document.getElementById('btn-multi-create').addEventListener('click', () => createFlow('race'));
  document.getElementById('btn-multi-drive').addEventListener('click', () => createFlow('drive'));

  document.getElementById('btn-multi-join').addEventListener('click', () => {
    SFX.click();
    if (!MP.sdkReady()) { showError('Two-player racing needs one more setup step. Ask a grown-up!'); return; }
    joinCode = '';
    renderSlots();
    showPart('join');
  });

  document.getElementById('btn-multi-cancel').addEventListener('click', () => {
    SFX.click();
    MP.leave();
    showPart('select');
  });
  document.getElementById('btn-multi-back').addEventListener('click', () => {
    SFX.click();
    MP.leave();
    showScreen('title');
  });

  function renderSlots() {
    const slots = document.getElementById('multi-slots');
    slots.textContent = (joinCode + '···').slice(0, 3).split('').join(' ');
    document.getElementById('btn-multi-go').disabled = joinCode.length !== 3;
  }

  // A-Z letter pad
  const letterPad = document.getElementById('multi-letters');
  'ABCDEFGHJKLMNPRSTUVWXYZ'.split('').forEach(ch => {
    const b = document.createElement('button');
    b.className = 'letter-btn';
    b.textContent = ch;
    b.addEventListener('pointerdown', () => {
      if (joinCode.length >= 3) return;
      SFX.click();
      joinCode += ch;
      renderSlots();
    });
    letterPad.appendChild(b);
  });
  document.getElementById('btn-multi-clear').addEventListener('click', () => {
    SFX.click();
    joinCode = joinCode.slice(0, -1);
    renderSlots();
  });
  document.getElementById('btn-multi-go').addEventListener('click', async () => {
    if (joinCode.length !== 3) return;
    SFX.click();
    try {
      await MP.joinRoom(joinCode);
      // beginRace fires via the room state listener
    } catch (e) {
      showError(e.message === 'no-room' ? 'Hmm, no race with that code. Check the letters!'
        : e.message === 'room-busy' ? 'That race already started. Make a new one!'
        : 'Two-player racing needs one more setup step. Ask a grown-up!');
      joinCode = '';
      renderSlots();
    }
  });

  window.initMulti = () => {
    joinCode = '';
    showPart('select');
    Speech.say('Two players! One creates the race, one joins with the secret code!');
  };
})();
