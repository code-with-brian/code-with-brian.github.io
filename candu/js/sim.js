/* Plant physics for the tutorial. Pure functions, no DOM, so the numbers can be tested.
   Normalised iodine-xenon model and a standard decay-heat fit. This is a teaching model
   tuned to published CANDU 6 figures. It is not a plant simulator. */
(function (root) {
  const H = 3600;
  const LAMBDA_I = Math.log(2) / (6.6 * H);   // I-135 half-life 6.6 h
  const LAMBDA_XE = Math.log(2) / (9.1 * H);  // Xe-135 half-life 9.1 h
  const BURN = 12.5 * LAMBDA_XE;              // neutron burn-off at full flux, tuned to the published post-trip peak
  const XE_WORTH = 28;                        // mk held by equilibrium xenon at full power
  const ADJUSTER_WORTH = 15;                  // mk, published CANDU 6 design target
  const RESTART_PENALTY = 3;                  // mk spent on the power and temperature change at restart

  function xenonStep(s, power, dt) {
    // Sub-step so that long fast-forwards stay stable.
    let { iodine, xenon } = s;
    const n = Math.max(1, Math.ceil(dt / 60));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const dI = LAMBDA_I * (power - iodine);
      const dX = (LAMBDA_XE + BURN) * (0.95 * iodine + 0.05 * power) - LAMBDA_XE * xenon - BURN * power * xenon;
      iodine += dI * h;
      xenon += dX * h;
    }
    return { iodine, xenon };
  }

  /* Xenon load after a trip from equilibrium full power, in mk above the operating load. */
  const xenonLoad = (xenon) => (xenon - 1) * XE_WORTH;

  /* mk of positive reactivity the adjusters can still offer once restart costs are paid. */
  const overrideMargin = (xenon) => ADJUSTER_WORTH - RESTART_PENALTY - xenonLoad(xenon);

  /* Fraction of full power from decay heat, t seconds after shutdown (Way-Wigner fit, 1 year at power). */
  function decayHeat(t, operating = 365 * 24 * H) {
    const s = Math.max(t, 1);
    return 0.0622 * (Math.pow(s, -0.2) - Math.pow(s + operating, -0.2));
  }

  /* Find when poison-out happens and how the post-trip curve behaves. */
  function tripProfile(hours = 60, step = 60) {
    let s = { iodine: 1, xenon: 1 };
    let override = null, peak = { t: 0, xenon: 1 }, back = null;
    const curve = [];
    for (let t = 0; t <= hours * H; t += step) {
      if (override === null && overrideMargin(s.xenon) <= 0) override = t;
      if (s.xenon > peak.xenon) peak = { t, xenon: s.xenon };
      if (back === null && t > peak.t + H && t > 2 * H && overrideMargin(s.xenon) > 0) back = t;
      if (t % (10 * 60) === 0) curve.push({ h: t / H, mk: xenonLoad(s.xenon) });
      s = xenonStep(s, 0, step);
    }
    return { override, peak, back, curve };
  }

  /* 380 fuel channels on a square lattice clipped to a circle. Returns [{col,row}] in lattice units. */
  function lattice(R = 11) {
    const cells = [];
    for (let row = -11; row < 11; row++) for (let col = -11; col < 11; col++) {
      const x = col + 0.5, y = row + 0.5;
      // A true circle gives 384 sites. The real face is not a perfect circle, so four
      // corner sites go, which leaves 380 channels and a 190/190 split between the loops.
      if (x * x + y * y > R * R) continue;
      if (Math.abs(x) === 9.5 && Math.abs(y) === 5.5) continue;
      cells.push({ col, row, x, y });
    }
    return cells;
  }

  const api = { H, LAMBDA_I, LAMBDA_XE, BURN, XE_WORTH, ADJUSTER_WORTH, RESTART_PENALTY,
    xenonStep, xenonLoad, overrideMargin, decayHeat, tripProfile, lattice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sim = api;
})(typeof window !== 'undefined' ? window : globalThis);
