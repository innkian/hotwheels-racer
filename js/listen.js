// Listen & Find — the game speaks an instruction and he taps the right car.
// Wrong answers get gentle corrective feedback ("That's the BLUE car...")
// which models the vocabulary; two misses make the right answer pulse.

(() => {
  const grid = document.getElementById('listen-grid');
  const promptEl = document.getElementById('listen-prompt');
  const starsEl = document.getElementById('listen-stars');

  let challenge = null;
  let stepIndex = 0;
  let missesThisStep = 0;
  let firstTryThisStep = true;
  let roundLocked = false;

  function speakStep() {
    const step = challenge.steps[stepIndex];
    if (challenge.level === 4 && stepIndex === 0) {
      Speech.say(challenge.prompt);
    } else if (challenge.level === 4) {
      Speech.say(`Now tap ${step.text}.`);
    } else {
      Speech.say(challenge.prompt);
    }
    promptEl.textContent = challenge.level === 4
      ? `1️⃣ ${challenge.steps[0].text}  2️⃣ ${challenge.steps[1].text}`
      : step.text.toUpperCase();
  }

  function updateStars() {
    starsEl.textContent = '⭐ ' + Learning.state.stars;
  }

  function newRound() {
    challenge = Learning.nextChallenge();
    stepIndex = 0;
    missesThisStep = 0;
    firstTryThisStep = true;
    roundLocked = false;
    grid.innerHTML = '';
    const dpr = window.devicePixelRatio || 1;
    challenge.choices.forEach(id => {
      const design = getDesign(id);
      const card = document.createElement('div');
      card.className = 'listen-card';
      card.dataset.carId = id;
      const canvas = document.createElement('canvas');
      card.appendChild(canvas);
      grid.appendChild(card);
      requestAnimationFrame(() => {
        const w = canvas.clientWidth || 140, h = canvas.clientHeight || 90;
        canvas.width = w * dpr; canvas.height = h * dpr;
        const c = canvas.getContext('2d');
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const s = Math.min(w / 66, h / 44);
        drawCar(c, design, w / 2, h / 2 + 11 * s, s, 0, 0);
      });
      card.addEventListener('pointerdown', () => onTap(card, design));
    });
    updateStars();
    setTimeout(speakStep, 350);
  }

  function celebrateAndContinue() {
    roundLocked = true;
    const result = Learning.record(challenge.steps.flatMap(s => s.concepts), firstTryThisStep);
    Learning.addStar();  // he gets the star for finishing, even after misses
    updateStars();
    let delay = 1300;
    if (Learning.pendingFreeUnlock()) {
      Learning.claimFreeUnlock();
      const unlocked = unlockNext();
      if (unlocked) {
        delay = 3200;
        setTimeout(() => {
          SFX.unlockCar();
          Speech.say(`Wow! You earned a new car! ${unlocked.name}!`);
          showListenUnlock(unlocked);
        }, 900);
      }
    } else if (result === 'levelup') {
      SFX.win();
      Speech.say('Level up! You are getting so good!', { interrupt: false });
      delay = 2400;
    }
    setTimeout(newRound, delay);
  }

  function onTap(card, design) {
    if (roundLocked) return;
    const step = challenge.steps[stepIndex];
    SFX.click();
    if (design.id === step.targetId) {
      card.classList.add('correct');
      SFX.coin();
      const w = carWords(design);
      if (stepIndex < challenge.steps.length - 1) {
        Speech.say(`Yes! The ${stepText(step)}!`);
        stepIndex += 1;
        missesThisStep = 0;
        setTimeout(speakStep, 1100);
      } else {
        Speech.say(pickPraise() + ` The ${stepText(step)}!`);
        celebrateAndContinue();
      }
    } else {
      missesThisStep += 1;
      firstTryThisStep = false;
      card.classList.add('wrong');
      setTimeout(() => card.classList.remove('wrong'), 600);
      const w = carWords(design);
      Speech.say(`That's the ${w.color} ${w.type}. Find ${step.text}!`);
      if (missesThisStep >= 2) {
        const target = grid.querySelector(`[data-car-id="${step.targetId}"]`);
        if (target) target.classList.add('hint');
      }
    }
  }

  function stepText(step) {
    return step.text.replace(/^the /, '');
  }
  const PRAISE = ['Yes!', 'Great job!', 'You got it!', 'Awesome!', 'Super!'];
  function pickPraise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

  function showListenUnlock(design) {
    const overlay = document.getElementById('listen-unlock');
    const canvas = document.getElementById('listen-unlock-canvas');
    document.getElementById('listen-unlock-name').textContent = design.name;
    overlay.classList.remove('hidden');
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawCar(c, design, 80, 78, 2.1, 0, 0);
    setTimeout(() => overlay.classList.add('hidden'), 2800);
  }

  document.getElementById('btn-listen-repeat').addEventListener('click', () => {
    SFX.click();
    if (challenge) speakStep();
  });
  document.getElementById('btn-listen-back').addEventListener('click', () => {
    SFX.click();
    Speech.stop();
    showScreen('title');
  });

  // game.js calls this when the screen opens
  window.initListen = () => {
    updateStars();
    newRound();
  };
})();
