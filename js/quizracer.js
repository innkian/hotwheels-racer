// Quiz Racer — answer questions to make your car go faster.
//
// The car drives itself; every correct answer is a burst of speed and a
// streak bonus, every wrong answer slows it down (never a hard stop, so a
// younger player still finishes). A rival car races alongside, so being
// quick AND right matters. Questions are generated, not hand-listed, so the
// bank never runs out, and each subject scales across three age bands.

(() => {
  const canvas = document.getElementById('quiz-canvas');
  const ctx = canvas.getContext('2d');

  const TRACK_M = 1000;          // metres to the finish
  const BASE_SPEED = 26;         // m/s while idling along
  const CORRECT_BOOST = 15;      // instant speed added for a right answer
  const MAX_SPEED = 145;
  const DRAG = 0.55;             // how fast speed bleeds back toward base

  let state = null;
  let raf = null;

  // ---------- question generators ----------
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rnd(arr.length)];
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);

  function uniqueChoices(correct, makeWrong, count = 3) {
    const set = new Set([String(correct)]);
    let guard = 0;
    while (set.size < count && guard++ < 60) set.add(String(makeWrong()));
    return shuffle([...set]);
  }

  function mathQ(age) {
    if (age === 4) {
      const kind = pick(['add', 'count', 'bigger']);
      if (kind === 'add') {
        const a = 1 + rnd(5), b = 1 + rnd(5);
        const ans = a + b;
        return { topic: 'add', q: `${a} plus ${b}`, say: `What is ${a} plus ${b}?`,
                 choices: uniqueChoices(ans, () => Math.max(1, ans + rnd(5) - 2)), answer: String(ans) };
      }
      if (kind === 'count') {
        const n = 2 + rnd(6);
        return { topic: 'count', q: `How many? ${'🚗'.repeat(n)}`, say: 'How many cars?',
                 choices: uniqueChoices(n, () => Math.max(1, n + rnd(5) - 2)), answer: String(n) };
      }
      const a = 1 + rnd(9);
      let b = 1 + rnd(9);
      while (b === a) b = 1 + rnd(9);
      const ans = Math.max(a, b);
      return { topic: 'compare', q: `Which is bigger?  ${a}  or  ${b}`, say: `Which is bigger, ${a} or ${b}?`,
               choices: shuffle([String(a), String(b)]), answer: String(ans) };
    }
    if (age === 6) {
      const kind = pick(['add', 'sub', 'double', 'ten']);
      if (kind === 'add') {
        const a = 2 + rnd(15), b = 2 + rnd(10);
        const ans = a + b;
        return { topic: 'add', q: `${a} + ${b}`, say: `What is ${a} plus ${b}?`,
                 choices: uniqueChoices(ans, () => Math.max(1, ans + rnd(9) - 4)), answer: String(ans) };
      }
      if (kind === 'sub') {
        const a = 6 + rnd(14), b = 1 + rnd(6);
        const ans = a - b;
        return { topic: 'subtract', q: `${a} − ${b}`, say: `What is ${a} take away ${b}?`,
                 choices: uniqueChoices(ans, () => Math.max(0, ans + rnd(7) - 3)), answer: String(ans) };
      }
      if (kind === 'double') {
        const a = 2 + rnd(10);
        const ans = a * 2;
        return { topic: 'double', q: `Double ${a}`, say: `What is double ${a}?`,
                 choices: uniqueChoices(ans, () => Math.max(1, ans + rnd(7) - 3)), answer: String(ans) };
      }
      const a = 1 + rnd(9);
      const ans = 10 - a;
      return { topic: 'bonds', q: `${a} + ? = 10`, say: `${a} plus what makes ten?`,
               choices: uniqueChoices(ans, () => Math.max(0, ans + rnd(5) - 2)), answer: String(ans) };
    }
    // age 8+
    const kind = pick(['times', 'divide', 'add3', 'half']);
    if (kind === 'times') {
      const a = 2 + rnd(11), b = 2 + rnd(11);
      const ans = a * b;
      return { topic: 'times', q: `${a} × ${b}`, say: `What is ${a} times ${b}?`,
               choices: uniqueChoices(ans, () => ans + (rnd(2) ? a : b) * (rnd(2) ? 1 : -1)), answer: String(ans) };
    }
    if (kind === 'divide') {
      const b = 2 + rnd(9), ans = 2 + rnd(11);
      return { topic: 'divide', q: `${b * ans} ÷ ${b}`, say: `What is ${b * ans} divided by ${b}?`,
               choices: uniqueChoices(ans, () => Math.max(1, ans + rnd(5) - 2)), answer: String(ans) };
    }
    if (kind === 'add3') {
      const a = 10 + rnd(80), b = 10 + rnd(80);
      const ans = a + b;
      return { topic: 'add', q: `${a} + ${b}`, say: `What is ${a} plus ${b}?`,
               choices: uniqueChoices(ans, () => ans + (rnd(4) + 1) * 10 * (rnd(2) ? 1 : -1)), answer: String(ans) };
    }
    const ans = 2 + rnd(25);
    return { topic: 'half', q: `Half of ${ans * 2}`, say: `What is half of ${ans * 2}?`,
             choices: uniqueChoices(ans, () => Math.max(1, ans + rnd(7) - 3)), answer: String(ans) };
  }

  const SCIENCE = {
    4: [
      ['Which animal says moo?', 'Cow', ['Dog', 'Duck', 'Cat']],
      ['Which one can fly?', 'Bird', ['Fish', 'Dog', 'Snail']],
      ['What do we drink when thirsty?', 'Water', ['Sand', 'Rocks', 'Paper']],
      ['Which one is hot?', 'The sun', ['Ice', 'Snow', 'A fridge']],
      ['Where do fish live?', 'In water', ['In trees', 'In the sky', 'Under beds']],
      ['What do plants need to grow?', 'Sunlight', ['Toys', 'Shoes', 'Socks']],
      ['Which one is an insect?', 'Ant', ['Horse', 'Shark', 'Eagle']],
      ['What falls from clouds?', 'Rain', ['Bricks', 'Cars', 'Books']],
      ['What colour is grass?', 'Green', ['Purple', 'Orange', 'Black']],
      ['Which one is a baby dog?', 'Puppy', ['Kitten', 'Calf', 'Foal']],
      ['What do we use to see?', 'Eyes', ['Ears', 'Nose', 'Feet']],
      ['Which one floats on water?', 'A boat', ['A rock', 'A brick', 'A coin']],
      ['What do cows give us?', 'Milk', ['Juice', 'Bread', 'Eggs']],
      ['Which one is cold?', 'Ice', ['Fire', 'The sun', 'Soup']],
      ['Where do birds build nests?', 'In trees', ['Under water', 'In ovens', 'In shoes']],
      ['What do we wear when it rains?', 'A raincoat', ['Sunglasses', 'Swimmers', 'A scarf']],
      ['Which animal has a long trunk?', 'Elephant', ['Zebra', 'Tiger', 'Rabbit']],
      ['What do bees visit?', 'Flowers', ['Rocks', 'Cars', 'Books']],
      ['Which one is a fruit?', 'Apple', ['Chair', 'Sock', 'Pencil']],
      ['What comes out at night?', 'The moon', ['The sun', 'Rainbows', 'Clouds']],
    ],
    6: [
      ['How many legs does a spider have?', '8', ['6', '4', '10']],
      ['Which planet do we live on?', 'Earth', ['Mars', 'Jupiter', 'Venus']],
      ['What do bees make?', 'Honey', ['Milk', 'Bread', 'Cheese']],
      ['Ice is water that is very…', 'Cold', ['Hot', 'Loud', 'Fast']],
      ['Which is a mammal?', 'Dog', ['Frog', 'Snake', 'Lizard']],
      ['What do we breathe in?', 'Air', ['Water', 'Sand', 'Metal']],
      ['A baby frog is called a…', 'Tadpole', ['Puppy', 'Calf', 'Chick']],
      ['Which gives us light in the day?', 'The sun', ['The moon', 'A star', 'A lamp']],
      ['What pulls things down to the ground?', 'Gravity', ['Wind', 'Sound', 'Light']],
      ['How many legs does an insect have?', '6', ['8', '4', '10']],
      ['What is the biggest animal in the sea?', 'Blue whale', ['Shark', 'Dolphin', 'Octopus']],
      ['Which season is coldest?', 'Winter', ['Summer', 'Spring', 'Autumn']],
      ['What do we call frozen rain?', 'Hail', ['Fog', 'Mist', 'Steam']],
      ['Which animal hatches from an egg?', 'Chicken', ['Cat', 'Dog', 'Cow']],
      ['What does a caterpillar become?', 'Butterfly', ['Bee', 'Spider', 'Beetle']],
      ['Which part of a plant is underground?', 'Roots', ['Leaves', 'Flower', 'Stem']],
      ['What is the sun?', 'A star', ['A planet', 'A moon', 'A cloud']],
      ['Which material is see-through?', 'Glass', ['Wood', 'Metal', 'Brick']],
      ['How many teeth do adults usually have?', '32', ['20', '40', '12']],
      ['What do we call animals that eat only plants?', 'Herbivores', ['Carnivores', 'Omnivores', 'Insects']],
      ['Which is a reptile?', 'Lizard', ['Frog', 'Dolphin', 'Owl']],
    ],
    8: [
      ['What force pulls objects toward Earth?', 'Gravity', ['Friction', 'Magnetism', 'Pressure']],
      ['Which gas do plants take in?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium']],
      ['How many bones does an adult have?', '206', ['150', '300', '96']],
      ['Water boils at what temperature?', '100°C', ['50°C', '0°C', '200°C']],
      ['Which planet is the largest?', 'Jupiter', ['Earth', 'Mars', 'Mercury']],
      ['What is the centre of an atom called?', 'Nucleus', ['Electron', 'Shell', 'Cell']],
      ['Which organ pumps blood?', 'Heart', ['Lung', 'Brain', 'Liver']],
      ['Solid, liquid and…?', 'Gas', ['Metal', 'Wood', 'Sand']],
      ['What is H2O better known as?', 'Water', ['Salt', 'Oxygen', 'Acid']],
      ['Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Saturn', 'Neptune']],
      ['What do we call molten rock above ground?', 'Lava', ['Magma', 'Granite', 'Coal']],
      ['Which blood cells fight infection?', 'White blood cells', ['Red blood cells', 'Platelets', 'Plasma']],
      ['What is the fastest land animal?', 'Cheetah', ['Lion', 'Horse', 'Ostrich']],
      ['Which energy comes from the sun?', 'Solar', ['Nuclear', 'Tidal', 'Chemical']],
      ['What holds planets in orbit?', 'Gravity', ['Magnetism', 'Wind', 'Friction']],
      ['Which state of matter has a fixed shape?', 'Solid', ['Liquid', 'Gas', 'Plasma']],
      ['What gas do we breathe out most of?', 'Carbon dioxide', ['Hydrogen', 'Helium', 'Neon']],
      ['How long does Earth take to orbit the sun?', 'One year', ['One day', 'One month', 'One week']],
      ['Which instrument measures temperature?', 'Thermometer', ['Barometer', 'Telescope', 'Microscope']],
      ['What is the largest organ of the body?', 'Skin', ['Heart', 'Brain', 'Liver']],
    ],
  };

  const ENGLISH = {
    4: [
      ['Which word rhymes with CAT?', 'Hat', ['Dog', 'Sun', 'Cup']],
      ['What letter does BALL start with?', 'B', ['D', 'P', 'T']],
      ['Which one is an animal?', 'Dog', ['Chair', 'Cup', 'Hat']],
      ['What letter does SUN start with?', 'S', ['M', 'N', 'R']],
      ['Which rhymes with CAR?', 'Star', ['Boat', 'Tree', 'Cup']],
      ['Big is the opposite of…', 'Small', ['Loud', 'Fast', 'Wet']],
      ['Which one do you read?', 'Book', ['Shoe', 'Spoon', 'Sock']],
      ['Which rhymes with BED?', 'Red', ['Sock', 'Milk', 'Tree']],
      ['What letter does MOON start with?', 'M', ['W', 'V', 'Z']],
      ['Up is the opposite of…', 'Down', ['Left', 'Round', 'Near']],
      ['Which one is a colour?', 'Blue', ['Chair', 'Jump', 'Loud']],
      ['Which rhymes with DOG?', 'Log', ['Cat', 'Cup', 'Pin']],
      ['What letter does TREE start with?', 'T', ['F', 'E', 'K']],
      ['Day is the opposite of…', 'Night', ['Warm', 'Fast', 'Soft']],
      ['Which one do you eat?', 'Apple', ['Shoe', 'Hat', 'Book']],
      ['Which rhymes with SUN?', 'Fun', ['Sit', 'Top', 'Bag']],
      ['What letter does FISH start with?', 'F', ['S', 'H', 'B']],
      ['Wet is the opposite of…', 'Dry', ['Tall', 'Loud', 'New']],
      ['Which one is a number word?', 'Three', ['Green', 'Running', 'Table']],
    ],
    6: [
      ['Which is a describing word?', 'Happy', ['Run', 'Table', 'Jump']],
      ['More than one BOX is…', 'Boxes', ['Boxs', 'Boxen', 'Box']],
      ['Hot is the opposite of…', 'Cold', ['Fast', 'Tall', 'Loud']],
      ['Which word is spelled right?', 'Friend', ['Freind', 'Frend', 'Frainf']],
      ['Which is a doing word (verb)?', 'Jump', ['Blue', 'Chair', 'Slow']],
      ['More than one CHILD is…', 'Children', ['Childs', 'Childes', 'Childrens']],
      ['Which rhymes with LIGHT?', 'Night', ['Loud', 'Lamp', 'Live']],
      ['What ends a question?', '?', ['.', '!', ',']],
      ['More than one MOUSE is…', 'Mice', ['Mouses', 'Mices', 'Mouse']],
      ['Which word is a plural?', 'Dogs', ['Dog', 'Barking', 'Fast']],
      ['Up is the opposite of…', 'Down', ['Under', 'Beside', 'Over']],
      ['Which is spelled correctly?', 'Because', ['Becuase', 'Becase', 'Becouse']],
      ['What sound does SH make in SHIP?', 'sh', ['ch', 'th', 's']],
      ['Which word rhymes with TRAIN?', 'Rain', ['Trick', 'Turn', 'Tent']],
      ['A word that names a person or place is a…', 'Noun', ['Verb', 'Adverb', 'Adjective']],
      ['Past tense of GO is…', 'Went', ['Goed', 'Gone', 'Going']],
      ['Which starts a sentence?', 'A capital letter', ['A comma', 'A full stop', 'A space']],
      ['More than one FOOT is…', 'Feet', ['Foots', 'Feets', 'Footes']],
      ['Which is spelled correctly?', 'People', ['Pepole', 'Peaple', 'Peopel']],
      ['Empty is the opposite of…', 'Full', ['Heavy', 'Bright', 'Quiet']],
    ],
    8: [
      ['Which is a noun?', 'Mountain', ['Quickly', 'Bright', 'Running']],
      ['Which is an adverb?', 'Quickly', ['Quick', 'Quicken', 'Quickness']],
      ['Past tense of RUN is…', 'Ran', ['Runned', 'Runs', 'Running']],
      ['Which is spelled correctly?', 'Necessary', ['Neccessary', 'Necesary', 'Nesessary']],
      ['A word meaning HAPPY is…', 'Joyful', ['Gloomy', 'Weary', 'Angry']],
      ['Which is a synonym for BIG?', 'Enormous', ['Tiny', 'Narrow', 'Faint']],
      ['Their, there or they’re: "___ car is red."', 'Their', ['There', "They're", 'Thier']],
      ['Which punctuation shows excitement?', '!', ['?', ';', ':']],
      ['Which is a conjunction?', 'Because', ['Quickly', 'Bright', 'Table']],
      ['Plural of CHILD is…', 'Children', ['Childs', 'Childes', 'Childrens']],
      ['An antonym for GENEROUS is…', 'Selfish', ['Kind', 'Giving', 'Warm']],
      ['Which is spelled correctly?', 'Definitely', ['Definately', 'Definitly', 'Defenitely']],
      ['Past tense of BRING is…', 'Brought', ['Bringed', 'Brang', 'Broughted']],
      ['Which is an adjective?', 'Enormous', ['Slowly', 'Running', 'Mountain']],
      ['A group of words with a subject and verb is a…', 'Sentence', ['Syllable', 'Letter', 'Prefix']],
      ['Its or it’s: "___ raining outside."', "It's", ['Its', 'Its’', 'It s']],
      ['Which word means very tired?', 'Exhausted', ['Excited', 'Curious', 'Cheerful']],
      ['The prefix UN- means…', 'Not', ['Again', 'Before', 'Many']],
      ['Which is a compound word?', 'Football', ['Running', 'Pretty', 'Under']],
      ['Synonym for SAID is…', 'Replied', ['Jumped', 'Listened', 'Waited']],
    ],
  };

  function bankQ(bank, age, topicName) {
    const list = bank[age] || bank[6];
    const [q, ans, wrong] = pick(list);
    return { topic: topicName, q, say: q, choices: shuffle([ans, ...wrong.slice(0, 3)]), answer: ans };
  }

  function generateOne(subj) {
    if (subj === 'math') return mathQ(state.age);
    if (subj === 'science') return bankQ(SCIENCE, state.age, 'science');
    if (subj === 'english') return bankQ(ENGLISH, state.age, 'english');
    return ShapeQuiz.next(state.age);
  }

  // Normalise every question so choices are always [{key, text?, fig?}]
  function normalise(q) {
    if (q.choices.length && typeof q.choices[0] === 'string') {
      q.choices = q.choices.map(t => ({ key: t, text: t }));
    }
    return q;
  }

  function nextQuestion() {
    const subj = state.subject === 'mixed'
      ? pick(['math', 'science', 'english', 'shapes'])
      : state.subject;
    // offer the memory a few candidates; it favours weaker topics and
    // skips anything asked recently
    const candidates = [];
    for (let i = 0; i < 10; i++) candidates.push(normalise(generateOne(subj)));
    return QuizMemory.choose(subj, state.age, candidates);
  }

  // ---------- rendering ----------
  function groundY(x, h) {
    return h * 0.62 + Math.sin(x / 190) * 14 + Math.sin(x / 70) * 5;
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 200;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const stage = stageById(save.gear.stage);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, stage.sky[0]);
    sky.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const camX = state.dist * 6;
    // ground
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let px = 0; px <= w; px += 10) ctx.lineTo(px, groundY(px + camX, h));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = stage.ground;
    ctx.fill();
    ctx.beginPath();
    for (let px = 0; px <= w; px += 10) {
      const y = groundY(px + camX, h);
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.strokeStyle = stage.grass;
    ctx.lineWidth = 7;
    ctx.stroke();

    // rival car (slightly ahead or behind depending on your speed)
    const rivalPx = w * 0.62 + (state.rivalDist - state.dist) * 1.9;
    if (rivalPx > -80 && rivalPx < w + 80) {
      const ry = groundY(rivalPx + camX, h);
      drawCar(ctx, { body: 'sporty', colors: { body: '#2b6cff', accent: '#fff', window: '#111' }, decal: 'stripe', spoiler: true },
              rivalPx, ry, 1.15, 0, camX / 12);
    }

    // player car
    const px = w * 0.3;
    const py = groundY(px + camX, h);
    drawCar(ctx, getDesign(save.selected), px, py, 1.25, 0, camX / 10, playerEquip(state.speed > 60));
    // speed lines
    if (state.speed > 55) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ly = py - 20 - i * 9;
        ctx.beginPath();
        ctx.moveTo(px - 45 - (state.speed - 55) * 0.5, ly);
        ctx.lineTo(px - 30, ly);
        ctx.stroke();
      }
    }
  }

  // ---------- loop ----------
  let last = 0;
  function loop(ts) {
    if (!state || state.done) return;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    // speed drifts back toward the base pace
    state.speed += (BASE_SPEED - state.speed) * DRAG * dt;
    state.speed = Math.max(BASE_SPEED * 0.45, Math.min(MAX_SPEED, state.speed));
    state.dist += state.speed * dt * 0.55;
    state.rivalDist += state.rivalSpeed * dt * 0.55;

    document.getElementById('quiz-speedo').textContent = '🚗 ' + Math.round(state.speed) + ' km/h';
    document.getElementById('quiz-progress').style.width =
      Math.min(100, (state.dist / TRACK_M) * 100) + '%';

    draw();

    if (state.dist >= TRACK_M || state.rivalDist >= TRACK_M) return finish();
    raf = requestAnimationFrame(loop);
  }

  // ---------- question flow ----------
  function paintCanvas(cv, drawFn) {
    requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth || 120, h = cv.clientHeight || 90;
      cv.width = w * dpr; cv.height = h * dpr;
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFn(c, w, h);
    });
  }

  function askQuestion() {
    state.current = nextQuestion();
    const cur = state.current;
    document.getElementById('quiz-question').textContent = cur.q;
    Speech.say(cur.say);

    // picture prompt (shape puzzles)
    const promptBox = document.getElementById('quiz-prompt-figs');
    promptBox.innerHTML = '';
    if (cur.promptFigs) {
      promptBox.classList.remove('hidden');
      const cv = document.createElement('canvas');
      promptBox.appendChild(cv);
      paintCanvas(cv, (c, w, h) => drawFigureRow(c, cur.promptFigs, w, h, cur.promptQMark));
    } else {
      promptBox.classList.add('hidden');
    }

    const box = document.getElementById('quiz-answers');
    box.innerHTML = '';
    box.classList.toggle('figs', cur.choices.some(ch => ch.fig));
    cur.choices.forEach(choice => {
      const b = document.createElement('button');
      b.className = 'quiz-answer';
      if (choice.fig) {
        const cv = document.createElement('canvas');
        b.appendChild(cv);
        paintCanvas(cv, (c, w, h) => drawFigure(c, choice.fig, w / 2, h / 2, Math.min(w, h) * 0.8));
      } else {
        b.textContent = choice.text;
      }
      b.addEventListener('pointerdown', () => answer(choice.key, b));
      box.appendChild(b);
    });
  }

  function answer(choiceKey, btn) {
    if (!state || state.locked || state.done) return;
    state.locked = true;
    const right = choiceKey === state.current.answer;
    QuizMemory.record(state.subject, state.age, state.current, right);
    if (right) {
      state.correct++;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.speed = Math.min(MAX_SPEED, state.speed + CORRECT_BOOST + Math.min(20, state.streak * 2.5));
      state.coins += 2;
      btn.classList.add('right');
      SFX.coin();
      const cheers = ['Yes!', 'Correct!', 'Great!', 'Nice one!', 'Zoom!'];
      Speech.say(state.streak >= 3 ? `${cheers[0]} ${state.streak} in a row! Speed boost!` : cheers[Math.floor(Math.random() * cheers.length)]);
    } else {
      state.streak = 0;
      state.speed *= 0.6;
      btn.classList.add('wrong');
      const idx = state.current.choices.findIndex(c => c.key === state.current.answer);
      const rightBtn = document.querySelectorAll('.quiz-answer')[idx];
      if (rightBtn) rightBtn.classList.add('right');
      SFX.crash();
      const spoken = state.current.choices[idx];
      Speech.say(spoken && spoken.text ? `The answer is ${spoken.text}.` : 'This one is the answer.');
    }
    document.getElementById('quiz-streak').textContent = '🔥 ' + state.streak;
    setTimeout(() => {
      if (!state || state.done) return;
      state.locked = false;
      askQuestion();
    }, right ? 800 : 1700);
  }

  function finish() {
    state.done = true;
    if (raf) cancelAnimationFrame(raf);
    const won = state.dist >= state.rivalDist;
    save.coins += state.coins;
    persist();
    const panel = document.getElementById('quiz-result-panel');
    panel.innerHTML = `
      <h2>${won ? '🏆 You won the quiz race!' : '🏁 So close! The blue car won.'}</h2>
      <p style="font-size:19px;color:#1d3557;font-weight:700;">
        ✅ ${state.correct} correct · 🔥 best streak ${state.bestStreak}
      </p>
      <p style="font-size:18px;color:#b07d00;font-weight:700;">🪙 +${state.coins} coins for your garage!</p>
      ${QuizMemory.readyToLevelUp(state.subject, state.age) && state.age < 8
        ? `<p style="font-size:18px;color:#7b2cbf;font-weight:800;">🌟 You're acing these! Try the older questions?</p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        ${QuizMemory.readyToLevelUp(state.subject, state.age) && state.age < 8
          ? `<button id="btn-quiz-levelup" class="big-btn purple">⬆ Harder questions</button>` : ''}
        <button id="btn-quiz-again" class="big-btn">🔄 Race Again</button>
        <button id="btn-quiz-menu" class="big-btn gray">⬅ Back</button>
      </div>`;
    document.getElementById('quiz-result').classList.remove('hidden');
    won ? SFX.win() : SFX.lose();
    Speech.say(won
      ? `You won! You got ${state.correct} right!`
      : `Good try! You got ${state.correct} right. Race again!`);
    const lvlBtn = document.getElementById('btn-quiz-levelup');
    if (lvlBtn) lvlBtn.addEventListener('click', () => {
      SFX.click();
      const nextAge = state.age === 4 ? 6 : 8;
      save.quizAge = nextAge;
      persist();
      Speech.say('Harder questions! Good luck!');
      startRace(state.subject, nextAge);
    });
    document.getElementById('btn-quiz-again').addEventListener('click', () => {
      SFX.click();
      startRace(state.subject, state.age);
    });
    document.getElementById('btn-quiz-menu').addEventListener('click', () => {
      SFX.click();
      stopRace();
      showSubjectPicker();
    });
  }

  function startRace(subject, age) {
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-subject').classList.add('hidden');
    document.getElementById('quiz-play').classList.remove('hidden');
    // rival pace scales with age band so it stays a real race
    const rivalSpeed = age === 4 ? 30 : age === 6 ? 38 : 46;
    state = {
      subject, age,
      speed: BASE_SPEED, dist: 0,
      rivalDist: 0, rivalSpeed,
      correct: 0, streak: 0, bestStreak: 0, coins: 0,
      locked: false, done: false, current: null,
    };
    document.getElementById('quiz-streak').textContent = '🔥 0';
    askQuestion();
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stopRace() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (state) state.done = true;
    state = null;
    Speech.stop();
  }

  function showSubjectPicker() {
    document.getElementById('quiz-play').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-subject').classList.remove('hidden');
    const age = save.quizAge || 6;
    document.querySelectorAll('.quiz-age').forEach(b =>
      b.classList.toggle('selected', +b.dataset.age === age));
  }

  // ---------- wiring ----------
  document.querySelectorAll('.quiz-age').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      save.quizAge = +btn.dataset.age;
      persist();
      SFX.click();
      showSubjectPicker();
    });
  });
  document.querySelectorAll('.quiz-subj').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      SFX.go();
      startRace(btn.dataset.subj, save.quizAge || 6);
    });
  });
  document.getElementById('btn-quiz-back').addEventListener('click', () => {
    SFX.click();
    stopRace();
    showScreen('learnmenu');
  });
  document.getElementById('btn-quiz-quit').addEventListener('click', () => {
    SFX.click();
    stopRace();
    showSubjectPicker();
  });

  window.initQuiz = () => {
    stopRace();
    showSubjectPicker();
    Speech.say('Quiz Racer! Answer the questions to make your car go faster!');
  };

  // test/debug hook: advance the race without waiting on animation frames
  window.QuizRacer = {
    start: startRace,
    step: (dt) => {
      if (!state || state.done) return null;
      state.speed += (BASE_SPEED - state.speed) * DRAG * dt;
      state.speed = Math.max(BASE_SPEED * 0.45, Math.min(MAX_SPEED, state.speed));
      state.dist += state.speed * dt * 0.55;
      state.rivalDist += state.rivalSpeed * dt * 0.55;
      if (state.dist >= TRACK_M || state.rivalDist >= TRACK_M) finish();
      return state;
    },
    get state() { return state; },
  };
})();
