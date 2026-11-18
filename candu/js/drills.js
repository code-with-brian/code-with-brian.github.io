/* Lessons 05 to 07: the xenon clock, losing the grid, a planned outage. */
(() => {
  const R = App;
  const callout = (part, at, off, text, tone) => ({ part, at, off, text, tone });
  const later = (() => { let ids = []; return { set(fn, ms) { ids.push(setTimeout(fn, ms)); }, clear() { ids.forEach(clearTimeout); ids = []; } }; })();
  const MIN = 60;

  /* Single-series line chart with a horizontal limit and a hover readout. */
  function lineChart(el, { pts, xMax, yMax, limit, limitLabel, xLabel, yLabel, unit, xTicks, yTicks }) {
    const W = 640, H = 240, L = 44, B = 34, T = 12, Rt = 12;
    const sx = (x) => L + (x / xMax) * (W - L - Rt), sy = (y) => H - B - (y / yMax) * (H - B - T);
    const d = 'M' + pts.map((p) => `${sx(p.x).toFixed(1)} ${sy(Math.max(p.y, 0)).toFixed(1)}`).join('L');
    const gx = xTicks.map((t) => `<text x="${sx(t)}" y="${H - B + 15}" text-anchor="middle" font-size="11" fill="var(--muted)">${t}</text>`).join('');
    const gy = yTicks.map((t) => `<line x1="${L}" x2="${W - Rt}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--rule)"/><text x="${L - 6}" y="${sy(t) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${t}</text>`).join('');
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${yLabel} against ${xLabel}">${gy}${gx}
      <text x="${(W + L) / 2}" y="${H - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${xLabel}</text>
      <text x="${L}" y="9" font-size="11" fill="var(--muted)">${yLabel}</text>
      <line x1="${L}" x2="${W - Rt}" y1="${sy(limit)}" y2="${sy(limit)}" stroke="var(--ink)" stroke-dasharray="5 4"/>
      <text x="${W - Rt}" y="${sy(limit) - 5}" text-anchor="end" font-size="11" fill="var(--ink)">${limitLabel}</text>
      <path class="trace" d="${d}" fill="none" stroke="var(--cher)" stroke-width="2.2" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${R.reduced ? 0 : 100}"/>
      <line class="cross" y1="${T}" y2="${H - B}" stroke="var(--ink)" opacity="0"/><circle class="dot" r="4.5" fill="var(--cher)" stroke="var(--paper-3)" stroke-width="2" opacity="0"/></svg><div class="tip" hidden></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), cross = svg.querySelector('.cross'), dot = svg.querySelector('.dot');
    requestAnimationFrame(() => {
      const t = svg.querySelector('.trace');
      t.style.transition = 'stroke-dashoffset 2.6s ease-in-out';
      t.style.strokeDashoffset = 0;
    });
    const move = (e) => {
      const box = svg.getBoundingClientRect(), x = ((e.clientX - box.left) / box.width) * W;
      const val = Math.max(0, Math.min(xMax, ((x - L) / (W - L - Rt)) * xMax));
      const p = pts.reduce((a, b) => (Math.abs(b.x - val) < Math.abs(a.x - val) ? b : a));
      cross.setAttribute('x1', sx(p.x)); cross.setAttribute('x2', sx(p.x)); cross.setAttribute('opacity', .4);
      dot.setAttribute('cx', sx(p.x)); dot.setAttribute('cy', sy(Math.max(p.y, 0))); dot.setAttribute('opacity', 1);
      tip.hidden = false;
      tip.style.left = `${(sx(p.x) / W) * 100}%`; tip.style.top = `${(sy(Math.max(p.y, 0)) / H) * 100}%`;
      tip.textContent = `${p.x.toFixed(1)} h · ${Math.round(p.y)} ${unit}`;
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); });
  }

  /* ---------- Fig 05, the xenon clock ---------- */
  const UNLIT = ['SDS1 TRIPPED', 'RODS AT BOTTOM', 'HT PRESSURE LOW', 'ANNULUS GAS MOISTURE HIGH', 'GENERATOR BREAKER OPEN', 'GRID FREQUENCY LOW', 'ION CHAMBER FAULT', 'TURBINE TRIPPED'];
  const CAUSES = [
    { id: 'instrument', name: 'Instrument fault', safe: true,
      lamps: [['SDS1 TRIPPED', 'red'], ['RODS AT BOTTOM', 'amber'], ['ION CHAMBER D FAULT', 'amber'], ['LOGIC CHANNEL E FAULT', 'amber'], ['GRID NORMAL', 'green'], ['HT PRESSURE NORMAL', 'green'], ['ANNULUS GAS DRY', 'green'], ['TURBINE HELD', 'amber']],
      after: 'Two faulty instrument channels voted a trip. Nothing in the plant was wrong.' },
    { id: 'leak', name: 'Coolant leak', safe: false,
      lamps: [['SDS1 TRIPPED', 'red'], ['RODS AT BOTTOM', 'amber'], ['ANNULUS GAS MOISTURE HIGH', 'red'], ['HT PRESSURE LOW', 'red'], ['D₂O VAPOUR RECOVERY HIGH', 'amber'], ['GRID NORMAL', 'green'], ['ION CHAMBERS NORMAL', 'green'], ['TURBINE HELD', 'amber']],
      after: 'Moisture in the annulus gas points at a leaking pressure tube. That is the gas gap doing its job as a leak detector.' },
    { id: 'grid', name: 'Grid disturbance', safe: true,
      lamps: [['SDS1 TRIPPED', 'red'], ['RODS AT BOTTOM', 'amber'], ['GENERATOR BREAKER OPEN', 'red'], ['GRID FREQUENCY LOW', 'amber'], ['TURBINE TRIPPED', 'amber'], ['HT PRESSURE NORMAL', 'green'], ['ANNULUS GAS DRY', 'green'], ['ION CHAMBERS NORMAL', 'green']],
      after: 'A disturbance on the grid opened the generator breaker. The reactor itself is healthy and the grid has recovered.' },
  ];
  const RUN = [
    { label: 'Clear and reset the trip', min: 6, done: 'Trip cleared. Shutdown system reset and poised.' },
    { label: 'Withdraw the shutoff rods', min: 7, done: 'Shutoff rods out of the core.', plant: { rods: 'out' } },
    { label: 'Drive the adjusters out', min: 4, done: 'Adjusters withdrawn. All the override reactivity is in.', plant: { adj: 'out' } },
    { label: 'Take the reactor critical', min: 3, done: 'Reactor critical. Neutrons are back.', power: 5 },
    { label: 'Raise power to 60%', min: 3, done: 'Holding at 60 %FP. The flux is burning xenon again.', power: 60, plant: { steam: 'on' } },
  ];
  const profile = Sim.tripProfile(48, 60);
  const curve = profile.curve.map((c) => ({ x: c.h, y: c.mk }));
  const LIMIT = Sim.ADJUSTER_WORTH - Sim.RESTART_PENALTY;
  let round = 0;

  R.register({
    id: 'trip', view: [-300, -368, 690, 462], reactorOnly: true, trim: true, keepFocus: true, reserve: 470, panelFirst: true,
    callouts: [
      { ...callout('sds1', [-3, -4.5, 18.8], [-100, -44], 'SHUTOFF RODS'), when: ['rods', 'in', 96] },
      { ...callout('adjusters', [2.5, 3, 18], [-170, 10], 'ADJUSTERS', 'cool'), when: ['adj', 'in', 70] },
    ],
    leave() { later.clear(); this.d = null; },
    enter() {
      this.d = { phase: 'ready', t: 0, s: { iodine: 1, xenon: 1 }, power: 100, cause: null, step: 0, wrong: 0, ruled: new Set() };
      R.goal(null);
      this.ready();
    },
    ready() {
      const pick = round % CAUSES.length;
      R.benchLabel('Control room');
      R.note('On trip you get about 30 minutes of simulated time. The clock runs while you read.');
      R.actions([{ label: 'Trip the reactor', cls: 'danger', run: () => this.trip(CAUSES[pick]) }]);
      R.panel(`<h2>Annunciator</h2><div class="annunciator idle">${UNLIT.map((t) => `<div class="lamp">${t}</div>`).join('')}</div>`);
      R.setClock(() => R.stamp(this.d ? this.d.t : 0));
    },
    panel() {
      const d = this.d, c = d.cause, margin = Math.max(0, Sim.overrideMargin(d.s.xenon));
      const pct = (margin / LIMIT) * 100;
      R.panel(`<h2>Annunciator</h2><div class="annunciator">${c.lamps.map(([t, k]) => `<div class="lamp ${k}">${t}</div>`).join('')}</div>
        <div class="meter"><div class="meter-row"><span>Override margin</span><b id="mk">${margin.toFixed(1)} mk</b></div><div class="meter-bar"><i id="mkbar" class="${pct < 30 ? 'low' : ''}" style="width:${pct}%"></i></div></div>
        <ol class="steps">${['Diagnose', ...(c.safe ? RUN.map((r) => r.label.replace('the ', '')) : ['Decide'])].map((n, i) => `<li class="${i < d.step ? 'done' : i === d.step ? 'now' : ''}">${n}</li>`).join('')}</ol>`);
    },
    trip(cause) {
      const d = this.d;
      d.phase = 'diagnose'; d.cause = cause; d.t = 0;
      R.set({ rods: 'in', flow: 'full', steam: 'off' });
      R.focus(['sds1', 'calandria', 'fuel-channel']);
      later.set(() => R.focus(null), 3200);
      if (innerWidth <= 980) later.set(() => R.reveal('guide'), 1900);   // rods first, then the lamps beside the choices
      R.flash(); R.sound('alarm'); R.sound('drop');
      R.log('REACTOR TRIP. Shutoff rods at bottom.', 'bad');
      R.log('Confirmed shutdown. Xenon is building.', 'warn');
      R.benchLabel('What tripped the unit?');
      R.note('Read the annunciator. Green lamps matter as much as red ones.');
      this.causes();
      this.say('Read the lamps. What tripped the unit?');
      this.panel();
    },
    // The guide always names the step you are on, so the drill never leaves you guessing.
    say(text) {
      const d = this.d, total = d.cause.safe ? RUN.length + 1 : 2;
      R.goal(text, `Step ${Math.min(d.step + 1, total)} of ${total}`, d.step, total);
    },
    causes() {
      const d = this.d;
      R.actions(CAUSES.map((c) => ({ label: d.ruled.has(c.id) ? `${c.name}: ruled out` : c.name, disabled: d.ruled.has(c.id), run: () => this.diagnose(c) })));
    },
    diagnose(c) {
      const d = this.d;
      if (c.id !== d.cause.id) {
        d.t += 4 * MIN; d.s = Sim.xenonStep(d.s, 0, 4 * MIN);
        d.wrong++;
        R.sound('bad');
        R.log(`${c.name} ruled out. That check cost 4 minutes.`, 'warn');
        R.note(`Not ${c.name.toLowerCase()}. That check cost 4 minutes. Look at the lamps again.`);
        d.ruled.add(c.id);
        this.causes();
        return;
      }
      R.sound('good');
      R.log(d.cause.after, 'good');
      d.step = 1;
      if (d.cause.safe) { d.phase = 'recover'; this.nextAction(); }
      else {
        d.phase = 'decide';
        R.benchLabel('Your call');
        this.say('The alarm is real. Restart, or stay shut down?');
        R.note(`${d.cause.after} The clock is still running. What do you do?`);
        R.actions([
          { label: 'Hold shutdown, cool down', cls: 'go', run: () => this.finish('wise') },
          { label: 'Restart before poison-out', cls: 'danger', run: () => this.finish('reckless') },
        ]);
      }
      this.panel();
    },
    nextAction() {
      const d = this.d, a = RUN[d.step - 1];
      if (!a) return this.finish('win');
      R.benchLabel('Recovery');
      R.note(d.cause.after);
      R.actions([{ label: a.label, cls: 'on', run: () => this.perform(a) }]);
      this.say(`Restart: ${a.label.toLowerCase()}.`);
    },
    perform(a) {
      const d = this.d;
      d.phase = 'busy';
      d.busyLeft = a.min * MIN; d.action = a;
      R.actions([{ label: `${a.label}…`, cls: 'busy', disabled: true, run() {} }]);
      this.say(`Working: ${a.label.toLowerCase()}. This takes ${a.min} simulated minutes.`);
    },
    tick(dt) {
      const d = this.d;
      if (!d || !['diagnose', 'decide', 'recover', 'busy'].includes(d.phase)) return;
      const rate = d.phase === 'busy' ? 200 : 10;
      let step = dt * rate;
      if (d.phase === 'busy') step = Math.min(step, d.busyLeft);
      d.t += step;
      d.s = Sim.xenonStep(d.s, 0, step);
      if (d.phase === 'busy') {
        d.busyLeft -= step;
        if (d.busyLeft <= 0) {
          const a = d.action;
          if (a.plant) R.set(a.plant);
          if (a.power) { d.power = a.power; R.set({ power: a.power }); }
          R.log(a.done);
          d.step++; d.phase = 'recover';
          this.panel();
          this.nextAction();
        }
      }
      const margin = Sim.overrideMargin(d.s.xenon);
      if (margin <= 0 && d.phase !== 'done' && d.cause.safe) return this.finish('poisoned');
      if (margin <= 0 && d.phase !== 'done' && !d.cause.safe) return this.finish('wise');
      const mk = document.getElementById('mk'), bar = document.getElementById('mkbar');
      if (mk) { mk.textContent = `${margin.toFixed(1)} mk`; bar.style.width = `${(margin / LIMIT) * 100}%`; bar.classList.toggle('low', margin < LIMIT * .3); }
    },
    finish(kind) {
      const d = this.d;
      d.phase = 'done';
      round++;
      later.clear();
      R.focus(null);
      const spare = Math.max(0, profile.override - d.t);
      const lost = (728 * profile.back / 3600 / 1000).toFixed(1);
      const results = {
        win: ['win', 'You beat the xenon clock', `Back at 60 %FP with ${R.stamp(spare)} to spare and ${d.wrong} wrong guess${d.wrong === 1 ? '' : 'es'}. Xenon is burning off and the unit avoids about ${lost} GWh of lost output.`, `I just beat the xenon clock on a CANDU reactor with ${R.stamp(spare)} to spare.`],
        poisoned: ['lose', 'Poisoned out', `The adjusters ran out at ${R.stamp(d.t)}. Now you wait about ${Math.floor(profile.back / 3600)} hours, which costs about ${lost} GWh of lost output. Nobody is in danger. It is a very expensive wait.`, 'I poisoned out a CANDU reactor. Now we wait a day and a half.'],
        wise: ['wise', 'Right call', `You chose to stay shut down with a suspected leak, so the unit poisons out and the crew finds the bad tube. Losing about ${lost} GWh is the price of doing this properly, and it is a price any operator should pay.`, 'I let a CANDU poison out on purpose, because the alarm was real. That was the right answer.'],
        reckless: ['lose', 'Wrong call', 'You restarted on a suspected leak to save the schedule. Operators are trained to do the opposite: when the cause is real or unknown, the reactor stays shut down. The clock was never the priority.', 'I tried to restart a CANDU with a leak. Do not do this.'],
      };
      const [cls, title, body, share] = results[kind];
      R.sound(cls === 'lose' ? 'bad' : 'good');
      R.log(title + '.', cls === 'lose' ? 'bad' : 'good');
      R.note('');
      R.benchLabel('');
      R.goal(title, 'Result');
      R.actions([]);
      const p = R.panel(`<div class="result ${cls}"><strong>${title}</strong>${body}<div class="share"><button class="act" type="button" id="again">Run the drill again</button><a class="act on" href="#blackout">Next: Losing the grid</a><button class="act" type="button" id="copy">Copy my result</button><span id="copied"></span></div></div><h2>Extra xenon after the trip, with no flux to burn it</h2><div class="chart-wrap" id="xe"></div>`);
      lineChart(p.querySelector('#xe'), { pts: curve, xMax: 48, yMax: 100, limit: LIMIT, limitLabel: 'Most the adjusters can override', xLabel: 'Hours after trip', yLabel: 'Extra xenon, mk', unit: 'mk', xTicks: [0, 12, 24, 36, 48], yTicks: [0, 25, 50, 75, 100] });
      R.reveal('panel');
      p.querySelector('#again').addEventListener('click', () => { R.reset(); R.focus(null); this.enter(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      p.querySelector('#copy').addEventListener('click', async () => {
        const text = `${share} Try it: ${location.href.split('#')[0]}#trip`;
        const out = p.querySelector('#copied');
        try { await navigator.clipboard.writeText(text); out.textContent = 'Copied.'; } catch { out.textContent = text; }
      });
    },
    stats() {
      const d = this.d;
      if (!d) return [];
      const left = Math.max(0, profile.override - d.t);
      const live = d.phase !== 'ready';
      return [['Override left', live ? R.stamp(left) : '30:00', left < 6 * MIN && d.phase !== 'done' ? 'bad' : ''], ['Extra xenon', `${Sim.xenonLoad(d.s.xenon).toFixed(1)}<small>mk</small>`], ['Power', `${d.power && !live ? 100 : (d.power === 100 ? 0 : d.power)}<small>%FP</small>`]];
    },
  });

  /* ---------- Fig 06, losing the grid ---------- */
  const RUNGS = [
    ['Main feedwater and pumps', 'Normal running on Class IV power'],
    ['Thermosyphoning to steam generators', 'Standby generators run auxiliary feedwater'],
    ['Emergency water and power', 'Separate, seismically qualified supplies feed the steam generators'],
    ['Moderator', 'Takes the heat even with no water in the fuel channels'],
    ['Shield tank', 'Passive. Keeps the calandria shell cool for at least 24 hours'],
  ];
  const EVENTS = [
    { label: 'Lose the grid', log: 'Class IV power lost. Pumps coasting down. Reactor tripped.', note: 'The pumps run down, the reactor trips, and generators start without anyone touching them. Natural circulation carries the decay heat.', plant: { grid: 'off', rods: 'in', flow: 'thermo', steam: 'aux', diesel: 'on', power: 8 }, focus: ['switchyard', 'diesels', 'steam-generator'] },
    { label: 'Fail the standby generators', log: 'Class III lost. Batteries carry control and protection.', note: 'Batteries keep instruments alive for at least 40 minutes. Emergency supplies come in on a separate, protected path.', plant: { diesel: 'dead' }, focus: ['batteries', 'steam-generator'], battery: true },
    { label: 'Fail the emergency supplies', log: 'Steam generators dry. Heat goes to the moderator through the channel walls.', note: 'This is past normal design. The fuel channels now shed heat outward into the 70 °C moderator around them, a heat sink most reactor types do not have.', plant: { flow: 'off', steam: 'off' }, focus: ['calandria', 'fuel-channel'] },
    { label: 'Fail moderator cooling', log: 'Moderator boiling off. Shield tank is the last line.', note: 'The shield tank needs no power or action. It keeps the calandria shell cool for at least 24 hours, which is time for portable pumps and generators to arrive.', plant: { mod: 'off' }, focus: ['shield-tank', 'calandria'] },
  ];
  R.register({
    id: 'blackout', keepFocus: true, reserve: 400,
    callouts: [
      callout('switchyard', [41, -27, 3], [10, -56], 'GRID', 'warm'),
      callout('diesels', [18, 20.6, 2.2], [120, 10], 'STANDBY GENERATORS', 'gold'),
      callout('batteries', [26, 20.6, 1.4], [90, 40], 'BATTERIES'),
      callout('shield-tank', [0, 6.8, 2], [-160, 110], 'SHIELD TANK', 'cool'),
      callout('moderator-hx', [-15, -3, 3], [-40, 60], 'MODERATOR COOLING', 'cool'),
    ],
    enter() {
      this.d = { rung: 0, t: 0, battery: null, on: false };
      this.draw();
    },
    leave() { this.d = null; },
    draw() {
      const d = this.d, e = EVENTS[d.rung];
      R.benchLabel('Take something away');
      R.goal(d.rung ? `Now carrying the heat: ${RUNGS[d.rung][0].toLowerCase()}.` : null, d.rung ? `${d.rung} of ${EVENTS.length} layers removed` : null, d.rung, EVENTS.length, !e);
      R.actions([
        ...(e ? [{ label: e.label, cls: 'danger', run: () => this.fire(e) }] : []),
        ...(d.rung ? [{ label: 'Restore the plant', cls: 'on', run: () => { R.reset(); R.focus(null); R.note(''); R.log('Plant restored.', 'good'); this.enter(); } }] : []),
      ]);
      R.panel(`<h2>Heat sink ladder</h2><ol class="ladder">${RUNGS.map((r, i) => `<li class="${i === d.rung ? 'active' : i < d.rung ? 'lost' : ''}"><b>${i + 1}</b><div>${r[0]}<small>${r[1]}</small></div><span class="tag">${i === d.rung ? 'CARRYING HEAT' : i < d.rung ? 'LOST' : 'STANDING BY'}</span></li>`).join('')}</ol>`);
      if (!e) R.note('Every layer has been removed on purpose here. That takes a chain of failures far past the design basis, and the plant still bought a day. In the meantime, portable equipment added after Fukushima is on its way.');
    },
    fire(e) {
      const d = this.d;
      d.on = true; d.rung++;
      R.set(e.plant);
      if (e.battery) d.battery = 40 * MIN;
      R.focus(e.focus); R.note(e.note); R.log(e.log, d.rung > 2 ? 'bad' : 'warn');
      R.flash(); R.sound('alarm');
      this.draw();
    },
    tick(dt) {
      const d = this.d;
      if (!d || !d.on) return;
      d.t += dt * 120;
      if (d.battery !== null) d.battery = Math.max(0, d.battery - dt * 120);
    },
    stats() {
      const d = this.d;
      if (!d) return [];
      const mw = d.on ? 2064 * Sim.decayHeat(d.t) : 2064;
      return [[d.on ? 'Decay heat' : 'Heat', `${Math.round(mw).toLocaleString()}<small>MW</small>`], ['Elapsed', d.on ? `${Math.floor(d.t / 3600)}h${String(Math.floor(d.t / 60) % 60).padStart(2, '0')}` : '0h00'], ['Batteries', d.battery === null ? 'FULL' : `${Math.ceil(d.battery / 60)}<small>min</small>`, d.battery === 0 ? 'bad' : '']];
    },
  });

  /* ---------- Fig 07, a planned outage ---------- */
  const PHASES = [
    { day: 0, name: 'Ramp down', primary: '9.9 MPa · 310 °C', text: 'The grid operator has known about this for months. Power comes down and the generator breaker opens.', plant: { power: 40 }, focus: ['generator', 'switchyard'] },
    { day: 0, name: 'Guaranteed shutdown', primary: '9.9 MPa · 310 °C', text: 'Reactor shut down, then poison added to the moderator. From here it stays subcritical whatever else happens.', plant: { power: 8, rods: 'in', gd: 'on', steam: 'off' }, focus: ['sds1', 'calandria'] },
    { day: 1, name: 'Cool down', primary: 'Falling', text: 'Steam generators take the unit down first, then the shutdown cooling system takes over.', plant: { flow: 'thermo' }, focus: ['steam-generator', 'pump'] },
    { day: 2, name: 'Drain to header level', primary: '0.5 MPa · 54 °C', text: 'Coolant is lowered to the headers. Crews can now open the system, while fuel stays cooled by shutdown cooling.', plant: { flow: 'off', drained: 'on' }, focus: ['roh', 'rih', 'feeders'] },
    { day: 3, name: 'Work windows', primary: '0.5 MPa · 54 °C', text: 'Finish every job on the list to move on. In a real outage this is thousands of tasks.', work: true, plant: {}, focus: [] },
    { day: 20, name: 'Refill and heat up', primary: 'Rising', text: 'Systems are closed, tested and refilled. Pumps restart and their own heat brings the coolant back up.', plant: { flow: 'full', drained: 'off' }, focus: ['pump', 'hot-leg', 'cold-leg'] },
    { day: 22, name: 'Remove poison, go critical', primary: '9.9 MPa · 266 °C', text: 'Poison comes out of the moderator, rods withdraw, and operators approach critical slowly and on purpose.', plant: { rods: 'out', gd: 'off', power: 12 }, focus: ['sds1', 'calandria'] },
    { day: 23, name: 'Back on the grid', primary: '9.9 MPa · 310 °C', text: 'Generator synchronized, breaker closed, power raised in steps. 728 MW back on the wires.', plant: { power: 100, steam: 'on' }, focus: ['turbine', 'generator', 'switchyard'] },
  ];
  const JOBS = [
    ['Inspect steam generator tubes', 'steam-generator'],
    ['Inspect feeders', 'feeders'],
    ['Inspect fuel channels', 'fuel-channel'],
    ['Overhaul the turbine', 'turbine'],
    ['Test safety systems', 'sds1'],
  ];
  const SCALE = [
    { n: 'Trip, xenon beaten', h: .5, t: 'Under an hour' },
    { n: 'Poison-out', h: 36, t: 'About 36 h' },
    { n: 'Vacuum building outage', h: 480, t: 'About 20 days' },
    { n: 'Planned outage (this example)', h: 552, t: '23 days' },
    { n: 'Darlington Unit 4 refurbishment', h: 23232, t: '968 days' },
  ];
  function scaleChart() {
    const W = 640, L = 226, Rt = 70, top = 26, rowH = 28, H = top + SCALE.length * rowH + 8;
    const lo = Math.log10(.25), hi = Math.log10(40000);
    const sx = (h) => L + ((Math.log10(h) - lo) / (hi - lo)) * (W - L - Rt);
    const ticks = [[1, '1 h'], [24, '1 day'], [720, '1 mo'], [8760, '1 yr']];
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Outage lengths on a logarithmic time scale">
      ${ticks.map(([h, t]) => `<line x1="${sx(h)}" x2="${sx(h)}" y1="${top - 6}" y2="${H}" stroke="var(--rule)"/><text x="${sx(h)}" y="${top - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${t}</text>`).join('')}
      ${SCALE.map((s, i) => { const y = top + i * rowH + rowH / 2; return `<g><title>${s.n}: ${s.t}</title><line x1="${L}" x2="${sx(s.h)}" y1="${y}" y2="${y}" stroke="var(--rule)" stroke-width="2"/><text x="${L - 10}" y="${y + 4}" text-anchor="end" font-size="11.5" fill="var(--ink)">${s.n}</text><circle cx="${sx(s.h)}" cy="${y}" r="6" fill="var(--cher)" stroke="var(--paper-3)" stroke-width="2"/><text x="${sx(s.h) + 12}" y="${y + 4}" font-size="11.5" fill="var(--ink)">${s.t}</text></g>`; }).join('')}
    </svg>`;
  }
  R.register({
    id: 'outage', keepFocus: true, reserve: 370,
    callouts: [
      callout('steam-generator', [14.6, -6.5, 30], [40, -30], 'STEAM GENERATORS'),
      callout('feeders', [7, 2, 14], [-170, 60], 'FEEDERS', 'warm'),
      callout('turbine', [32, -16.5, 9], [10, -60], 'TURBINE'),
      callout('calandria', [0, -2, 14], [-112, -40], 'CALANDRIA', 'cool'),
    ],
    enter() {
      this.d = { i: -1, jobs: new Set() };
      R.goal(null);
      R.benchLabel('Outage manager');
      this.draw();
    },
    leave() { this.d = null; },
    draw() {
      const d = this.d, p = PHASES[d.i], blocked = p && p.work && d.jobs.size < JOBS.length;
      R.actions([
        { label: d.i < 0 ? 'Start the outage' : d.i === PHASES.length - 1 ? 'Start over' : 'Next phase', cls: 'on', disabled: blocked, run: () => this.step() },
        ...(blocked ? [{ label: `${JOBS.length - d.jobs.size} job${JOBS.length - d.jobs.size === 1 ? '' : 's'} left`, disabled: true, run() {} }] : []),
      ]);
      const pan = R.panel(`<ol class="steps">${PHASES.map((x, k) => `<li class="${k < d.i ? 'done' : k === d.i ? 'now' : ''}">${x.name}</li>`).join('')}</ol>
        ${p && p.work ? `<div class="tasks">${JOBS.map(([n], k) => `<button type="button" class="act ${d.jobs.has(k) ? 'go' : ''}" data-job="${k}">${d.jobs.has(k) ? '✓ ' : ''}${n}</button>`).join('')}</div>` : ''}
        <h2>Outages on one time scale (log scale)</h2><div class="chart-wrap">${scaleChart()}</div>`);
      pan.querySelectorAll('[data-job]').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.job;
        d.jobs.add(k); R.focus([JOBS[k][1]]);
        R.log(`${JOBS[k][0]}: complete, no findings to report.`, 'good');
        R.note(`${JOBS[k][0]}. ${d.jobs.size} of ${JOBS.length} done.`);
        R.sound('click');
        this.draw();
      }));
    },
    step() {
      const d = this.d;
      if (d.i === PHASES.length - 1) { R.reset(); R.focus(null); this.enter(); return; }
      d.i++;
      const p = PHASES[d.i];
      R.set(p.plant); R.focus(p.focus.length ? p.focus : null); R.note(p.text);
      R.goal(p.name, `Phase ${d.i + 1} of ${PHASES.length}`, d.i, PHASES.length);
      R.log(`Day ${p.day}. ${p.name}.`, d.i === PHASES.length - 1 ? 'good' : '');
      if (d.i === PHASES.length - 1) R.sound('good');
      this.draw();
    },
    stats() {
      const d = this.d;
      if (!d) return [];
      const p = PHASES[d.i];
      return [['Day', p ? p.day : '0'], ['Primary', p ? p.primary : '9.9 MPa · 310 °C'], ['Status', p ? (d.i === PHASES.length - 1 ? 'ONLINE' : 'OUTAGE') : 'ONLINE', p && d.i !== PHASES.length - 1 ? 'bad' : 'good']];
    },
  });
})();
