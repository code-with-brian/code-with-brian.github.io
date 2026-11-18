/* Page shell: lesson routing, the bench, stats, camera, labels, log, quiz, sound. */
const App = (() => {
  const $ = (id) => document.getElementById(id);
  const figs = [];
  const OVERVIEW = [-385, -552, 1225, 860];
  const defaults = { power: 100, flow: 'full', steam: 'on', mod: 'on', rods: 'out', mca: 'out', adj: 'in', gd: 'off', grid: 'on', diesel: 'off', fm: 'off', drained: 'off', brk: 'off' };
  let fig = null, plant = { ...defaults }, view = [...OVERVIEW], target = [...OVERVIEW], last = 0, statClock = 0, opened = 0;
  let calloutEls = [], clockFn = null, audio = null, current = [], leaderKey = '', goalText = null, goalTag = null, goalAt = null, goalDone = false, muted = false, poked = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem('candu.done') || '{}'); } catch { return {}; } },
    set(v) { try { localStorage.setItem('candu.done', JSON.stringify(v)); } catch { /* private mode */ } },
  };

  function register(def) { figs.push(def); }

  function renderNav() {
    const done = store.get();
    let group = null, html = '', n = 0;
    figs.forEach((f) => {
      const t = TEXT[f.id];
      if (t.group !== group) { group = t.group; html += `<h3>${group}</h3>`; }
      html += `<a class="mo" href="#${f.id}" ${f === fig ? 'aria-current="page"' : ''}><small>${t.num}</small><b>${t.title}</b><i>${done[f.id] ? '✓' : ''}</i></a>`;
      if (done[f.id]) n++;
    });
    $('nav').innerHTML = html;
    const total = figs.filter((f) => TEXT[f.id].quiz).length;
    $('progress').textContent = `${n} of ${total} checks passed`;
  }

  function setPlant(patch) {
    Object.assign(plant, patch);
    const svg = $('unit');
    for (const k of Object.keys(defaults)) if (k !== 'power') svg.dataset[k] = plant[k];
    svg.dataset.turning = plant.power > 10 && plant.steam === 'on' && plant.grid === 'on' ? 'on' : 'off';
    svg.style.setProperty('--glow', Math.max(.08, Math.min(1, plant.power / 100)).toFixed(2));
    const key = current.filter((c) => c.when && plant[c.when[0]] === c.when[1]).map((c) => c.part).join();
    if (key !== leaderKey) callouts();   // rods have moved, so their leaders must follow
  }

  function focus(parts) {
    const svg = $('unit');
    svg.querySelectorAll('.lit').forEach((e) => e.classList.remove('lit'));
    if (!parts || !parts.length) { delete svg.dataset.focus; return; }
    svg.dataset.focus = '1';
    parts.forEach((p) => svg.querySelectorAll(`.part[data-part="${p}"]`).forEach((e) => e.classList.add('lit')));
  }

  const labelScale = (v) => {
    const box = $('unit'), px = box.clientWidth || 800, py = box.clientHeight || 560;
    // The drawing letterboxes inside the frame, so whichever side fits sets the scale.
    return Math.max(v[2] / px, v[3] / py) * (px < 500 ? .78 : 1);   // labels hold a constant size on screen
  };
  function callouts(list = current) {
    current = list;
    leaderKey = list.filter((c) => c.when && plant[c.when[0]] === c.when[1]).map((c) => c.part).join();
    const layer = $('callouts'), v = target, k = labelScale(v);
    layer.innerHTML = list.map((c) => {
      const [x, y0] = Iso.P(...c.at), w = c.text.length * 7.2 + 16;
      // A leader to a rod follows the rod; the pill itself stays put.
      const drop = c.when && plant[c.when[0]] === c.when[1] ? c.when[2] : 0, y = y0 + drop;
      // Keep every pill inside the frame the camera is heading to.
      const pad = 6 / 1, cl = (val, lo, hi) => Math.max(lo, Math.min(hi, val));
      const dx = cl(c.off[0], (v[0] - x) / k + w / 2 + pad, (v[0] + v[2] - x) / k - w / 2 - pad);
      const dy = cl(c.off[1] - drop / k, (v[1] - y) / k + 10 + pad, (v[1] + v[3] - y) / k - 10 - pad);
      return `<g class="callout ${c.tone || ''}" data-part="${c.part}" data-x="${Iso.f(x)}" data-y="${Iso.f(y)}"><path d="M0 0L${dx} ${dy}"/><rect x="${dx - w / 2}" y="${dy - 10}" width="${w}" height="20" rx="10"/><text x="${dx}" y="${dy}">${c.text}</text></g>`;
    }).join('');
    calloutEls = [...layer.children];
    placeCallouts();
  }
  function placeCallouts() {
    const k = labelScale(view);
    calloutEls.forEach((g) => g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${k.toFixed(3)})`));
  }
  function camera(v, instant) {
    target = v || OVERVIEW;
    $('scene').classList.toggle('zoomed', !!v);
    if (instant || reduced) { view = [...target]; applyView(); }
  }
  function applyView() {
    $('unit').setAttribute('viewBox', view.map((n) => n.toFixed(1)).join(' '));
    placeCallouts();
  }

  function inspect(id) {
    const p = PARTS[id];
    if (!p) return;
    $('inspect').innerHTML = `<h2>Selected part</h2><h3>${p.name}</h3><p>${p.text}</p>${p.fact ? `<p class="fact">${p.fact}</p>` : ''}`;
    define($('inspect'));
    if (fig && !fig.keepFocus) focus([id]);
    poked = true;
    $('scene-hint').hidden = true;
    $('peek').innerHTML = `<button type="button" id="peek-x" aria-label="Close">×</button><b>${p.name}</b><span>${p.text}</span>`;
    $('peek').hidden = false;
  }
  function clearInspect() {
    $('inspect').innerHTML = '<h2>Selected part</h2><p>Click or tap any part of the drawing to see what it does.</p>';
    $('peek').hidden = true;
    $('scene-hint').hidden = poked || fig?.id !== 'plant';   // only where it is known to clear the labels
  }

  function actions(list) {
    const box = $('bench');
    box.innerHTML = '';
    list.forEach((a) => {
      const b = document.createElement('button');
      b.className = 'act ' + (a.cls || '');
      b.type = 'button';
      b.textContent = a.label;
      b.disabled = !!a.disabled;
      b.addEventListener('click', () => {
        sound('click');
        $('peek').hidden = true;   // the drawing is about to change
        sawPress(a.label); a.run(b);
      });
      box.appendChild(b);
    });
    cue();
  }
  const note = (t) => {
    const el = $('note');
    el.textContent = t || ''; define(el);
    if (t && !muted) { el.classList.remove('fresh'); void el.offsetWidth; el.classList.add('fresh'); }   // the explanation changed, so show that it did
  };

  /* ---------- The guided path ---------- */
  const later = (fn) => setTimeout(fn, 0);   // after the control has finished redrawing
  let tourAt = -1, driving = false;
  const tour = () => GUIDE[fig.id] || {};
  const tourSteps = () => tour().steps || [];

  function pressButton(label) {
    const b = [...$('bench').querySelectorAll('button')].find((x) => x.textContent === label && !x.disabled);
    if (!b) return;
    driving = true; b.click(); driving = false;
  }
  function cue() {
    const buttons = [...$('bench').querySelectorAll('button')];
    // The highlight marks the control for the step the guide is describing, so the two always match.
    // Before the tour begins, the highlight points at the control that starts it.
    const step = fig ? tourSteps()[Math.max(tourAt, 0)] : null;
    const want = step && !step.point ? [step.press, step.then] : [];
    buttons.forEach((b) => {
      b.classList.toggle('cue', want.includes(b.textContent));
      b.classList.toggle('twin', tourAt >= 0 && b.textContent === 'Next step');   // the guide's Next does this job
    });
    $('bench').parentElement.classList.toggle('has-cue', buttons.some((b) => b.classList.contains('cue') && !b.classList.contains('twin')));
  }
  // Pressing the next step's control yourself counts the same as pressing Next.
  function sawPress(label) {
    const coming = tourSteps()[tourAt + 1];
    // A step that needs a reset first says what comes after it.
    if (!driving && coming?.first === label) { later(() => { note(`Now press ${coming.press}.`); cue(); }); return; }
    if (driving || coming?.press !== label) return;
    tourAt++; note(''); renderGuide();
  }
  function advance() {
    const steps = tourSteps();
    tourAt = Math.min(tourAt + 1, steps.length);
    note('');
    const s = steps[tourAt];
    if (s?.first) pressButton(s.first);
    if (s?.press) pressButton(s.press);
    if (s?.say) note(s.say);
    if (tourAt === steps.length && tour().end) pressButton(tour().end);
    renderGuide();
  }
  function back() {
    const to = tourAt - 1;
    muted = true;
    go(fig.id);
    for (let i = 0; i <= to; i++) advance();
    muted = false;
  }
  const dots = (at, n) => `<span class="dots" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? 'done' : i === at ? 'now' : ''}"></i>`).join('')}</span>`;
  const setStep = (label, at, n) => { $('guide-step').innerHTML = `<span>${label}</span>${n ? dots(at, n) : ''}`; };
  function renderGuide() {
    const steps = tourSteps(), n = steps.length, goal = $('guide-goal'), next = $('guide-next');
    const after = figs[figs.indexOf(fig) + 1];
    const nextLesson = () => (after ? `<a class="act on" href="#${after.id}">Next: ${TEXT[after.id].title}</a>` : '');
    const backBtn = (id) => `<button type="button" class="act quiet" id="${id}">Back</button>`;
    if (!n) {
      setStep(goalTag || 'Your job', ...(goalAt || []));
      goal.textContent = goalText || tour().goal || '';
      next.innerHTML = goalDone || goalTag === 'Result' ? nextLesson() : '';
    } else if (tourAt < 0) {
      // No Start button: pressing the highlighted control is the first step.
      setStep(`Step 1 of ${n}`, 0, n);
      goal.textContent = `${steps[0].t}. Press \u201c${steps[0].press}\u201d to begin.`;
      next.innerHTML = '';
    } else if (tourAt < n) {
      setStep(`Step ${tourAt + 1} of ${n}`, tourAt, n);
      goal.textContent = steps[tourAt].t;
      next.innerHTML = `${backBtn('guide-back')} <button type="button" class="act on" id="guide-go">${tourAt === n - 1 ? 'Finish' : 'Next'}</button>`;
    } else {
      setStep('Key idea', n, n);
      goal.textContent = tour().key;
      next.innerHTML = `${backBtn('guide-back')} ${nextLesson()}`;
    }
    $('guide-go')?.addEventListener('click', advance);
    $('guide-back')?.addEventListener('click', back);
    document.querySelectorAll('.pointed').forEach((e) => e.classList.remove('pointed'));
    const point = tourAt >= 0 && steps[tourAt]?.point;
    if (point) document.querySelector(point)?.classList.add('pointed');
    define(goal);
    cue();
    compact(n);
  }
  // On a phone a running tour keeps the drawing, the words and Next on one screen.
  function compact(n) {
    const stepping = tourAt >= 0 && tourAt < n;
    document.body.classList.toggle('touring', stepping);
    if (stepping && innerWidth <= 980 && scrollY > 0) window.scrollTo(0, 0);
  }

  /* ---------- Plain-language definitions ---------- */
  const termRe = new RegExp(`(?<![\\w%-])(${GLOSSARY.map((g) => g[0]).join('|')})(?![\\w-])`, 'gi');
  const termDef = (word) => GLOSSARY.find((g) => new RegExp(`^(?:${g[0]})$`, 'i').test(word));
  function define(root) {
    const seen = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('a,button,h2,h3')) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.nodeValue, frag = document.createDocumentFragment();
      let at = 0, hit = false;
      for (const m of text.matchAll(termRe)) {
        const def = termDef(m[0]);
        if (!def || seen.has(def[0])) continue;
        seen.add(def[0]); hit = true;
        frag.append(text.slice(at, m.index));
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'term'; b.textContent = m[0]; b.dataset.def = def[1];
        frag.append(b);
        at = m.index + m[0].length;
      }
      if (!hit) return;
      frag.append(text.slice(at));
      node.replaceWith(frag);
    });
  }
  function showTerm(b) {
    const pop = $('term-pop'), r = b.getBoundingClientRect();
    pop.textContent = b.dataset.def;
    pop.hidden = false;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left))}px`;
    pop.style.top = `${r.bottom + h + 12 > innerHeight ? r.top - h - 8 : r.bottom + 8}px`;
  }
  const hideTerm = () => { $('term-pop').hidden = true; };

  const benchLabel = (t) => { $('bench-label').textContent = t; };
  const panel = (html) => { $('panel').innerHTML = html || ''; return $('panel'); };
  const goal = (t, tag, at, n, done) => { goalText = t; goalTag = tag; goalAt = n ? [at, n] : null; goalDone = !!done; renderGuide(); };
  const labels = (list) => callouts(list || fig.callouts || []);
  // Bring something into view without a jump.
  const reveal = (id) => $(id).scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });

  function stats(rows) {
    $('stats').innerHTML = rows.map((r) => `<div><dt>${r[0]}</dt><dd class="${r[2] || ''}">${r[1]}</dd></div>`).join('');
  }

  function log(msg, cls = '') {
    const t = clockFn ? clockFn() : stamp((performance.now() - opened) / 1000);
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = `<time>${t}</time>${msg}`;
    const box = $('log');
    box.appendChild(li);
    box.scrollTop = box.scrollHeight;
  }
  const stamp = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function flash() {
    const f = $('flash');
    if (muted) return;
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }

  /* Short synthesised effects, off until the viewer turns sound on. */
  function sound(name) {
    if (muted || !$('sound').checked) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const tone = (freq, dur, type = 'square', vol = .05, at = 0) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
        o.connect(g).connect(audio.destination); o.start(t + at); o.stop(t + at + dur);
      };
      if (name === 'click') tone(1400, .03, 'square', .02);
      if (name === 'alarm') [0, .3, .6].forEach((a) => { tone(880, .22, 'square', .05, a); tone(660, .08, 'square', .04, a + .22); });
      if (name === 'drop') { tone(90, .5, 'sawtooth', .12); tone(60, .9, 'sine', .14, .1); }
      if (name === 'good') [0, .12, .24].forEach((a, i) => tone(520 + i * 140, .16, 'triangle', .07, a));
      if (name === 'bad') tone(170, .7, 'sawtooth', .07);
    } catch { /* audio is optional */ }
  }

  function renderQuiz() {
    const t = TEXT[fig.id], el = $('quiz');
    if (!t.quiz) { el.innerHTML = nextLink(); return; }
    const answered = new Set();
    el.innerHTML = `<h2>Check yourself</h2>` + t.quiz.map((q, i) => `<div class="q" data-i="${i}"><p>${i + 1}. ${q.q}</p><div class="q-opts">${q.o.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join('')}</div><small hidden></small></div>`).join('') +
      `<p class="task"><strong>Try it.</strong> ${t.task}</p>` + nextLink();
    el.querySelectorAll('.q').forEach((box) => {
      const q = t.quiz[+box.dataset.i], why = box.querySelector('small');
      box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const right = +b.dataset.j === q.a;
        b.classList.add(right ? 'right' : 'wrong');
        why.hidden = false;
        why.textContent = (right ? 'Correct. ' : 'Not quite. ') + q.why;
        if (right) answered.add(box.dataset.i);
        if (answered.size === t.quiz.length) {
          const d = store.get(); d[fig.id] = 1; store.set(d); renderNav(); sound('good');
        }
      }));
    });
  }
  function nextLink() {
    const i = figs.indexOf(fig), n = figs[i + 1];
    return n ? `<a class="act on next" href="#${n.id}">Next: ${TEXT[n.id].title}</a>` : '<p class="task">That is every lesson. Go back to the trip drill and try the other causes, or read the sources below and check the numbers yourself.</p>';
  }

  function go(id) {
    if (id === 'quick') {   // old links to the retired 2-minute tour open the first lesson
      id = figs[0].id;
      try { history.replaceState(null, '', `#${id}`); } catch { /* the hash can stay */ }
    }
    const next = figs.find((f) => f.id === id) || figs[0];
    if (fig && fig.leave) fig.leave();
    fig = next;
    const t = TEXT[fig.id];
    clockFn = null;
    opened = performance.now();
    document.title = 'How a CANDU Works';
    $('fig-title').textContent = `${t.num} · ${t.title}`;
    $('fig-sub').textContent = t.sub;
    $('text').innerHTML = `<h2>What is going on</h2>` + t.text.map((p) => `<p>${p}</p>`).join('');
    define($('text'));
    tourAt = -1; goalText = goalTag = goalAt = null; goalDone = false; hideTerm();
    $('log').innerHTML = '';
    plant = { ...defaults };
    setPlant({});
    focus(null); note(''); panel(''); clearInspect(); benchLabel('Controls');
    const useDetail = fig.scene === 'detail';
    // .hidden is an HTML property, so SVG elements need the attribute itself.
    $('unit').toggleAttribute('hidden', useDetail);
    $('detail').toggleAttribute('hidden', !useDetail);
    $('toy').hidden = true;
    $('stage').classList.toggle('panel-first', !!fig.panelFirst);
    $('scene').classList.toggle('reactor-only', !!fig.reactorOnly);
    $('scene').classList.toggle('trim', !!fig.trim);
    $('stage').style.setProperty('--reserve', fig.reserve ? `${fig.reserve}px` : '34vh');
    camera(fig.view, !last);
    callouts(fig.callouts);
    actions([]);
    fig.enter && fig.enter();
    if (fig.stats) stats(fig.stats()); else stats([]);
    renderNav();
    renderQuiz();
    renderGuide();
    log(t.opening || 'Unit at full power, all systems normal.');
    if (innerWidth <= 980) $('nav').querySelector('[aria-current]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    window.scrollTo(0, 0);
  }

  function frame(now) {
    const dt = Math.min(.1, (now - (last || now)) / 1000);
    last = now;
    let moved = false;
    view = view.map((v, i) => {
      const d = target[i] - v;
      if (Math.abs(d) < .05) return target[i];
      moved = true;
      return v + d * Math.min(1, dt * 5);
    });
    if (moved) applyView();
    if (fig && fig.tick) fig.tick(dt);
    statClock += dt;
    if (statClock > .12 && fig && fig.stats) { statClock = 0; stats(fig.stats()); }
    requestAnimationFrame(frame);
  }

  function start() {
    addEventListener('resize', () => callouts());
    try { history.scrollRestoration = 'manual'; } catch { /* older browsers */ }
    const d = PlantScene.draw();
    const svg = $('unit');
    svg.innerHTML = `<defs><filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="0"/></filter>${d.defs}</defs><g id="art">${d.body}</g><g id="callouts"></g>`;
    applyView();
    svg.addEventListener('click', (e) => {
      const p = e.target.closest('[data-part]');
      if (p) { sound('click'); inspect(p.dataset.part); }
    });
    $('detail').addEventListener('click', (e) => {
      const p = e.target.closest('[data-part]');
      if (p) inspect(p.dataset.part);
    });
    $('wobble').addEventListener('input', (e) => {
      const v = +e.target.value;
      svg.querySelector('feDisplacementMap').setAttribute('scale', v);
      svg.querySelector('#art').style.filter = v ? 'url(#ink)' : '';
    });
    $('labels').addEventListener('change', (e) => svg.classList.toggle('nolabels', !e.target.checked));
    document.addEventListener('click', (e) => { const b = e.target.closest('.term'); if (b) showTerm(b); else hideTerm(); });
    document.addEventListener('mouseover', (e) => { const b = e.target.closest?.('.term'); if (b) showTerm(b); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest?.('.term')) hideTerm(); });
    document.addEventListener('focusin', (e) => { if (e.target.closest?.('.term')) showTerm(e.target); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { hideTerm(); $('peek').hidden = true; }
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select')) return;
      // Arrow keys step through whichever tour is running.
      if (e.key === 'ArrowRight') $('guide-go')?.click();
      if (e.key === 'ArrowLeft') $('guide-back')?.click();
    });
    $('peek').addEventListener('click', (e) => { if (e.target.id === 'peek-x') { $('peek').hidden = true; focus(null); } });
    addEventListener('scroll', hideTerm, { passive: true });
    $('sources').innerHTML = SOURCES_HTML;
    $('foot').innerHTML = FOOT_HTML;
    addEventListener('hashchange', () => go(location.hash.slice(1)));
    go(location.hash.slice(1));
    requestAnimationFrame(frame);
  }

  return { $, register, start, go, set: setPlant, get plant() { return plant; }, focus, inspect, actions, note, goal, labels, reveal, benchLabel, panel, stats, log, stamp, flash, sound, camera, OVERVIEW,
    setClock(fn) { clockFn = fn; }, reset() { setPlant({ ...defaults }); }, get reduced() { return reduced; } };
})();
