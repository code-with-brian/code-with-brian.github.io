/* The master scene: a cut-away CANDU 6 style unit. Drawn back to front. */
(function (root) {
  const { Sketch, P, shade, INK, pt, f } = Iso;
  const C = { steel: '#c9cec6', steel2: '#aab3ae', conc: '#d8d7ca', hot: '#e0573c', cold: '#3f7fd9', steam: '#d9dcd2',
    mod: '#8fc9c6', amber: '#e9b44c', mint: '#a9d8b8', cher: '#2c66f0', paper: '#eef0e7', ink: INK };
  const CAL = { x0: -4.6, x1: 4.6, z: 9.6, r: 5.2 };
  const CHANNEL_M = 4.75 / 11;   // lattice unit in drawing metres (inside the calandria radius)
  const R = 21, WALL = 29;       // reactor building, drawn cut away
  const HEADER_Z = 17.4, SG_BASE = 19, DECK_Z = 15.3;

  // Outline of a set of screen points, used to fill the whole calandria barrel.
  function hull(points) {
    const ps = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const half = (list) => {
      const h = [];
      for (const p of list) {
        while (h.length > 1) {
          const [a, b] = [h[h.length - 2], h[h.length - 1]];
          if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 0) break;
          h.pop();
        }
        h.push(p);
      }
      h.pop();
      return h;
    };
    return [...half(ps), ...half(ps.reverse())];
  }

  function ringPath(c, r, from = 0, to = 360) {
    const pts = [];
    for (let a = from; a <= to; a += 6) {
      const t = (a * Math.PI) / 180;
      pts.push(P(c[0] + r * Math.cos(t), c[1] + r * Math.sin(t), c[2]));
    }
    return pts;
  }

  /* Back half of the wall stands, the front half is cut away to the floor. */
  function building(s) {
    s.open('data-part="containment" class="part"');
    const base = ringPath([0, 0, 0], R, 135, 315), top = ringPath([0, 0, WALL], R, 135, 315);
    s.path('M' + base.map(pt).join('L') + 'L' + top.reverse().map(pt).join('L') + 'Z', `fill="#e4e6db" stroke="${INK}" stroke-width="1.3"`);
    const a = P(-R * .7071, R * .7071, 0), b = P(-R * .7071, R * .7071, WALL);
    const hatch = [];
    for (let t = 145; t < 315; t += 10) {
      const r = (t * Math.PI) / 180, q = P(R * Math.cos(r), R * Math.sin(r), 0), w = P(R * Math.cos(r), R * Math.sin(r), WALL);
      hatch.push(`M${pt(q)}L${pt(w)}`);
    }
    s.path(hatch.join(''), `fill="none" stroke="${INK}" stroke-width=".5" opacity=".16"`);
    s.path('M' + ringPath([0, 0, 0], R).map(pt).join('L') + 'Z', `fill="${C.conc}" stroke="${INK}" stroke-width="1.5"`);
    s.close();
  }

  function moderator(s) {
    s.open('data-part="moderator-hx" class="part"');
    s.box(-17, -6, 0, 4.4, 2.6, 3.2, C.steel2);
    s.cyl([-14.6, -1.6, 0], [-14.6, -1.6, 2.8], .9, C.mod);
    s.close();
    s.pipe([[-12.6, -4.6, 1.6], [-6.4, -4.6, 1.6], [-6.4, 0, 1.6], [-6.4, 0, 6.2], [-5.4, 0, 6.2]], C.mod, { w: 3, flow: 'f-mod', attrs: 'data-part="moderator-hx" class="part"' });
  }

  function shieldVault(s) {
    s.box(-6, -6.8, 0, 12, 13.6, 3.8, C.conc, 'data-part="shield-tank" class="part"');
  }

  function calandria(s) {
    const a = [CAL.x0, 0, CAL.z], b = [CAL.x1, 0, CAL.z];
    s.cyl([-5.5, 0, CAL.z], [-4.6, 0, CAL.z], 5.6, C.steel2, { attrs: 'data-part="end-shield" class="part"' });
    s.cyl(a, b, CAL.r, C.mod, { cap: C.mod, attrs: 'data-part="calandria" class="part calandria-shell"' });

    const glow = [];
    for (const k of Sim.lattice()) {
      if ((k.col + k.row) % 3) continue;
      const y = k.x * CHANNEL_M, z = CAL.z + k.y * CHANNEL_M;
      glow.push('M' + pt(P(-4.65, y, z)) + 'L' + pt(P(4.65, y, z)));
    }
    s.path(glow.join(''), `class="fuel-glow part" data-part="fuel-channel" fill="none" stroke="#f0a62e" stroke-width="1.5" stroke-linecap="round"`);

    // Gadolinium cloud for SDS2, hidden until fired.
    const rim = [];
    for (const x of [CAL.x0, CAL.x1]) for (let a = 0; a < 360; a += 10) {
      const t = (a * Math.PI) / 180;
      rim.push(P(x, CAL.r * Math.cos(t), CAL.z + CAL.r * Math.sin(t)));
    }
    s.raw(`<path class="gd-cloud" d="M${hull(rim).map(pt).join('L')}Z" fill="#e9c44c"/>`);

    // Near end shield with 380 end fittings, and the feeder fans.
    s.cyl([4.6, 0, CAL.z], [5.5, 0, CAL.z], 5.6, C.steel, { cap: '#dfe3da', attrs: 'data-part="end-shield" class="part"' });
    const dots = [], inlet = [], outlet = [];
    for (const k of Sim.lattice()) {
      const y = k.x * CHANNEL_M, z = CAL.z + k.y * CHANNEL_M, p = P(5.52, y, z);
      dots.push(`M${f(p[0] - .9)} ${f(p[1] - .4)}l1.8 .8`);
      const odd = (k.col + k.row) & 1, loopY = y < 0 ? -4.2 : 4.2;
      const hx = odd ? 7.6 : 8.8;
      const q1 = P(6.4, y, z), q2 = P(hx - .4, y * .55 + loopY * .5, 15), q3 = P(hx, loopY + y * .35, HEADER_Z - .1);
      (odd ? outlet : inlet).push(`M${pt(p)}Q${pt(q1)} ${pt(q2)}L${pt(q3)}`);
    }
    s.path(inlet.join(''), `class="feeder part" data-part="feeders" fill="none" stroke="${C.cold}" stroke-width=".4" opacity=".8"`);
    s.path(outlet.join(''), `class="feeder part" data-part="feeders" fill="none" stroke="${C.hot}" stroke-width=".4" opacity=".8"`);
    s.path(dots.join(''), `class="part" data-part="fuel-channel" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"`);
    // Fission sparks across the channel face. They fade with reactor power.
    const sparks = Array.from({ length: 22 }, (_, i) => {
      const a = i * 2.399, r = 4.6 * Math.sqrt((i + .5) / 22);   // an even spiral, so the spread needs no randomness
      const [x, y] = P(5.5, r * Math.cos(a), CAL.z + r * Math.sin(a));
      return `<circle class="spark" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" style="animation-delay:${-(i * .37 % 1.7).toFixed(2)}s"/>`;
    });
    s.raw(`<g class="sparks part" data-part="fuel-channel">${sparks.join('')}</g>`);
  }

  function header(s, x, y0, y1, color, part) {
    s.cyl([x, y0, HEADER_Z], [x, y1, HEADER_Z], .4, color, { sw: 1, attrs: `data-part="${part}" class="part"` });
  }

  function loopEnd(s, end) {
    // end is +1 (near, +x) or -1 (far). Two steam generators, two pumps, four headers.
    for (const side of [-1, 1]) {
      const sgx = end * 14.6, sgy = (end > 0 ? -1.5 : 1.5) + side * 5, px = end * 17.6, py = sgy;
      const inner = end * 7.6, outer = end * 8.8;
      const roh = end > 0 ? inner : outer, rih = end > 0 ? outer : inner;
      const loop = side < 0 ? 'f-a' : 'f-b';
      s.pipe([[roh, side * 4.2, HEADER_Z], [roh, sgy, 19.4], [sgx, sgy, 19.4]], C.hot, { w: 3.6, flow: `f-hot ${loop}`, attrs: 'data-part="hot-leg" class="part"' });
      s.pipe([[sgx, sgy, 18.8], [sgx, sgy, 16.8], [px, py, 16.8]], C.cold, { w: 3.6, flow: `f-cold ${loop}`, attrs: 'data-part="cold-leg" class="part"' });
      s.pipe([[px, py, 14.8], [px, py, 12.6], [rih, py, 12.6], [rih, side * 4.2, HEADER_Z]], C.cold, { w: 3.6, flow: `f-cold ${loop}`, attrs: 'data-part="cold-leg" class="part"' });
      header(s, roh, side * 1.4, side * 7, C.hot, 'roh');
      header(s, rih, side * 1.4, side * 7, C.cold, 'rih');
      s.open('data-part="pump" class="part pump"');
      s.cyl([px, py, 14.6], [px, py, 17.2], .95, C.steel);
      s.cyl([px, py, 17.2], [px, py, 19.2], .6, C.amber);
      s.close();
      s.open('data-part="steam-generator" class="part"');
      s.cyl([sgx, sgy, SG_BASE], [sgx, sgy, 26], 1.35, C.steel);
      s.cyl([sgx, sgy, 26], [sgx, sgy, 27.2], 1.35, C.steel, { r2: 1.85 });
      s.cyl([sgx, sgy, 27.2], [sgx, sgy, 30], 1.85, C.steel, { cap: '#e2e6dd' });
      s.close();
    }
  }

  function pressurizer(s) {
    s.open('data-part="pressurizer" class="part"');
    s.cyl([2, -16, 15], [2, -16, 24], 1.25, C.steel);
    s.close();
    s.pipe([[2, -16, 15.2], [2, -10, 15.2], [7.6, -10, 15.2], [7.6, -7, HEADER_Z]], C.hot, { w: 2.2, attrs: 'data-part="pressurizer" class="part"' });
  }

  function reactivityDeck(s) {
    s.box(-3.6, -5.2, DECK_Z, 7.2, 10.4, .36, C.steel2, 'data-part="deck" class="part"');
    const rod = (x, y, cls, part, color, h) => {
      const low = P(x, y, DECK_Z + .4), top = P(x, y, DECK_Z + .4 + h);
      s.raw(`<g class="${cls} part" data-part="${part}"><path d="M${pt(low)}L${pt(top)}" stroke="${color}" stroke-width="2" stroke-linecap="round"/></g>`);
    };
    // 28 shutoff rods, 21 adjusters, 4 mechanical control absorbers.
    for (let i = 0; i < 28; i++) rod(-3 + (i % 7), -4.5 + Math.floor(i / 7) * 3, 'rod-sor', 'sds1', INK, 3.2);
    for (let i = 0; i < 21; i++) rod(-2.5 + (i % 6) * 1, -3 + Math.floor(i / 6) * 3, 'rod-adj', 'adjusters', C.cold, 2.4);
    for (let i = 0; i < 4; i++) rod(-1.5 + i, 4.8, 'rod-mca', 'mca', C.hot, 2.8);
    s.open('data-part="sds2" class="part"');
    s.cyl([-2, -10.4, 15.4], [-2, -10.4, 18.6], .7, C.amber);
    s.cyl([.2, -10.4, 15.4], [.2, -10.4, 18.6], .7, C.amber);
    s.close();
    for (const x of [-2, .2]) s.line([[x, -10.4, 15.4], [x, -6.4, 13.4], [x, -4.8, 12]], 'class="part" data-part="sds2" stroke="#9a7a26" stroke-width="1.8"');
  }

  function dousing(s) {
    s.open('data-part="dousing" class="part"');
    s.cyl([-3, -8, WALL + 1.6], [-3, -8, WALL + 3.6], 8.4, C.mint, { op: .9, cap: '#c8e8d2' });
    s.close();
  }

  function steamLines(s) {
    const y = -13.5, z = 31.2;
    const riser = (x, sy) => s.pipe([[x, sy, 30], [x, sy, z], [x, y, z]], C.steam, { w: 2.8, flow: 'f-steam', attrs: 'data-part="steam-line" class="part"' });
    riser(-14.6, 6.5); riser(-14.6, -3.5);
    s.pipe([[-14.6, y, z], [27, y, z], [27, -16.5, z], [27, -16.5, 8.6]], C.steam, { w: 3.4, flow: 'f-steam', attrs: 'data-part="steam-line" class="part"' });
    riser(14.6, 3.5); riser(14.6, -6.5);
  }

  function feedwater(s) {
    const a = 'data-part="feedwater" class="part"';
    s.pipe([[29.5, -13.2, 1.5], [21.5, -13.2, 1.5], [21.5, -9.5, 1.5], [21.5, -9.5, 22], [16, -6.5, 22]], C.cold, { w: 2.4, flow: 'f-feed', attrs: a });
    s.pipe([[21.5, -9.5, 22], [21.5, 3.5, 22], [16, 3.5, 22]], C.cold, { w: 2.4, flow: 'f-feed', attrs: a });
  }

  function turbine(s) {
    s.box(24, -21.5, 0, 22, 9.6, .8, C.conc, 'data-part="turbine" class="part"');
    s.box(28, -19, .8, 10, 5, 3.4, C.steel2, 'data-part="condenser" class="part"');
    s.open('data-part="turbine" class="part spin"');
    s.cyl([25.4, -16.5, 6.8], [28.4, -16.5, 6.8], 1.3, C.steel, { r2: 1.55 });
    for (const x of [28.8, 32, 35.2]) {
      s.cyl([x, -16.5, 6.8], [x + 1.4, -16.5, 6.8], 1.5, C.steel, { r2: 2.5 });
      s.cyl([x + 1.4, -16.5, 6.8], [x + 2.8, -16.5, 6.8], 2.5, C.steel, { r2: 1.5 });
    }
    // Marks running round each rotor read as rotation, which a flat drawing cannot otherwise show.
    const rotor = (x, r, color) => {
      const arc = Array.from({ length: 19 }, (_, i) => {
        const t = (-70 + i * 10) * Math.PI / 180;
        return pt(P(x, -16.5 + r * Math.sin(t), 6.8 + r * Math.cos(t)));
      });
      s.path(`M${arc.join('L')}`, `class="rotor" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="4 8"`);
    };
    [30.2, 33.4, 36.6].forEach((x) => rotor(x, 2.5, '#1b2127'));
    s.close();
    s.cyl([38.6, -16.5, 6.8], [44, -16.5, 6.8], 1.85, C.hot, { attrs: 'data-part="generator" class="part"', cap: shade(C.hot, .3) });
    s.open('data-part="generator" class="part"');
    [40, 41.3, 42.6].forEach((x) => rotor(x, 1.85, '#fff'));
    s.close();
  }

  function grid(s) {
    s.box(39, -29.5, 0, 4.6, 4, 3, C.steel2, 'data-part="switchyard" class="part"');
    const a = [47.5, -29], t = (z, dy) => [a[0], a[1] + dy, z];
    s.open('data-part="switchyard" class="part"');
    s.line([[a[0] - 1.3, a[1] - 1.3, 0], t(20, 0), [a[0] + 1.3, a[1] + 1.3, 0]], `stroke="${INK}" stroke-width="1.6"`);
    s.line([[a[0] - 1.3, a[1] + 1.3, 0], t(20, 0), [a[0] + 1.3, a[1] - 1.3, 0]], `stroke="${INK}" stroke-width="1.6"`);
    s.line([t(16, -3), t(16, 3)], `stroke="${INK}" stroke-width="1.7"`);
    s.line([t(13, -2.2), t(13, 2.2)], `stroke="${INK}" stroke-width="1.7"`);
    s.close();
    s.path(`M${pt(P(41.5, -27.5, 3))}Q${pt(P(44.5, -29, 6))} ${pt(P(...t(16, -3)))}M${pt(P(41.5, -27.5, 3))}Q${pt(P(44.5, -27, 5))} ${pt(P(...t(13, 2.2)))}`, `class="grid-wire" fill="none" stroke="${C.hot}" stroke-width="1.3"`);
    s.path(`M${pt(P(44, -16.5, 6.8))}Q${pt(P(45, -21, 3))} ${pt(P(41.5, -27.5, 3))}`, `class="grid-wire" fill="none" stroke="${C.hot}" stroke-width="1.3"`);
  }

  function support(s) {
    s.open('data-part="fuel-bay" class="part"');
    s.box(-5, 24.5, 0, 10, 6.4, 2, C.conc);
    s.face([[-4.2, 25.3, 2.01], [4.2, 25.3, 2.01], [4.2, 30.1, 2.01], [-4.2, 30.1, 2.01]], C.cher, 'class="bay-water"');
    for (let i = 0; i < 7; i++) s.line([[-3.4 + i * 1.1, 26, 2.02], [-3.4 + i * 1.1, 29.4, 2.02]], 'stroke="#bcd2ff" stroke-width="2.4" stroke-dasharray="2 3"');
    s.close();
    s.open('data-part="diesels" class="part diesel"');
    s.box(14, 19.5, 0, 4.4, 2.2, 2.2, C.amber);
    s.box(19, 19.5, 0, 4.4, 2.2, 2.2, C.amber);
    s.close();
    s.box(24.6, 19.5, 0, 2.4, 2.2, 1.4, C.steel2, 'data-part="batteries" class="part battery"');
    s.open('data-part="ecc" class="part"');
    s.cyl([-5, 14, 0], [-5, 14, 4.2], 1, C.mint);
    s.cyl([-2.2, 14.6, 0], [-2.2, 14.6, 4.2], 1, C.mint);
    s.close();
  }

  // A burst on one hot leg, shown only when the pipe-break demonstration runs.
  function pipeBreak(s) {
    const [x, y] = P(10.5, 3.5, 19.4), spikes = 14;
    const star = Array.from({ length: spikes }, (_, i) => {
      const a = (i / spikes) * 6.283, r = i % 2 ? 7 : 16;
      return `${f(x + r * Math.cos(a))} ${f(y + r * Math.sin(a))}`;
    }).join('L');
    const jets = [[-30, -34], [8, -46], [40, -22], [-44, -6]].map(([dx, dy]) => `<path class="jet" d="M${f(x)} ${f(y)}l${dx} ${dy}"/>`).join('');
    s.raw(`<g class="break"><path d="M${star}Z" fill="${C.hot}" stroke="${INK}" stroke-width="1.4"/>${jets}</g>`);
  }

  function fuellingMachine(s) {
    const a = 'data-part="fuelling-machine" class="part"';
    s.box(8.4, 9, 0, 1.2, 1.2, 8.4, C.steel2, a);
    s.box(8.4, -8.6, 0, 1.2, 1.2, 8.4, C.steel2, a);
    s.line([[9, -8, 8.4], [9, 9.6, 8.4]], `stroke="${INK}" stroke-width="3.4" ${a}`);
    s.open('id="fm" class="fm part" data-part="fuelling-machine"');
    s.box(6.8, 6, 7.2, 2.8, 2.2, 2.8, C.amber);
    s.cyl([6.8, 7.1, 8.6], [6, 7.1, 8.6], .6, C.steel);
    s.close();
  }

  function draw() {
    const s = new Sketch('p');
    dousing(s);
    building(s);
    pressurizer(s);
    loopEnd(s, -1);
    moderator(s);
    shieldVault(s);
    calandria(s);
    reactivityDeck(s);
    feedwater(s);
    loopEnd(s, 1);
    pipeBreak(s);
    fuellingMachine(s);
    steamLines(s);
    support(s);
    turbine(s);
    grid(s);
    return s.svg();
  }

  root.PlantScene = { draw, C, CAL };
})(typeof window !== 'undefined' ? window : globalThis);
