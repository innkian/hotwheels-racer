// Screen time — a healthy-play helper for grown-ups.
//
// Counts only ACTIVE play (tab visible + recent interaction), splits racing
// from learning, reminds them to rest their eyes, and winds down gently when
// the daily limit is reached — never yanking a child out mid-race, which is
// what turns a limit into a meltdown.
//
// All of it stays on the device. Nothing is uploaded anywhere.

const ScreenTime = (() => {
  const KEY = 'twr_screentime_v1';
  const IDLE_AFTER = 90;        // seconds without a touch = not really playing
  const BREAK_EVERY = 20 * 60;  // eye-rest reminder (the 20-20-20 rule)

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function blank() {
    return {
      limitMin: 0,          // 0 = no limit
      breaksOn: true,
      days: {},             // "2026-08-22": { racing, learning, menu }
      bonusToday: 0,        // extra minutes a grown-up granted
      bonusDate: null,
    };
  }

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) {}
  function persistST() { localStorage.setItem(KEY, JSON.stringify(data)); }

  function dayRec(d) {
    const k = d || today();
    if (!data.days[k]) data.days[k] = { racing: 0, learning: 0, menu: 0 };
    return data.days[k];
  }

  // ---- live state ----
  let lastInteraction = Date.now();
  let sinceBreak = 0;
  let limitAnnounced = { five: false, one: false, over: false };
  let overCallback = null;
  let warnCallback = null;

  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, () => { lastInteraction = Date.now(); }, { capture: true, passive: true }));

  function isActive() {
    if (document.visibilityState !== 'visible') return false;
    return (Date.now() - lastInteraction) / 1000 < IDLE_AFTER;
  }

  function modeForScreen(screen) {
    if (screen === 'race') return 'racing';
    if (screen === 'quiz' || screen === 'listen') return 'learning';
    return 'menu';
  }

  function secondsToday() {
    const r = dayRec();
    return r.racing + r.learning + r.menu;
  }
  function minutesToday() { return Math.floor(secondsToday() / 60); }

  function allowanceMin() {
    if (!data.limitMin) return Infinity;
    const bonus = data.bonusDate === today() ? data.bonusToday : 0;
    return data.limitMin + bonus;
  }
  function minutesLeft() {
    const cap = allowanceMin();
    return cap === Infinity ? Infinity : Math.max(0, cap - secondsToday() / 60);
  }
  function isOverLimit() { return minutesLeft() <= 0; }

  // Called once a second by the app.
  function tick(screen) {
    if (!isActive()) return;
    const rec = dayRec();
    rec[modeForScreen(screen)] += 1;
    sinceBreak += 1;

    // eye-rest nudge
    if (data.breaksOn && sinceBreak >= BREAK_EVERY) {
      sinceBreak = 0;
      if (warnCallback) warnCallback('break');
    }

    if (data.limitMin) {
      const left = minutesLeft();
      if (left <= 0 && !limitAnnounced.over) {
        limitAnnounced.over = true;
        if (overCallback) overCallback();
      } else if (left <= 1 && left > 0 && !limitAnnounced.one) {
        limitAnnounced.one = true;
        if (warnCallback) warnCallback('one');
      } else if (left <= 5 && left > 1 && !limitAnnounced.five) {
        limitAnnounced.five = true;
        if (warnCallback) warnCallback('five');
      }
    }
    if (secondsToday() % 15 === 0) persistST();
  }

  // ---- settings + reporting ----
  function setLimit(min) {
    data.limitMin = min;
    limitAnnounced = { five: false, one: false, over: false };
    persistST();
  }
  function setBreaks(on) { data.breaksOn = on; persistST(); }
  function grantBonus(min) {
    if (data.bonusDate !== today()) { data.bonusDate = today(); data.bonusToday = 0; }
    data.bonusToday += min;
    limitAnnounced = { five: false, one: false, over: false };
    persistST();
  }
  function resetToday() {
    data.days[today()] = { racing: 0, learning: 0, menu: 0 };
    limitAnnounced = { five: false, one: false, over: false };
    persistST();
  }

  // last 7 days, newest first
  function week() {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const r = data.days[key];
      out.push({
        date: key,
        label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        racing: r ? Math.round(r.racing / 60) : 0,
        learning: r ? Math.round(r.learning / 60) : 0,
        total: r ? Math.round((r.racing + r.learning + r.menu) / 60) : 0,
      });
    }
    return out;
  }

  function onLimitReached(fn) { overCallback = fn; }
  function onWarning(fn) { warnCallback = fn; }

  return {
    tick, minutesToday, minutesLeft, isOverLimit, allowanceMin,
    setLimit, setBreaks, grantBonus, resetToday, week,
    onLimitReached, onWarning,
    get settings() { return { limitMin: data.limitMin, breaksOn: data.breaksOn }; },
    get todayRec() { return dayRec(); },
  };
})();
