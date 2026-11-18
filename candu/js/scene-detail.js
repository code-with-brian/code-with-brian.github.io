/* Flat and isometric detail drawings for the fuel and core lessons. */
const Detail = (() => {
  const { Sketch, P, shade, INK, pt, f } = Iso;
  const C = { uo2: '#5c5f58', sheath: '#c9cec6', hot: '#e0573c', cold: '#3f7fd9', mod: '#8fc9c6', amber: '#e9b44c', gas: '#eef0e7', ink: INK };
  const W = 900, H = 600;

  const pill = (x, y, part, text, tx, ty, tone = '') => {
    const w = text.length * 7.6 + 18;
    return `<g class="callout ${tone}" data-part="${part}"><path d="M${x} ${y}L${tx} ${ty}"/><g class="pill-body" style="transform-origin:${tx}px ${ty}px"><rect x="${tx - w / 2}" y="${ty - 11}" width="${w}" height="22" rx="11"/><text x="${tx}" y="${ty}">${text}</text></g></g>`;
  };
  const wrap = (s, extra = '') => {
    const { defs, body } = s.svg();
    return `<defs>${defs}</defs><g transform="translate(${W / 2} ${H / 2})">${body}</g>${extra}`;
  };

  const pellets = () => {
    const s = new Sketch('f');
    for (let i = 0; i < 6; i++) s.cyl([-12 + i * 3.1, -1, 2], [-10.2 + i * 3.1, -1, 2], 3.2, C.uo2, { attrs: 'data-part="pellet" class="part"', cap: '#7c8077' });
    return wrap(s, pill(380, 200, 'pellet', 'URANIUM DIOXIDE PELLET', 300, 90, 'gold'));
  };

  const element = () => {
    const s = new Sketch('f');
    s.cyl([-24, 0, 2], [24, 0, 2], 2.4, C.sheath, { op: .55, attrs: 'data-part="element" class="part"', cap: C.sheath });
    for (let i = 0; i < 12; i++) s.cyl([-23 + i * 3.8, 0, 2], [-19.6 + i * 3.8, 0, 2], 2, C.uo2, { sw: .8, cap: '#7c8077', attrs: 'data-part="pellet" class="part"' });
    return wrap(s, pill(600, 380, 'element', 'ZIRCALOY SHEATH', 680, 470, 'cool') + pill(320, 220, 'pellet', 'PELLET STACK', 240, 110, 'gold'));
  };

  const bundlePoints = () => {
    const pts = [[0, 0]];
    [[6, 1], [12, 2], [18, 3]].forEach(([n, ring], k) => {
      for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2 + k * .13; pts.push([ring * Math.cos(t), ring * Math.sin(t)]); }
    });
    return pts;
  };
  const bundle = () => {
    const s = new Sketch('f');
    const pts = bundlePoints().map(([a, b]) => [a * 3.1, b * 3.1 + 2]).sort((a, b) => (a[0] + a[1] * 1.15) - (b[0] + b[1] * 1.15));
    pts.forEach(([y, z]) => s.cyl([-20, y, z], [20, y, z], 1.3, C.sheath, { sw: .8, attrs: 'data-part="bundle" class="part"', cap: '#7c8077' }));
    return wrap(s, pill(520, 170, 'bundle', '37 ELEMENTS', 620, 80, 'gold'));
  };

  const channel = () => {
    const s = new Sketch('f');
    const L = 3.6;
    s.cyl([-L * 6.2, 0, 2], [L * 6.2, 0, 2], 3.9, C.sheath, { op: .45, attrs: 'data-part="pressure-tube" class="part"', cap: C.sheath });
    for (let i = 0; i < 12; i++) {
      const fresh = i < 4;
      s.cyl([-L * 6 + i * L, 0, 2], [-L * 6 + i * L + L * .92, 0, 2], 3.1, fresh ? C.amber : '#7c8077', { sw: .9, attrs: 'data-part="bundle" class="part"', cap: shade(fresh ? C.amber : '#7c8077', .2) });
    }
    return wrap(s, pill(330, 250, 'bundle', '12 BUNDLES', 250, 110, 'gold') + pill(600, 345, 'pressure-tube', 'PRESSURE TUBE', 700, 440));
  };

  const section = () => {
    const cx = 340, cy = 300, ring = (r, fill, part, extra = '') => `<circle class="part" data-part="${part}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="1.6" ${extra}/>`;
    const el = bundlePoints().map(([a, b]) => `<circle class="part" data-part="bundle" cx="${f(cx + a * 60)}" cy="${f(cy + b * 60)}" r="24" fill="#c9cec6" stroke="${INK}" stroke-width="1.2"/><circle cx="${f(cx + a * 60)}" cy="${f(cy + b * 60)}" r="19" fill="#5c5f58"/>`).join('');
    return `<rect class="part" data-part="moderator" x="0" y="0" width="${W}" height="${H}" fill="${C.mod}" opacity=".5"/>` +
      ring(270, '#d9dcd2', 'calandria-tube') + ring(258, C.gas, 'annulus') + ring(226, '#c9cec6', 'pressure-tube') + ring(212, '#f1a08d', 'coolant') + el +
      pill(600, 90, 'moderator', 'MODERATOR, COOL D₂O, ABOUT 70 °C', 660, 60, 'cool') +
      pill(cx + 186, cy - 192, 'calandria-tube', 'CALANDRIA TUBE', 720, 150) +
      pill(cx + 172, cy - 175, 'annulus', 'GAS ANNULUS', 720, 210) +
      pill(cx + 155, cy - 90, 'pressure-tube', 'PRESSURE TUBE', 720, 270) +
      pill(cx + 150, cy + 20, 'coolant', 'COOLANT, HOT D₂O, 9.9 MPa', 700, 340, 'warm') +
      pill(cx + 60, cy + 170, 'bundle', '37-ELEMENT BUNDLE', 700, 410, 'gold');
  };

  /* Core face. Channels are drawn once, then recoloured as burnup changes. */
  function core() {
    const cell = 21, ox = 262, oy = 300;
    const cells = Sim.lattice();
    const rects = cells.map((k, i) => `<rect class="chan" data-i="${i}" x="${f(ox + k.col * cell + 1)}" y="${f(oy + k.row * cell + 1)}" width="${cell - 2}" height="${cell - 2}" rx="2.5"/>`).join('');
    const bundles = Array.from({ length: 12 }, (_, i) => `<rect class="bun" data-b="${i}" x="${582 + i * 21}" y="266" width="19" height="34" rx="4" stroke="${INK}" stroke-width="1.2"/>`).join('');
    return `<circle cx="${ox}" cy="${oy}" r="${11.4 * cell}" fill="#dfe3da" stroke="${INK}" stroke-width="1.6"/>
      <g id="chans">${rects}</g>
      <line id="split" x1="${ox}" x2="${ox}" y1="${oy - 240}" y2="${oy + 240}" stroke="${INK}" stroke-width="3" opacity="0"/>
      <g id="loop-tags" opacity="0"><text x="${ox - 120}" y="${oy - 244}" class="tag">LOOP 1</text><text x="${ox + 120}" y="${oy - 244}" class="tag">LOOP 2</text></g>
      <text x="710" y="200" class="tag" id="side-title">CHANNEL: PICK ONE</text>
      <rect x="574" y="258" width="268" height="50" rx="8" fill="#eef0e7" stroke="${INK}" stroke-width="1.5"/>
      <g id="side-bundles">${bundles}</g>
      <g id="fm-l" class="fm-side"><rect x="520" y="256" width="46" height="54" rx="4" fill="${C.amber}" stroke="${INK}" stroke-width="1.5"/><text x="543" y="288" class="tag" font-size="10">IN</text></g>
      <g id="fm-r" class="fm-side"><rect x="850" y="256" width="46" height="54" rx="4" fill="${C.amber}" stroke="${INK}" stroke-width="1.5"/><text x="873" y="288" class="tag" font-size="10">OUT</text></g>
      <text x="710" y="244" class="tag">FUELLING MACHINES</text>
      <text x="710" y="344" class="tag" id="side-note">Darker means higher burnup</text>
      <g id="legend-burn" transform="translate(600 384)"><rect width="220" height="10" fill="url(#burn)" stroke="${INK}"/><text x="0" y="26" class="tag" text-anchor="start">FRESH</text><text x="220" y="26" class="tag" text-anchor="end">DUE</text></g>
      <g id="legend-flow" transform="translate(600 384)" display="none"><rect width="14" height="14" y="-4" rx="2" fill="${C.hot}" stroke="${INK}"/><text x="20" y="8" class="tag" style="text-anchor:start">TOWARD YOU</text><rect width="14" height="14" y="20" rx="2" fill="${C.cold}" stroke="${INK}"/><text x="20" y="32" class="tag" style="text-anchor:start">AWAY FROM YOU</text></g>
      <defs><linearGradient id="burn"><stop offset="0" stop-color="#f8e9c4"/><stop offset="1" stop-color="#6d3f0d"/></linearGradient></defs>`;
  }

  return { W, H, pellets, element, bundle, channel, section, core };
})();
