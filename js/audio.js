// Tiny sound-effect synth using the Web Audio API — no sound files needed.

const SFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type = 'sine', startGain = 0.2, when = 0) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + when);
    gain.gain.setValueAtTime(startGain, c.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + when);
    osc.stop(c.currentTime + when + duration);
  }

  // tone that slides between two pitches — for animal horn sounds
  function slide(f1, f2, duration, type = 'sawtooth', startGain = 0.2, when = 0) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, c.currentTime + when);
    osc.frequency.exponentialRampToValueAtTime(f2, c.currentTime + when + duration);
    gain.gain.setValueAtTime(startGain, c.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + when);
    osc.stop(c.currentTime + when + duration);
  }

  return {
    unlock() { getCtx(); },
    horn(kind) {
      if (kind === 'train') {
        [311, 370].forEach(f => { tone(f, 0.5, 'sawtooth', 0.18); tone(f, 0.5, 'sawtooth', 0.18, 0.6); });
      } else if (kind === 'dog') {
        slide(520, 300, 0.12, 'sawtooth', 0.25);
        slide(520, 300, 0.12, 'sawtooth', 0.25, 0.2);
      } else if (kind === 'cow') {
        slide(240, 165, 0.8, 'sawtooth', 0.22);
        slide(360, 250, 0.35, 'sawtooth', 0.12);
      } else if (kind === 'elephant') {
        slide(280, 700, 0.45, 'sawtooth', 0.25);
        slide(700, 500, 0.25, 'sawtooth', 0.2, 0.45);
      } else { // beep
        tone(660, 0.15, 'square', 0.2);
        tone(660, 0.15, 'square', 0.2, 0.2);
      }
    },
    click() { tone(520, 0.08, 'triangle', 0.15); },
    countBeep() { tone(440, 0.12, 'square', 0.15); },
    go() { tone(880, 0.25, 'square', 0.2); },
    crash() {
      const c = getCtx();
      const bufferSize = c.sampleRate * 0.25;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.35, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      noise.connect(gain).connect(c.destination);
      noise.start();
      tone(120, 0.3, 'sawtooth', 0.2);
    },
    coin() { tone(1046, 0.08, 'square', 0.15); tone(1568, 0.12, 'square', 0.15, 0.08); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, i * 0.12));
    },
    lose() {
      [392, 349, 294].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.15, i * 0.15));
    },
    unlockCar() {
      [659, 784, 988, 1318].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, i * 0.1));
    },
  };
})();
