/* Small isometric drawing kit. World units are metres, x runs down-right, y down-left, z up.
   Everything is built as an SVG string so a scene of thousands of marks stays one innerHTML write. */
(function (root) {
  const U = 12, CX = Math.cos(Math.PI / 6), SY = 0.5;
  const INK = '#1b2127';
  const P = (x, y, z = 0) => [(x - y) * CX * U, (x + y) * SY * U - z * U];
  const f = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f(p[0])} ${f(p[1])}`;
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const mul = (a, k) => a.map((v) => v * k);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const len = (a) => Math.sqrt(dot(a, a));
  const norm = (a) => mul(a, 1 / (len(a) || 1));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const VIEW = norm([1, 1, 1.15]);

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      const out = k < 0 ? v * (1 + k) : v + (255 - v) * k;
      return Math.max(0, Math.min(255, Math.round(out))).toString(16).padStart(2, '0');
    });
    return '#' + c.join('');
  }

  class Sketch {
    constructor(prefix = 's') { this.out = []; this.defs = []; this.n = 0; this.prefix = prefix; }
    raw(s) { this.out.push(s); return this; }
    open(attrs = '') { this.out.push(`<g ${attrs}>`); return this; }
    close() { this.out.push('</g>'); return this; }
    path(d, attrs) { return this.raw(`<path d="${d}" ${attrs}/>`); }
    /* Closed polygon from world points. */
    face(points, fill, attrs = '') {
      const d = 'M' + points.map((p) => pt(P(...p))).join('L') + 'Z';
      return this.path(d, `fill="${fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" ${attrs}`);
    }
    line(points, attrs) {
      return this.path('M' + points.map((p) => pt(P(...p))).join('L'), `fill="none" stroke-linecap="round" stroke-linejoin="round" ${attrs}`);
    }
    box(x, y, z, dx, dy, dz, color, attrs = '') {
      const X = x + dx, Y = y + dy, Z = z + dz;
      this.open(attrs);
      this.face([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], shade(color, -0.13));
      this.face([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], shade(color, -0.28));
      this.face([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], shade(color, 0.14));
      return this.close();
    }
    /* Cylinder between world points a and b, radius r (and r2 at b for a cone). */
    cyl(a, b, r, color, opt = {}) {
      const r2 = opt.r2 ?? r, axis = norm(sub(b, a));
      const ref = Math.abs(axis[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
      const u = norm(cross(axis, ref)), v = cross(axis, u);
      const ring = (c, rad) => Array.from({ length: 40 }, (_, i) => {
        const t = (i / 40) * Math.PI * 2;
        return P(...add(c, add(mul(u, rad * Math.cos(t)), mul(v, rad * Math.sin(t)))));
      });
      const ra = ring(a, r), rb = ring(b, r2), pa = P(...a), pb = P(...b);
      const d = norm(sub(pb, pa)), n = [-d[1], d[0]];
      const ext = (rg) => {
        let hi = rg[0], lo = rg[0];
        for (const p of rg) { if (dot(p, n) > dot(hi, n)) hi = p; if (dot(p, n) < dot(lo, n)) lo = p; }
        return [hi, lo];
      };
      const [ah, al] = ext(ra), [bh, bl] = ext(rb);
      const id = `${this.prefix}${++this.n}`;
      const dark = shade(color, -0.3), mid = shade(color, -0.1), lite = shade(color, 0.22);
      this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(al[0])}" y1="${f(al[1])}" x2="${f(ah[0])}" y2="${f(ah[1])}">` +
        `<stop offset="0" stop-color="${lite}"/><stop offset=".3" stop-color="${lite}"/><stop offset=".3" stop-color="${color}"/>` +
        `<stop offset=".68" stop-color="${color}"/><stop offset=".68" stop-color="${mid}"/><stop offset=".86" stop-color="${mid}"/>` +
        `<stop offset=".86" stop-color="${dark}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`);
      const nearB = dot(sub(b, a), VIEW) > 0;
      const ringD = (rg) => 'M' + rg.map(pt).join('L') + 'Z';
      const line = `stroke="${INK}" stroke-width="${opt.sw ?? 1.2}"`;
      this.open(opt.attrs || '');
      this.path(ringD(nearB ? ra : rb), `fill="url(#${id})" ${line} ${opt.op ? `opacity="${opt.op}"` : ''}`);
      this.path(`M${pt(ah)}L${pt(bh)}L${pt(bl)}L${pt(al)}Z`, `fill="url(#${id})" ${opt.op ? `opacity="${opt.op}"` : ''}`);
      this.path(`M${pt(ah)}L${pt(bh)}M${pt(al)}L${pt(bl)}`, `fill="none" ${line}`);
      this.path(ringD(nearB ? rb : ra), `fill="${opt.cap ?? lite}" ${line} ${opt.capAttrs ?? ''}`);
      return this.close();
    }
    /* Inked pipe with an optional moving flow stripe. */
    pipe(points, color, opt = {}) {
      const w = opt.w ?? 4, d = 'M' + points.map((p) => pt(P(...p))).join('L');
      const base = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
      this.open(opt.attrs || '');
      this.path(d, `${base} stroke="${INK}" stroke-width="${w + 2.2}"`);
      this.path(d, `${base} stroke="${color}" stroke-width="${w}" class="${opt.colorClass ?? ''}"`);
      if (opt.flow) {
        this.path(d, `${base} stroke="#fff" stroke-opacity=".8" stroke-width="${Math.max(1.4, w * .42)}" stroke-dasharray="3 13" class="flow ${opt.flow}"`);
        this.path(d, `${base} stroke="#fff" stroke-width="${w + 2.4}" stroke-dasharray=".5 47.5" class="flow packet ${opt.flow}"`);
      }
      return this.close();
    }
    svg() { return { defs: this.defs.join(''), body: this.out.join('') }; }
  }

  root.Iso = { Sketch, P, U, INK, shade, f, pt };
})(typeof window !== 'undefined' ? window : globalThis);
