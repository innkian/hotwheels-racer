// Rival learning — the computer cars remember past races and improve.
//
// Two things are learned per difficulty and kept in localStorage:
//   1. skill  — a speed/bravery multiplier that climbs when the player wins
//               and eases back when they lose, so the rivals keep pace with
//               the kids even on the same difficulty setting.
//   2. caveSpeed — the pace the player actually survives caves at. Rivals
//               copy it (slightly under), so "go fast through the cave"
//               tricks stop being a free win.
//
// Everything is clamped: rivals never become impossible, and a losing streak
// pulls them back down so a younger sibling isn't locked out.

const Rivals = (() => {
  const KEY = 'twr_rivals_v1';
  const SKILL_MIN = 0.9;
  const SKILL_MAX = 1.6;

  function blank() {
    return { easy: null, medium: null, hard: null, expert: null };
  }
  function blankTier() {
    return { skill: 1, caveSpeed: null, races: 0, wins: 0, losses: 0, streak: 0, level: 1 };
  }

  let store = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) store = Object.assign(blank(), JSON.parse(raw));
  } catch (e) {}
  function persistRivals() { localStorage.setItem(KEY, JSON.stringify(store)); }

  function tier(diff) {
    if (!store[diff]) store[diff] = blankTier();
    return store[diff];
  }

  // What the rivals have learned for this difficulty right now.
  function profile(diff) {
    const t = tier(diff);
    return { skill: t.skill, caveSpeed: t.caveSpeed, level: t.level, races: t.races };
  }

  // "Rival level" is just a friendly 1..10 badge derived from skill.
  function levelFromSkill(skill) {
    return Math.max(1, Math.min(10, Math.round(1 + (skill - SKILL_MIN) / (SKILL_MAX - SKILL_MIN) * 9)));
  }

  // Called at the end of every single-player race.
  //   won        — did the player finish first?
  //   marginSec  — seconds between the player and the best rival (+ = player won by)
  //   playerCave — the player's average speed inside caves this race (or null)
  // Returns { leveledUp, level, skill } so the UI can celebrate/warn.
  function recordRace(diff, won, marginSec, playerCave) {
    const t = tier(diff);
    const before = t.level;
    t.races += 1;

    // --- learn the pace ---
    if (won) {
      t.wins += 1;
      t.streak = Math.max(0, t.streak) + 1;
      // bigger jumps when the player wins comfortably
      const step = marginSec > 6 ? 0.05 : marginSec > 2 ? 0.035 : 0.02;
      // a win streak compounds: they're clearly too easy
      t.skill += step * (1 + Math.min(2, t.streak - 1) * 0.35);
    } else {
      t.losses += 1;
      t.streak = Math.min(0, t.streak) - 1;
      // ease off faster the more they lose, so kids never get stuck
      const back = t.streak <= -3 ? 0.05 : 0.025;
      t.skill -= back;
    }
    t.skill = Math.max(SKILL_MIN, Math.min(SKILL_MAX, t.skill));

    // --- learn the player's cave technique ---
    if (playerCave && playerCave > 120) {
      // copy 92% of whatever the player gets away with, smoothed over races
      const target = playerCave * 0.92;
      t.caveSpeed = t.caveSpeed === null ? target : t.caveSpeed * 0.65 + target * 0.35;
    }

    t.level = levelFromSkill(t.skill);
    persistRivals();
    return { leveledUp: t.level > before, leveledDown: t.level < before, level: t.level, skill: t.skill };
  }

  function summary() {
    return Object.entries(store)
      .filter(([, t]) => t && t.races > 0)
      .map(([diff, t]) => ({
        diff,
        level: t.level,
        races: t.races,
        wins: t.wins,
        losses: t.losses,
        caveSpeed: t.caveSpeed ? Math.round(t.caveSpeed) : null,
      }));
  }

  function reset(diff) {
    if (diff) store[diff] = blankTier();
    else store = blank();
    persistRivals();
  }

  return { profile, recordRace, summary, reset, levelFromSkill };
})();
