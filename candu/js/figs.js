/* Lessons 00 to 04: the machine and its controls. */
(() => {
  const R = App;
  const callout = (part, at, off, text, tone) => ({ part, at, off, text, tone });
  const REACTOR_VIEW = [-300, -362, 660, 462];
  const later = (() => { let ids = []; return { set(fn, ms) { ids.push(setTimeout(fn, ms)); }, clear() { ids.forEach(clearTimeout); ids = []; } }; })();

  /* ---------- Fig 00, the whole plant ---------- */
  const trace = [
    { p: ['fuel-channel', 'calandria'], t: 'Fission heats the fuel in 380 channels inside the calandria.',
      c: [callout('calandria', [0, -2, 14], [-112, -40], 'CALANDRIA', 'cool'), callout('fuel-channel', [5.5, 1, 7], [110, 50], '380 FUEL CHANNELS', 'gold')] },
    { p: ['feeders', 'roh', 'hot-leg'], t: 'Heavy water carries that heat out through the feeders at 310 °C.',
      c: [callout('feeders', [7, 2, 14], [-170, 60], 'FEEDERS', 'warm'), callout('roh', [7.6, 4, 17.4], [120, 60], 'OUTLET HEADERS', 'warm'), callout('hot-leg', [11, 3.5, 19.4], [150, -30], 'HOT LEG 310 °C', 'warm')] },
    { p: ['steam-generator'], t: 'In four steam generators it boils ordinary water. The two waters never touch.',
      c: [callout('steam-generator', [14.6, -6.5, 28], [46, -44], 'STEAM GENERATORS')] },
    { p: ['steam-line'], t: 'Steam leaves the reactor building for the turbine.',
      c: [callout('steam-line', [27, -16.5, 22], [76, -20], 'MAIN STEAM')] },
    { p: ['turbine', 'generator', 'switchyard'], t: 'The turbine spins the generator, and 728 MW leaves for the grid.',
      c: [callout('turbine', [32, -16.5, 9], [10, -60], 'TURBINE'), callout('generator', [41, -16.5, 8.6], [60, -36], 'GENERATOR', 'warm'), callout('switchyard', [41, -27, 3], [40, 70], 'SWITCHYARD')] },
    { p: ['condenser', 'feedwater'], t: 'Spent steam condenses and is pumped back to the steam generators.',
      c: [callout('condenser', [33, -19, 2], [40, 90], 'CONDENSER'), callout('feedwater', [21.5, -9.5, 14], [84, -30], 'FEEDWATER', 'cool')] },
    { p: ['pump', 'cold-leg', 'rih'], t: 'Cooled heavy water returns through the pumps at about 266 °C, and round it goes.',
      c: [callout('pump', [17.6, 3.5, 18], [90, 40], 'PUMPS', 'gold'), callout('rih', [8.8, 5, 17.4], [-170, 60], 'INLET HEADERS 266 °C', 'cool')] },
  ];
  R.register({
    id: 'plant', keepFocus: false,
    callouts: [
      callout('calandria', [0, -2, 14], [-112, -40], 'CALANDRIA', 'cool'),
      callout('steam-generator', [14.6, -6.5, 28], [46, -44], 'STEAM GENERATORS'),
      callout('dousing', [-3, -8, 33.6], [-150, -18], 'DOUSING TANK'),
      callout('fuelling-machine', [8, 7, 10], [-110, 22], 'FUELLING MACHINE', 'gold'),
      callout('turbine', [32, -16.5, 9], [10, -60], 'TURBINE'),
      callout('generator', [41, -16.5, 8.6], [60, -36], 'GENERATOR', 'warm'),
      callout('fuel-bay', [0, 27, 2], [-34, 56], 'FUEL BAY', 'cool'),
      callout('diesels', [19, 20.6, 2.2], [78, 36], 'STANDBY GENERATORS', 'gold'),
    ],
    enter() {
      let step = -1;
      const draw = () => R.actions([
        { label: step < 0 ? 'Follow the heat' : step === trace.length - 1 ? 'Back to the start' : 'Next step', run() { step = step === trace.length - 1 ? -1 : step + 1; R.labels(step < 0 ? null : trace[step].c); if (step < 0) { R.focus(null); R.note(''); } else { R.focus(trace[step].p); R.note(trace[step].t); R.log(trace[step].t); } draw(); } },
      ]);
      draw();
    },
    stats: () => [['Heat', '2,064<small>MW</small>'], ['Electric', '728<small>MWe</small>'], ['Channels', '380']],
  });

  /* ---------- Fig 01, fuel ---------- */
  const stages = [
    ['Stack the pellets', 'pellets', 'Natural uranium dioxide, pressed and baked into hard ceramic pellets.', [0, -60], '150 50 530 373'],
    ['Seal an element', 'element', 'Pellets go into a thin Zircaloy tube, sealed at both ends. That sheath holds the fission products in.', [-70, 0]],
    ['Build a bundle', 'bundle', 'Rings of 1, 6, 12 and 18 elements make the 37-element bundle.', [-90, -14]],
    ['Load a channel', 'channel', 'Twelve bundles sit end to end in one pressure tube. The new ones here are the gold ones.', [-130, 0]],
    ['Cut a cross-section', 'section', 'From the middle out: fuel, hot coolant, pressure tube, gas gap, calandria tube, then cool moderator.', [0, 0]],
  ];
  // Pieces arrive one after another, so each stage reads as being built.
  function assemble(svg, [dx, dy]) {
    if (R.reduced) return;
    const pieces = [...svg.querySelectorAll('.part')].filter((e) => !e.closest('.callout'));
    pieces.forEach((e, i) => {
      e.classList.add('build');
      e.style.setProperty('--dx', `${dx}px`);
      e.style.setProperty('--dy', `${dy}px`);
      e.style.setProperty('--d', `${(i / pieces.length * .85).toFixed(3)}s`);
    });
  }
  let toyRun = null;
  function stopToy() { if (toyRun) cancelAnimationFrame(toyRun); toyRun = null; R.$('toy').hidden = true; }

  function neutronTest(water) {
    stopToy();
    const cv = R.$('toy'), box = R.$('scene').getBoundingClientRect();
    cv.hidden = false;
    const ratio = Math.min(2, devicePixelRatio || 1);
    cv.width = box.width * ratio; cv.height = box.height * ratio;
    const g = cv.getContext('2d'), W = box.width, H = box.height;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    const heavy = water === 'heavy';
    const rods = [];
    const stepX = W / 7, stepY = H / 5;
    for (let x = 1; x < 7; x++) for (let y = 1; y < 5; y++) rods.push([x * stepX, y * stepY]);
    const FAST = 6.5, SLOW = 3;
    const spawn = (x, y) => { const a = Math.random() * 6.28; return { x, y, vx: Math.cos(a) * FAST, vy: Math.sin(a) * FAST, fast: true, hits: 0 }; };
    let ns = rods.filter((_, i) => i % 3 === 0).map(([x, y]) => spawn(x, y)), fissions = 0, lost = 0, frames = 0, banner = '';
    const marks = [];   // fading rings for fissions and crosses for absorptions
    const plural = (n) => `${n} fission${n === 1 ? '' : 's'}`;
    const absorbPerStep = heavy ? .0003 : .01, hitsToSlow = heavy ? 6 : 2, capture = heavy ? .42 : .62;
    const loop = () => {
      frames++;
      g.fillStyle = heavy ? '#a9d8d6' : '#cfe0f4'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5c5f58'; g.strokeStyle = '#1b2127'; g.lineWidth = 1.5;
      rods.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.stroke(); });
      const born = [];
      ns = ns.filter((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)); }
        if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)); }
        if (Math.random() < .06) {
          const a = Math.random() * 6.28, sp = n.fast ? FAST : SLOW;
          n.vx = Math.cos(a) * sp; n.vy = Math.sin(a) * sp;
          if (n.fast && ++n.hits >= hitsToSlow) { n.fast = false; n.vx *= SLOW / FAST; n.vy *= SLOW / FAST; }
        }
        // A light-water run always gets a couple of fissions, so it fails the way it really fails: too few, not none.
        if (fissions >= 2 && Math.random() < absorbPerStep) { lost++; marks.push({ x: n.x, y: n.y, age: 0, kind: 'lost' }); return false; }
        if (!n.fast) for (const [x, y] of rods) {
          if ((n.x - x) ** 2 + (n.y - y) ** 2 < 420) {
            if (fissions >= 2 && Math.random() < capture) { lost++; marks.push({ x: n.x, y: n.y, age: 0, kind: 'lost' }); return false; }
            fissions++;
            marks.push({ x, y, age: 0, kind: 'fission' });
            const kids = Math.random() < .5 ? 2 : 3;
            for (let i = 0; i < kids; i++) born.push(spawn(x, y));
            return false;
          }
        }
        return true;
      });
      ns = ns.concat(born).slice(0, 110);
      marks.forEach((m) => {
        m.age++;
        const t = m.age / 34;
        g.globalAlpha = Math.max(0, 1 - t);
        if (m.kind === 'fission') {
          g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(m.x, m.y, 15, 0, 7); g.fill();
          g.strokeStyle = '#e9a020'; g.lineWidth = 3; g.beginPath(); g.arc(m.x, m.y, 15 + t * 26, 0, 7); g.stroke();
        } else {
          g.strokeStyle = '#1b2127'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(m.x - 6, m.y - 6); g.lineTo(m.x + 6, m.y + 6); g.moveTo(m.x + 6, m.y - 6); g.lineTo(m.x - 6, m.y + 6); g.stroke();
        }
        g.globalAlpha = 1;
      });
      for (let i = marks.length - 1; i >= 0; i--) if (marks[i].age > 34) marks.splice(i, 1);
      ns.forEach((n) => { g.fillStyle = n.fast ? '#e0573c' : '#1d4fc4'; g.beginPath(); g.arc(n.x, n.y, n.fast ? 5 : 6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); });
      g.fillStyle = '#1b2127'; g.font = '700 13px ui-monospace, Menlo, monospace';
      const small = W < 520;
      g.fillText(small ? `${heavy ? 'HEAVY' : 'LIGHT'}: ${ns.length} alive, ${fissions} fissions, ${lost} lost` : `${heavy ? 'HEAVY' : 'LIGHT'} WATER · alive ${ns.length} · fissions ${fissions} · absorbed ${lost}`, 12, 22);
      g.font = '12px ui-monospace, Menlo, monospace';
      g.fillText(small ? 'Red fast, blue slowed, grey fuel. Not to scale.' : 'red = fast neutron, blue = slowed neutron, grey = natural uranium fuel. Cartoon, not to scale.', 12, H - 12);
      if (banner) {
        g.font = `800 ${small ? 24 : 34}px "Big Shoulders Stencil", Impact, sans-serif`;
        const tw = g.measureText(banner).width + 36;
        g.fillStyle = '#1b2127'; g.fillRect((W - tw) / 2, H / 2 - 32, tw, 58);
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(banner, W / 2, H / 2 + (small ? 6 : 10)); g.textAlign = 'left';
      }
      if (ns.length === 0 && !banner) {
        const m = `Chain reaction died after ${plural(fissions)}. Light water absorbs too many neutrons for natural uranium.`;
        banner = 'Chain reaction died';
        R.note(m); R.log(m, 'warn');
      } else if (banner && ns.length === 0 && !marks.length) { toyRun = null; return; }
      if (frames === 900 && heavy) { const m = `Still going after ${plural(fissions)}. Heavy water lets natural uranium sustain a chain reaction.`; banner = 'Still going'; R.note(m); R.log(m, 'good'); }
      if (frames > 1500) { toyRun = null; return; }
      toyRun = requestAnimationFrame(loop);
    };
    R.note(heavy ? 'Heavy water: neutrons take longer to slow down, but almost none are absorbed.' : 'Light water: neutrons slow quickly, but many are absorbed before they find a fissile atom.');
    if (R.reduced) { frames = 1400; }
    loop();
  }

  R.register({
    id: 'fuel', scene: 'detail', reserve: 240, leave: stopToy,
    enter() {
      const show = (i) => {
        stopToy();
        const svg = R.$('detail');
        svg.setAttribute('viewBox', stages[i][4] || `0 0 ${Detail.W} ${Detail.H}`);
        svg.innerHTML = Detail[stages[i][1]]();
        assemble(svg, stages[i][3]);
        R.note(stages[i][2]); R.log(stages[i][2]);
      };
      const draw = (i) => R.actions([
        ...stages.map((s, k) => ({ label: s[0], cls: k === i ? 'on' : '', run() { show(k); draw(k); } })),
        { label: 'Neutron test: light water', run() { draw(-1); neutronTest('light'); } },
        { label: 'Neutron test: heavy water', run() { draw(-1); neutronTest('heavy'); } },
      ]);
      show(0); draw(0);
    },
    stats: () => [['Elements', '37'], ['Bundle', '23.5<small>kg</small>'], ['U-235', '&lt;1<small>%</small>']],
  });

  /* ---------- Fig 02, core face and refuelling ---------- */
  const burnColor = (b) => {
    const a = [248, 233, 196], z = [109, 63, 13];
    return `rgb(${a.map((v, i) => Math.round(v + (z[i] - v) * Math.min(1, b))).join(',')})`;
  };
  R.register({
    id: 'core', scene: 'detail', reserve: 350, panelFirst: true,
    leave() { later.clear(); R.$('detail').removeEventListener('click', this.onClick); },
    enter() {
      const cells = Sim.lattice();
      const seed = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
      const st = { day: 0, zones: 52, fuelled: 0, today: 0, sel: null, mode: 'burn', busy: false, burn: cells.map((_, i) => .25 + seed(i) * .7) };
      this.st = st;
      const svg = R.$('detail');
      svg.setAttribute('viewBox', `0 0 ${Detail.W} ${Detail.H}`);
      svg.innerHTML = Detail.core();
      const rects = [...svg.querySelectorAll('.chan')];
      const paint = () => rects.forEach((r, i) => {
        const k = cells[i];
        r.style.fill = st.mode === 'flow' ? (((k.col + k.row) & 1) ? '#e0573c' : '#3f7fd9') : burnColor(st.burn[i]);
      });
      const legend = () => {
        svg.querySelector('#legend-flow').setAttribute('display', st.mode === 'flow' ? 'inline' : 'none');
        svg.querySelector('#legend-burn').setAttribute('display', st.mode === 'flow' ? 'none' : 'inline');
      };
      const sideBundles = () => {
        const i = st.sel;
        svg.querySelector('#side-title').textContent = i === null ? 'CHANNEL: PICK ONE' : `CHANNEL ${String.fromCharCode(65 + cells[i].row + 11)}${cells[i].col + 12}`;
        const b = i === null ? 0 : st.burn[i];
        svg.querySelectorAll('.bun').forEach((e, n) => { e.style.fill = i === null ? '#dfe3da' : burnColor(b * (.45 + .55 * Math.sin(((n + .5) / 12) * Math.PI))); });
        svg.querySelector('#side-note').textContent = i === null ? 'Darker means higher burnup' : `Burnup ${Math.round(b * 100)}% of target`;
      };
      const panelDraw = () => {
        const z = Math.max(0, Math.min(100, st.zones));
        R.panel(`<div class="gauge"><div class="meter-row"><span>Average liquid zone level (teaching values)</span><b>${Math.round(z)}%</b></div><div class="gauge-track"><div class="gauge-band" style="left:30%;width:40%"></div><div class="gauge-fill" style="width:${z}%"></div></div></div>
          <p style="font-size:12.5px">Refuelled ${st.fuelled} ${st.fuelled === 1 ? 'channel' : 'channels'}, ${st.day ? (st.fuelled / st.day).toFixed(1) : '0'} per day. A CANDU 6 averages about 2.</p>`);
      };
      const refuel = () => {
        if (st.sel === null || st.busy) return;
        st.busy = true;
        const i = st.sel, odd = (cells[i].col + cells[i].row) & 1;
        const gain = st.burn[i];
        R.set({ fm: 'on' });
        R.log(`Machines clamp onto channel ${String.fromCharCode(65 + cells[i].row + 11)}${cells[i].col + 12}. Shifting 8 bundles with flow.`);
        const g = svg.querySelector('#side-bundles');
        g.style.transform = `translateX(${(odd ? -1 : 1) * 168}px)`;
        later.set(() => {
          g.style.transition = 'none'; g.style.transform = 'none';
          st.burn[i] = st.burn[i] * .28; st.zones += 4.6 * gain; st.fuelled++; st.today++;
          paint(); sideBundles(); panelDraw();
          void g.getBoundingClientRect(); g.style.transition = '';
          st.busy = false;
          R.note(gain > .75 ? 'Good pick. A high-burnup channel gives back the most reactivity.' : 'That channel still had life in it, so the zones barely moved.');
        }, R.reduced ? 20 : 1550);
      };
      const nextDay = () => {
        st.day++; st.today = 0;
        st.burn = st.burn.map((b, i) => Math.min(1, b + .012 + seed(i + 7) * .012));
        st.zones -= 8.5;
        paint(); sideBundles(); panelDraw();
        if (st.zones < 30) { R.note('Zones are low. The core needs fresh fuel, so refuel the darkest channels.'); R.log(`Day ${st.day}: zones at ${Math.round(st.zones)}%, below the band.`, 'warn'); }
        else if (st.zones > 70) { R.note('Zones are high. You are fuelling faster than the core needs.'); R.log(`Day ${st.day}: zones at ${Math.round(st.zones)}%, above the band.`, 'warn'); }
        else { R.note(`Day ${st.day}. Zones are in the band.`); R.log(`Day ${st.day}: core balanced.`); }
      };
      svg.addEventListener('click', this.onClick = (e) => {
        const r = e.target.closest('.chan');
        if (!r) return;
        svg.querySelector('.chan.sel')?.classList.remove('sel');
        st.sel = +r.dataset.i; r.classList.add('sel');
        sideBundles();
      });
      const draw = () => R.actions([
        { label: 'Pick the highest burnup', run() {
          const i = st.burn.indexOf(Math.max(...st.burn));
          svg.querySelector('.chan.sel')?.classList.remove('sel');
          rects[i].classList.add('sel'); st.sel = i; sideBundles();
          R.note('The darkest channel has burned the longest, so it gives back the most when refuelled.');
        } },
        { label: 'Refuel selected channel', run: refuel },
        { label: 'Run one day', run: nextDay },
        { label: st.mode === 'flow' ? 'Show burnup map' : 'Show flow direction', run() { st.mode = st.mode === 'flow' ? 'burn' : 'flow'; paint(); legend(); R.note(st.mode === 'flow' ? 'Red flows toward you, blue flows away. Neighbouring channels always run opposite ways.' : ''); draw(); } },
        { label: 'Show the two loops', run() {
          const on = svg.querySelector('#split').getAttribute('opacity') === '0';
          svg.querySelector('#split').setAttribute('opacity', on ? 1 : 0);
          svg.querySelector('#loop-tags').setAttribute('opacity', on ? 1 : 0);
          rects.forEach((r, i) => { r.style.opacity = on && r.getBBox().x >= 262 ? .5 : 1; });
          R.note(on ? 'Each heat transport loop serves exactly half the core, 190 channels.' : '');
        } },
      ]);
      paint(); sideBundles(); panelDraw(); draw();
      R.note('Click any channel, then refuel it. Darker channels have burned longer.');
    },
    stats() {
      const s = this.st || { day: 0, fuelled: 0 };
      return [['Day', s.day], ['Bundles', '4,560'], ['Refuelled', s.fuelled]];
    },
  });

  /* ---------- Fig 03, heat transport ---------- */
  const heatTrace = [
    { p: ['roh', 'feeders'], t: 'Outlet headers collect 310 °C coolant from half the channels on this end.', c: [callout('roh', [7.6, 4, 17.4], [120, 40], 'OUTLET HEADERS 310 °C', 'warm'), callout('feeders', [7, 2, 14], [-170, 60], 'FEEDERS', 'warm')] },
    { p: ['hot-leg', 'steam-generator'], t: 'It rises into a steam generator and gives up its heat through thousands of tubes.', c: [callout('steam-generator', [14.6, 3.5, 24], [110, -30], 'STEAM GENERATOR'), callout('hot-leg', [11, 3.5, 19.4], [120, 60], 'HOT LEG', 'warm')] },
    { p: ['cold-leg', 'pump'], t: 'Cooled to about 266 °C, it drops to a pump.', c: [callout('pump', [17.6, 3.5, 18], [90, 40], 'PUMP', 'gold'), callout('cold-leg', [14.6, -6.5, 16.8], [110, 10], 'COLD LEG 266 °C', 'cool')] },
    { p: ['rih', 'feeders', 'fuel-channel'], t: 'The pump sends it through the inlet header and back across the core, the opposite way.', c: [callout('rih', [8.8, 5, 17.4], [120, 40], 'INLET HEADERS', 'cool')] },
    { p: ['moderator-hx', 'calandria'], t: 'The moderator stays apart from all of this, on its own cooling loop at about 70 °C.', c: [callout('moderator-hx', [-15, -3, 3], [-90, -20], 'MODERATOR COOLING', 'cool'), callout('calandria', [0, 3, 6], [-120, 70], 'MODERATOR 70 °C', 'cool')] },
  ];
  R.register({
    id: 'heat', view: [-360, -480, 780, 520], reactorOnly: true, reserve: 320, panelFirst: true,
    callouts: [
      callout('roh', [7.6, -5, 17.4], [80, 50], 'OUTLET HEADER 310 °C', 'warm'),
      callout('rih', [8.8, 5, 17.4], [-140, 40], 'INLET HEADER 266 °C', 'cool'),
      callout('steam-generator', [14.6, -6.5, 29], [70, -22], 'STEAM 4.7 MPa'),
      callout('pump', [17.6, 3.5, 18], [120, 40], 'PUMP', 'gold'),
      callout('pressurizer', [2, -16, 24], [-30, -30], 'PRESSURIZER'),
      callout('moderator-hx', [-15, -3, 3], [-90, -20], 'MODERATOR COOLING', 'cool'),
    ],
    enter() {
      this.p = 100;
      let step = -1;
      const draw = () => R.actions([
        { label: step === heatTrace.length - 1 ? 'Clear the trace' : step < 0 ? 'Trace one loop' : 'Next step', run() { step = step === heatTrace.length - 1 ? -1 : step + 1; R.labels(step < 0 ? null : heatTrace[step].c); if (step < 0) { R.focus(null); R.note(''); } else { R.focus(heatTrace[step].p); R.note(heatTrace[step].t); } draw(); } },
        { label: 'Open Fig. 02 flow view', run() { location.hash = 'core'; } },
      ]);
      draw();
      const pan = R.panel(`<label class="power" for="pw"><span>Reactor power</span><input id="pw" type="range" min="10" max="100" step="5" value="100"><b id="pwv">100 %FP</b></label>`);
      pan.querySelector('#pw').addEventListener('input', (e) => {
        this.p = +e.target.value;
        pan.querySelector('#pwv').textContent = `${this.p} %FP`;
        R.set({ power: this.p });
      });
    },
    stats() {
      const p = (this.p ?? 100) / 100;
      return [['Outlet', `${Math.round(266 + 44 * Math.min(1, .35 + p * .65))}<small>°C</small>`], ['Pressure', '9.9<small>MPa</small>'], ['Electric', `${Math.round(728 * p)}<small>MWe</small>`]];
    },
  });

  /* ---------- Fig 04, control and shutdown ---------- */
  const CONTROL_LABELS = [
    { ...callout('sds1', [-3, -4.5, 18.8], [-120, -44], 'SDS1: 28 RODS'), when: ['rods', 'in', 96] },
    callout('sds2', [-1, -10.4, 18.6], [60, -56], 'SDS2: GADOLINIUM', 'gold'),
    { ...callout('adjusters', [2.5, 3, 18], [-170, 10], '21 ADJUSTERS', 'cool'), when: ['adj', 'in', 70] },
    { ...callout('mca', [1.5, 4.8, 18.4], [-120, -30], '4 ABSORBERS', 'warm'), when: ['mca', 'in', 72] },
    callout('calandria', [0, 5, 7], [-90, 60], 'MODERATOR', 'cool'),
  ];
  const BREAK_LABEL = callout('hot-leg', [10.5, 3.5, 19.4], [120, -46], 'PIPE BREAK', 'warm');
  R.register({
    id: 'control', view: REACTOR_VIEW, reactorOnly: true, trim: true, keepFocus: true, reserve: 480, panelFirst: true,
    callouts: CONTROL_LABELS,
    leave() { later.clear(); clearInterval(this.ramp); },   // or the ledger keeps redrawing over the next lesson
    enter() {
      const st = this.st = { power: 100, target: 100, fuel: 43, zones: 0, mca: 0, void: 0, shut: 0, sds1: true, tripped: null, voiding: false };
      const row = (name, v, scale = 60) => {
        const w = Math.min(50, Math.abs(v) / scale * 50);
        return `<div class="ledger-row"><span>${name}</span><div class="ledger-track"><i style="left:${v >= 0 ? 50 : 50 - w}%;width:${w}%"></i></div><b>${v > 0 ? '+' : ''}${v.toFixed(1)}</b></div>`;
      };
      this.ledger = () => {
        const net = st.fuel - 28 - 15 + st.zones + st.mca + st.void + st.shut;
        R.panel(`<h2>Reactivity ledger in mk (xenon and adjuster values are published, the rest are teaching values)</h2><div class="ledger">${row('Fuel', st.fuel)}${row('Xenon', -28)}${row('Adjusters', -15)}${row('Liquid zones', st.zones)}${row('Absorbers', st.mca)}${st.void ? row('Coolant void', st.void) : ''}${st.shut ? row('Shutdown system', st.shut) : ''}${row('Net', net)}</div>`);
      };
      const trip = (which, why) => {
        if (st.tripped) return;
        st.tripped = which; st.target = 0;
        R.flash(); R.sound('alarm');
        if (which === 'SDS1') { R.set({ rods: 'in' }); st.shut = -50; R.sound('drop'); R.focus(['sds1']); R.log(`${why} SDS1 fired. 28 rods dropping.`, 'bad'); R.note('Gravity does the work. Cutting the holding power lets the rods fall.'); }
        else { R.set({ gd: 'on' }); st.shut = -50; R.focus(['sds2', 'calandria']); R.log(`${why} SDS2 fired. Gadolinium in the moderator.`, 'bad'); R.note('Gas pressure drives poison through the nozzles. Flushing it out later takes time, which is why it is the backup.'); }
        st.void = st.voiding ? st.void : 0;
        draw(); this.ledger();
      };
      const draw = () => R.actions([
        { label: 'Burn a day of fuel', disabled: !!st.tripped, run: () => { st.fuel -= 1; st.zones = Math.min(3.5, st.zones + 1); this.ledger(); R.log('Fuel reserve falling. Zones drain to compensate.'); R.note(st.zones >= 3.5 ? 'Zones are nearly empty. This is what daily refuelling prevents.' : 'Zones drain a little, and power does not move.'); } },
        { label: 'Refuel two channels', disabled: !!st.tripped, run: () => { st.fuel += 1; st.zones = Math.max(-3.5, st.zones - 1); this.ledger(); R.log('Two channels refuelled. Zones fill.'); R.note('Fresh fuel adds reactivity, so zones fill to hold power flat.'); } },
        { label: st.target === 60 ? 'Return to full power' : 'Set back to 60%', disabled: !!st.tripped, run: () => {
          st.target = st.target === 60 ? 100 : 60;
          if (st.target === 60) { R.set({ mca: 'in' }); st.mca = -8; R.focus(['mca']); R.log('Power setback. Absorbers driving in.', 'warn'); R.note('Absorbers drive in for a fast reduction.'); }
          else { R.set({ mca: 'out' }); st.mca = 0; R.focus(null); R.log('Absorbers withdrawn. Power rising.'); R.note(''); }
          this.ledger(); draw();
        } },
        { label: 'Trip with SDS1', cls: 'danger', disabled: !!st.tripped || !st.sds1, run: () => trip('SDS1', 'Manual trip.') },
        { label: 'Trip with SDS2', cls: 'danger', disabled: !!st.tripped, run: () => trip('SDS2', 'Manual trip.') },
        { label: 'Break a coolant pipe', cls: 'danger', disabled: !!st.tripped || st.voiding, run: () => {
          st.voiding = true; draw();
          R.set({ brk: 'on' }); R.focus(['hot-leg', 'fuel-channel']); R.labels([...CONTROL_LABELS, BREAK_LABEL]);
          R.log('Large break. Coolant voiding in the channels.', 'bad');
          R.note('Coolant boils away, the moderator stays, and reactivity rises. The clock is now measured in seconds, and the long neutron lifetime buys them.');
          clearInterval(this.ramp);
          const ramp = this.ramp = setInterval(() => { st.void = Math.min(16, st.void + 2.2); this.ledger(); }, 110);
          later.set(() => {
            clearInterval(ramp);
            trip(st.sds1 ? 'SDS1' : 'SDS2', 'High neutron power and low coolant pressure.');
            R.set({ flow: 'off' });
            R.focus(['ecc', 'sds1', 'hot-leg']);
            R.labels([...CONTROL_LABELS, BREAK_LABEL, callout('ecc', [-3.6, 14.3, 4.2], [-110, 10], 'EMERGENCY COOLING', 'cool')]);
            R.log('Emergency core cooling starting.', 'warn');
            R.note('The shutdown system caught it. Emergency core cooling is now starting.');
          }, 1300);
        } },
        { label: st.sds1 ? 'Take SDS1 out of service' : 'Return SDS1 to service', cls: st.sds1 ? '' : 'on', disabled: !!st.tripped, run: () => { st.sds1 = !st.sds1; R.log(st.sds1 ? 'SDS1 back in service.' : 'SDS1 out of service for this demonstration. A real unit may not operate this way.', 'warn'); R.note(st.sds1 ? '' : 'For demonstration only. A real unit may not run without all its special safety systems.'); draw(); } },
        { label: 'Reset the plant', run: () => { later.clear(); clearInterval(this.ramp); Object.assign(st, { power: 100, target: 100, fuel: 43, zones: 0, mca: 0, void: 0, shut: 0, tripped: null, voiding: false }); R.reset(); R.focus(null); R.labels(null); R.note(''); R.log('Plant reset for the next run.', 'good'); this.ledger(); draw(); } },
      ]);
      this.ledger(); draw();
    },
    tick(dt) {
      const st = this.st; if (!st) return;
      const goal = st.tripped ? 6 : st.voiding ? 112 : st.target;
      const rate = st.tripped ? 3.2 : st.voiding ? 1.2 : .5;
      st.power += (goal - st.power) * Math.min(1, dt * rate);
      R.set({ power: st.power });
    },
    stats() {
      const s = this.st || { power: 100 };
      return [['Power', `${Math.round(s.power)}<small>%FP</small>`, s.tripped ? 'bad' : ''], ['Control', s.tripped ? 'TRIPPED' : s.voiding ? 'ALARM' : 'NORMAL', s.tripped || s.voiding ? 'bad' : 'good'], ['Zones', '14']];
    },
  });
})();
