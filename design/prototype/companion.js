// <dusk-buddy size="48" mood="calm|happy|wave|nod|think|sleepy|plain" form="sun|max|nhang|banhbao|giot|hac">
// Canvas 2D port of apps/mobile/src/ui/companion (Skia) — same drawing code, same numbers.
(function () {
  if (customElements.get('dusk-buddy')) return;
  const INK = '#3a1d2a', GOLD = '#ffd36e', PI = Math.PI;
  const FORMS = ['sun', 'max', 'nhang', 'banhbao', 'giot', 'hac'];
  let X = null, LA = 1; // current 2D context, layer alpha

  // ---- Skia shim ----
  const deg = (r) => (r * 180) / PI;
  const fill = (fr, c, a = 1) => ({ f: 1, c, a });
  const stroke = (fr, c, w, a = 1) => ({ f: 0, c, w, a });
  const linear = (fr, k, x0, y0, x1, y1, colors, stops) => ({ x0, y0, x1, y1, colors, stops });
  const unitGradient = (fr, k, colors, stops) => linear(fr, k, 0, 0, 0, 1, colors, stops);
  const radial = (fr, x, y, r, colors, stops) => ({ rad: 1, x, y, r, colors, stops });
  const fillShader = (fr, sh) => ({ f: 1, sh, a: 1 });
  const strokeShader = (fr, sh, w) => ({ f: 0, sh, w, a: 1 });
  const oval = (fr, x, y, rx, ry) => ({ x: x - rx, y: y - ry, width: rx * 2, height: ry * 2 });
  const box = (fr, x, y, width, height) => ({ x, y, width, height });
  function pathBuilder() {
    let p = new Path2D();
    const b = {
      moveTo(x, y) { p.moveTo(x, y); return b; }, lineTo(x, y) { p.lineTo(x, y); return b; },
      quadTo(a, c, x, y) { p.quadraticCurveTo(a, c, x, y); return b; },
      cubicTo(a, c, d, e, x, y) { p.bezierCurveTo(a, c, d, e, x, y); return b; },
      close() { p.closePath(); return b; }, build() { return p; }, reset() { p = new Path2D(); return b; },
    };
    return b;
  }
  function paint(p, path) {
    const c = X; c.globalAlpha = LA * p.a;
    let st = p.c;
    if (p.sh) { const g = p.sh.rad ? c.createRadialGradient(p.sh.x, p.sh.y, 0, p.sh.x, p.sh.y, p.sh.r) : c.createLinearGradient(p.sh.x0, p.sh.y0, p.sh.x1, p.sh.y1); p.sh.colors.forEach((col, i) => g.addColorStop(p.sh.stops[i], col)); st = g; }
    if (p.f) { c.fillStyle = st; c.fill(path); } else { c.strokeStyle = st; c.lineWidth = p.w; c.stroke(path); }
  }
  const canvas = {
    save() { X.save(); }, restore() { X.restore(); },
    translate(x, y) { X.translate(x, y); }, scale(x, y) { X.scale(x, y); },
    rotate(d, px = 0, py = 0) { X.translate(px, py); X.rotate((d * PI) / 180); X.translate(-px, -py); },
    clipPath(path) { X.clip(path); },
    drawPath(path, p) { paint(p, path); },
    drawOval(r, p) { const q = new Path2D(); q.ellipse(r.x + r.width / 2, r.y + r.height / 2, Math.abs(r.width / 2), Math.abs(r.height / 2), 0, 0, PI * 2); paint(p, q); },
    drawCircle(x, y, r, p) { const q = new Path2D(); q.arc(x, y, Math.max(0, r), 0, PI * 2); paint(p, q); },
    drawLine(a, b, c, d, p) { const q = new Path2D(); q.moveTo(a, b); q.lineTo(c, d); paint(p, q); },
    drawRect(r, p) { const q = new Path2D(); q.rect(r.x, r.y, r.width, r.height); paint(p, q); },
    drawArc(r, start, sweep, useCenter, p) { const q = new Path2D(); const a0 = (start * PI) / 180, a1 = ((start + sweep) * PI) / 180; q.ellipse(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, r.height / 2, 0, a0, a1, sweep < 0); paint(p, q); },
    drawText(t, x, y, p, font) { X.globalAlpha = LA * p.a; X.fillStyle = p.c; X.font = 'italic ' + font.size + 'px Georgia, serif'; X.fillText(t, x, y); },
  };
  function jitter(fr, i, amount) { const x = Math.sin(i * 127.1 + fr.tick * 311.7 + fr.seed) * 43758.5453; return (x - Math.floor(x) - 0.5) * 2 * amount * fr.s; }
  function ellipse(cv, fr, x, y, rx, ry, rot, ...ps) { if (rot !== 0) { cv.save(); cv.rotate(deg(rot), x, y); } for (const p of ps) cv.drawOval(oval(fr, x, y, rx, ry), p); if (rot !== 0) cv.restore(); }

  // ---- shape ----
  const BODY = { sun: { rx: 0.3, ry: 0.28, ground: 0.85, breath: 1 }, max: { rx: 0.3, ry: 0.28, ground: 0.85, breath: 1 }, nhang: { rx: 0.31, ry: 0.25, ground: 0.85, breath: 0.8 }, banhbao: { rx: 0.335, ry: 0.235, ground: 0.865, breath: 1.9 }, giot: { rx: 0.265, ry: 0.255, ground: 0.885, breath: 1.2 }, hac: { rx: 0.27, ry: 0.26, ground: 0.875, breath: 0.6 } };
  function jiggle(t, speed) { if (t < 0 || t > 1.6) return 0; return Math.sin(t * speed) * Math.exp(-t * 3.4); }
  function splitPhase(el) { const t = (el % 3.6) / 3.6; return t < 0.45 ? t / 0.45 : -1; }
  function puddleOf(el) { const w = 0.5 - 0.5 * Math.cos(((el % 7) / 7) * PI * 2); return w * w * (3 - 2 * w); }
  const hopLift = (el) => Math.abs(Math.sin(el * 5.2));
  function squashOf(form, mood, el, since, sinceF) {
    if (mood === 'plain') return 0;
    if (form === 'banhbao') { let q = jiggle(since, 17) * 0.1 + jiggle(sinceF, 15) * 0.14; if (mood === 'happy') { const l = hopLift(el); q += 0.1 * (1 - Math.min(1, l * 4)) - 0.05 * l; } if (mood === 'sleepy') q += 0.05 + Math.sin(el * 1.4) * 0.04; if (mood === 'nod') q += Math.max(0, Math.sin(el * 2.6)) * 0.09; return q; }
    if (form === 'giot') { let q = Math.sin(el * 6.2) * 0.022 + jiggle(since, 19) * 0.09 + jiggle(sinceF, 16) * 0.12; if (mood === 'happy') { const l = hopLift(el); q += 0.08 * (1 - Math.min(1, l * 5)) - 0.04 * l; } if (mood === 'sleepy') q += 0.34 * puddleOf(el); return q; }
    return 0;
  }
  function shrinkOf(form, mood, el) { if (form !== 'giot' || mood !== 'happy') return 1; const p = splitPhase(el); return p < 0 ? 1 : 1 - 0.2 * Math.sin(p * PI); }
  function makeFrame({ s, el, since, sinceF, mood, form, seed }) {
    const plain = mood === 'plain', shown = plain ? 'sun' : form, body = BODY[shown];
    const breathe = (mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02) * body.breath;
    let hop = 0, tilt = 0;
    if (mood === 'happy') hop = -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025);
    if (mood === 'nod') tilt = Math.sin(el * 2.6) * 0.08;
    if (mood === 'think') tilt = -0.07;
    if (mood === 'wave') tilt = Math.sin(el * 2) * 0.03;
    const squash = squashOf(shown, mood, el, since, sinceF), shrink = shrinkOf(shown, mood, el);
    const rx = s * body.rx * (1 + squash) * shrink, ry = s * body.ry * (1 + breathe) * (1 - squash) * shrink;
    const sun = shown === 'sun' || shown === 'max';
    const cy = sun ? s * 0.57 + hop - breathe * s * 0.1 : s * body.ground - ry + hop;
    return { s, el, since, sinceF, mood, plain, form: shown, mx: shown === 'max', lw: Math.max(1.3, s * 0.034), cx: s / 2, cy, rx, ry, hz: cy + ry * 0.3, hop, tilt, seed, tick: Math.floor(el * 6) };
  }

  // ---- max ----
  function drawStar(cv, fr, x, y, r, color) { const k = r * 0.32, b = pathBuilder(fr); b.moveTo(x, y - r).lineTo(x + k, y - k).lineTo(x + r, y).lineTo(x + k, y + k).lineTo(x, y + r).lineTo(x - k, y + k).lineTo(x - r, y).lineTo(x - k, y - k); const st = b.close().build(); cv.drawPath(st, fill(fr, color)); cv.drawPath(st, stroke(fr, INK, fr.lw * 0.5)); }
  function drawRing(cv, fr, front) {
    const { s, cx, cy, rx, ry, lw, el } = fr, RX = rx * 1.55, RY = ry * 0.4;
    cv.save(); cv.translate(cx, cy + ry * 0.05); cv.rotate(deg(-0.28), 0, 0);
    cv.drawArc(oval(fr, 0, 0, RX, RY), front ? 0 : 180, 180, false, strokeShader(fr, linear(fr, '', -RX, 0, RX, 0, [GOLD, '#ff9fd0', '#9d8bff'], [0, 0.5, 1]), lw * 1.35));
    const o = stroke(fr, INK, lw * 0.6);
    for (let n = 0; n < 2; n++) { const a = el * 1.1 + n * PI, sn = Math.sin(a); if (sn > 0 !== front) continue; const x = Math.cos(a) * RX, y = sn * RY, r = s * (n ? 0.024 : 0.032); cv.drawCircle(x, y, r, fill(fr, n ? '#c9b8ff' : '#fff1c4')); cv.drawCircle(x, y, r, o); }
    cv.restore();
  }
  function drawBurst(cv, fr) { if (!fr.mx || fr.sinceF < 0 || fr.sinceF >= 1.4) return; const { s, lw } = fr, p = fr.sinceF / 1.4, f = 1 - p; cv.drawCircle(s / 2, s * 0.57, s * (0.16 + p * 0.34), stroke(fr, GOLD, lw * 2.2 * f + 0.5, f)); cv.drawCircle(s / 2, s * 0.55, s * 0.5, fill(fr, '#fff0d2', 0.6 * f * f * f)); }

  // ---- body ----
  function drawGroundShadow(cv, fr) { const { s, cx, rx, hop } = fr; ellipse(cv, fr, cx, s * 0.92, rx * (0.85 + hop / s), s * 0.03, 0, fill(fr, 'rgba(30,10,30,0.16)')); }
  function drawFeet(cv, fr) { const { s, cx, cy, ry, lw } = fr; const color = fr.plain ? '#8d848a' : fr.mx ? '#5a46c0' : fr.form === 'nhang' ? '#e9b949' : '#9b3f5f'; [-1, 1].forEach((k, n) => ellipse(cv, fr, cx + k * s * 0.11 + jitter(fr, 90 + n, 0.003), cy + ry * 0.98, s * 0.062, s * 0.034, 0, fill(fr, color), stroke(fr, INK, lw * 0.85))); }
  const ARMS = { sun: '#ffb27c', max: '#ffc1d8', nhang: '#a9dcc6', banhbao: '#f9e9d2', giot: '#9fd8f7' };
  function drawArm(cv, fr, side, up, wave = false) {
    const { s, cx, cy, rx, ry, lw } = fr, ax = cx + side * rx * (up ? 0.92 : 1.02), ay = up ? cy - ry * 0.32 : cy + ry * 0.18;
    const rot = wave ? side * (-1.1 + Math.sin(fr.el * 9) * 0.45) : side * (up ? -0.9 : 0.35);
    cv.save(); cv.translate(ax, ay); cv.rotate(deg(rot), 0, 0);
    ellipse(cv, fr, 0, up ? -s * 0.03 : 0, s * 0.045, s * 0.07, 0, fill(fr, fr.plain ? '#d6cec9' : ARMS[fr.form] || '#ffb27c'), stroke(fr, INK, lw * 0.85));
    cv.restore();
  }
  function drawArmsBehind(cv, fr) { if (fr.mood === 'happy' || fr.mood === 'wave') return; drawArm(cv, fr, -1, false); drawArm(cv, fr, 1, false); }
  function drawArmsInFront(cv, fr) { if (fr.mood === 'happy') { drawArm(cv, fr, -1, true); drawArm(cv, fr, 1, true); } else if (fr.mood === 'wave') { drawArm(cv, fr, -1, false); drawArm(cv, fr, 1, true, true); } }
  function bodyPath(fr) {
    const { cx, cy, rx, ry } = fr, N = 22, xs = [], ys = [];
    for (let i = 0; i < N; i++) { const a = (i / N) * PI * 2, sn = Math.sin(a); xs.push(cx + Math.cos(a) * rx * (1 + 0.07 * Math.max(0, sn)) + jitter(fr, i, 0.0045)); ys.push(cy + sn * ry * (sn > 0 ? 0.96 : 1.04) + jitter(fr, i + 40, 0.0045)); }
    const x = (i) => xs[(i + N) % N], y = (i) => ys[(i + N) % N], p = pathBuilder(fr);
    p.moveTo((x(-1) + x(0)) / 2, (y(-1) + y(0)) / 2);
    for (let i = 0; i < N; i++) p.quadTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2);
    return p.close().build();
  }
  function wavePath(fr, below) {
    const { s, hz, el } = fr, sea = fr.cy + fr.ry - hz, p = pathBuilder(fr);
    if (below) p.moveTo(0, 0);
    for (let i = 0; i <= 24; i++) { const x = (i * s) / 24, rise = Math.sin((x / s) * 14 + el * 2.4) * s * 0.008; if (below) p.lineTo(x, rise / sea); else if (i === 0) p.moveTo(x, hz + rise); else p.lineTo(x, hz + rise); }
    if (below) { p.lineTo(s, (s - hz) / sea); p.lineTo(0, (s - hz) / sea); p.close(); }
    return p.build();
  }
  const SKY = { plain: [['#ece6e1', '#cfc6c0'], [0, 1]], max: [['#fff1c4', '#ffa8c8', '#b48cff'], [0, 0.5, 1]], base: [['#ffe2a6', '#ffb070', '#ff8a5c'], [0, 0.55, 1]] };
  const SEA = { plain: ['#a79ea4', '#8d848a'], max: ['#5a46c0', '#241a6e'], base: ['#e8607a', '#a8406c'] };
  function fillGradient(cv, fr, key, colors, stops, top, bottom) { const L = bottom - top; cv.save(); cv.translate(0, top); cv.scale(1, L); cv.drawRect(box(fr, 0, -top / L, fr.s, fr.s / L), fillShader(fr, unitGradient(fr, key, colors, stops))); cv.restore(); }
  function drawSeaLights(cv, fr) {
    const { s, cx, cy, rx, ry, hz, el, lw } = fr, sea = cy + ry - hz;
    if (!fr.plain) { const g = stroke(fr, 'rgba(255,225,200,0.75)', lw * 0.55); [[0.12, 0.55, 0.07], [-0.14, 0.72, 0.05], [0.05, 0.86, 0.04]].forEach(([ox, oy, w], n) => { const gx = cx + ox * s + Math.sin(el * 1.6 + n) * s * 0.01, gy = hz + sea * oy - s * 0.02; cv.drawLine(gx - (w * s) / 2, gy, gx + (w * s) / 2, gy, g); }); }
    if (fr.mx) [[0.36, 0.3], [0.6, 0.55], [0.46, 0.8], [0.7, 0.25]].forEach(([px, py], n) => cv.drawCircle(cx - rx + px * rx * 2, hz + sea * py, s * 0.009, fill(fr, '#fff0ff', 0.4 + 0.6 * Math.abs(Math.sin(el * 2.2 + n * 1.7)))));
  }
  function drawBody(cv, fr) {
    const { s, cx, cy, rx, ry, hz, lw } = fr, body = bodyPath(fr), v = fr.plain ? 'plain' : fr.mx ? 'max' : 'base';
    cv.save(); cv.clipPath(body);
    fillGradient(cv, fr, '', SKY[v][0], SKY[v][1], cy - ry, hz);
    cv.save(); cv.translate(0, hz); cv.scale(1, cy + ry - hz); cv.drawPath(wavePath(fr, true), fillShader(fr, unitGradient(fr, '', SEA[v], [0, 1]))); cv.restore();
    cv.drawPath(wavePath(fr, false), stroke(fr, fr.plain ? 'rgba(60,50,60,0.35)' : 'rgba(90,20,50,0.45)', lw * 0.6));
    drawSeaLights(cv, fr);
    const sh = fill(fr, 'rgba(255,255,255,0.55)');
    ellipse(cv, fr, cx - rx * 0.48, cy - ry * 0.58, s * 0.05, s * 0.025, -0.6, sh); cv.drawCircle(cx - rx * 0.22, cy - ry * 0.78, s * 0.011, sh);
    cv.restore();
    cv.drawPath(body, stroke(fr, INK, lw));
  }
  function drawRays(cv, fr) {
    if (fr.plain) return;
    const { s, cx, cy, rx, ry, lw, el, mood } = fr, pulse = mood === 'happy' ? 1.25 + Math.sin(el * 8) * 0.12 : mood === 'sleepy' ? 0.7 : 1;
    const rays = fr.mx ? [-1.12, -0.56, 0, 0.56, 1.12] : [-0.62, 0, 0.62], line = stroke(fr, INK, lw * 1.05);
    rays.forEach((ra, n) => {
      const a = -PI / 2 + ra + Math.sin(el * 1.8 + n) * 0.05, mid = n === (rays.length - 1) / 2, r0 = 1.12, r1 = 1.12 + (mid ? 0.38 : 0.28) * pulse, co = Math.cos(a), si = Math.sin(a);
      cv.drawLine(cx + co * rx * r0 + jitter(fr, 70 + n, 0.004), cy + si * ry * r0, cx + co * rx * r1 + jitter(fr, 75 + n, 0.006), cy + si * ry * r1 + jitter(fr, 78 + n, 0.006), line);
      if (fr.mx) drawStar(cv, fr, cx + co * rx * (r1 + 0.1), cy + si * ry * (r1 + 0.1), s * (mid ? 0.05 : 0.036) * (0.85 + Math.sin(el * 4 + n) * 0.15), GOLD);
    });
  }

  // ---- face ----
  const MOUTH = '#6e2236';
  const winking = (fr, n) => fr.form === 'giot' && n === 0 && fr.mood === 'calm' && fr.el % 6.5 > 6.05;
  const blinking = (fr) => (fr.mood === 'calm' || fr.mood === 'think' || fr.mood === 'wave') && fr.el % 4.1 > 3.96;
  const arc = (cv, fr, x, y, r, a0, a1, p) => cv.drawArc(oval(fr, x, y, r, r), deg(a0), deg(a1 - a0), false, p);
  function drawFace(cv, fr) {
    const { s, cx, cy, ry, lw, mood } = fr;
    if (!fr.plain) { const b = fill(fr, fr.form === 'hac' ? 'rgba(255,214,190,0.55)' : 'rgba(255,92,120,0.42)'); ellipse(cv, fr, cx - s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, b); ellipse(cv, fr, cx + s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, b); }
    const ey = cy - ry * 0.2, closed = mood === 'nod' || mood === 'sleepy' || blinking(fr), lx = mood === 'think' ? s * 0.012 : 0, ly = mood === 'think' ? -s * 0.014 : 0;
    const line = stroke(fr, INK, lw), ink = fill(fr, INK), white = fill(fr, '#ffffff');
    [-1, 1].forEach((k, n) => {
      const x = cx + k * s * 0.1 + jitter(fr, 95 + n, 0.002);
      if (mood === 'happy') arc(cv, fr, x, ey + s * 0.022, s * 0.038, PI * 1.12, PI * 1.88, line);
      else if (closed || winking(fr, n)) arc(cv, fr, x, ey - s * 0.012, s * 0.034, PI * 0.15, PI * 0.85, line);
      else if (fr.plain) cv.drawCircle(x, ey, s * 0.026, ink);
      else { ellipse(cv, fr, x, ey, s * 0.037, s * 0.047, 0, ink); cv.drawCircle(x + s * 0.011 + lx, ey - s * 0.015 + ly, s * 0.014, white); cv.drawCircle(x - s * 0.01 + lx, ey + s * 0.016 + ly, s * 0.006, white); }
    });
    const my = cy + ry * 0.1;
    if (mood === 'happy') { const m = pathBuilder(fr).moveTo(cx - s * 0.05, my - s * 0.005).quadTo(cx, my + s * 0.085, cx + s * 0.05, my - s * 0.005).close().build(); cv.drawPath(m, fill(fr, MOUTH)); cv.drawPath(m, line); cv.save(); cv.clipPath(m); ellipse(cv, fr, cx, my + s * 0.055, s * 0.03, s * 0.02, 0, fill(fr, '#ff7f96')); cv.restore(); }
    else if (fr.plain) cv.drawLine(cx - s * 0.03, my + s * 0.01, cx + s * 0.03, my + s * 0.01, line);
    else if (mood === 'sleepy' || mood === 'think') ellipse(cv, fr, cx + (mood === 'think' ? s * 0.02 : 0), my + s * 0.012, s * 0.014, s * 0.018, 0, fill(fr, MOUTH));
    else cv.drawPath(pathBuilder(fr).moveTo(cx - s * 0.035, my).quadTo(cx, my + s * 0.04, cx + s * 0.035, my).build(), line);
  }

  // ---- extras ----
  function drawExtras(cv, fr) {
    const { s, lw, el } = fr;
    if (fr.mood === 'happy' || fr.mx || (fr.form === 'hac' && fr.mood !== 'sleepy')) {
      const g = fill(fr, GOLD), o = stroke(fr, INK, lw * 0.6);
      for (const [px, py, ph] of [[0.14, 0.2, 0], [0.86, 0.28, 1.3], [0.8, 0.08, 2.4]]) {
        const r = s * 0.045 * Math.max(0, Math.sin(el * 3 + ph)); if (r < 0.5) continue;
        const x = px * s, y = py * s, k = r * 0.35;
        const t = pathBuilder(fr).moveTo(x, y - r).lineTo(x + k, y).lineTo(x, y + r).lineTo(x - k, y).close().build();
        const w = pathBuilder(fr).moveTo(x - r, y).lineTo(x, y + k).lineTo(x + r, y).lineTo(x, y - k).close().build();
        cv.drawPath(t, g); cv.drawPath(t, o); cv.drawPath(w, g); cv.drawPath(w, o);
      }
    }
    if (fr.form === 'nhang') return;
    if (fr.mood === 'sleepy') { const ph = (el * 0.5) % 1, p = fill(fr, '#c9b8ff', Math.sin(ph * PI)); cv.drawText('z', s * (0.74 + ph * 0.08), s * (0.3 - ph * 0.14), p, { size: Math.round(s * 0.2) }); cv.drawText('z', s * (0.86 + ph * 0.05), s * (0.16 - ph * 0.1), p, { size: Math.round(s * 0.13) }); }
    if (fr.mood === 'think' && fr.form !== 'giot' && fr.form !== 'hac') { const c = fill(fr, 'rgba(255,255,255,0.85)'), o = stroke(fr, INK, lw * 0.6); [[0.78, 0.3, 0.025], [0.86, 0.18, 0.04]].forEach(([px, py, r], n) => { const y = py * s - Math.sin(el * 2 + n) * s * 0.01; cv.drawCircle(px * s, y, r * s, c); cv.drawCircle(px * s, y, r * s, o); }); }
  }

  // ---- nhang ----
  const SMOKE = '#a99cbc', GOLD2 = '#f2c45a';
  const rimY = (fr) => fr.cy - fr.ry * 0.78, rimHalf = (fr) => fr.rx * 0.86;
  function ribbonX(fr, n, t, tipX) { const { s, cx, el, mood } = fr; if (mood === 'sleepy') return t * t * s * 0.13 + Math.sin(t * 4 - el * 0.8 + n) * s * 0.01 * t; return (cx - tipX) * 0.7 * t * t + Math.sin(t * 6.5 - el * 1.7 + n * 2.1) * s * 0.022 * (0.3 + t); }
  function drawRibbon(cv, fr, n, x, y, rise) {
    const h = fr.s * 0.2, p = pathBuilder(fr); p.moveTo(0, 0);
    let px = ribbonX(fr, n, 0, x), py = 0;
    for (let i = 1; i <= 12; i++) { const t = (i / 12) * rise, nx = ribbonX(fr, n, t, x), ny = -t * h; if (i === 1) p.lineTo((px + nx) / 2, (py + ny) / 2); else p.quadTo(px, py, (px + nx) / 2, (py + ny) / 2); px = nx; py = ny; }
    p.lineTo(px, py);
    cv.save(); cv.translate(x, y); cv.drawPath(p.build(), strokeShader(fr, linear(fr, '', 0, 0, 0, -h, ['rgba(169,156,188,0.95)', 'rgba(169,156,188,0)'], [0, 1]), Math.max(0.9, fr.lw * 0.6))); cv.restore();
  }
  function drawHeart(cv, fr, x, y) { const { s, el, lw } = fr, p = (el % 2.2) / 2.2, r = s * 0.042 * (0.75 + 0.45 * p), cx = x + Math.sin(p * 6) * s * 0.01, cy = y - s * 0.09 - p * s * 0.06, a = Math.min(1, p * 5) * Math.pow(1 - p, 1.2); const h = pathBuilder(fr).moveTo(cx, cy + r).cubicTo(cx - r * 1.1, cy + r * 0.25, cx - r * 0.75, cy - r * 0.75, cx, cy - r * 0.2).cubicTo(cx + r * 0.75, cy - r * 0.75, cx + r * 1.1, cy + r * 0.25, cx, cy + r); cv.drawPath(h.build(), stroke(fr, SMOKE, lw * 0.7 * (1 - 0.5 * p), a)); }
  function drawQuestion(cv, fr, x, y) { const { s, el, lw } = fr, r = s * 0.045, sw = Math.sin(el * 1.5) * r * 0.25, cx = x + s * 0.015, cy = y - s * 0.1; const m = pathBuilder(fr).moveTo(cx - r * 0.55, cy - r * 0.45).cubicTo(cx - r * 0.55, cy - r * 1.15, cx + r * 0.65, cy - r * 1.2, cx + r * 0.6, cy - r * 0.45).cubicTo(cx + r * 0.55 + sw, cy, cx + sw, cy - r * 0.05, cx, cy + r * 0.45); const a = 0.7 + 0.25 * Math.sin(el * 2); cv.drawPath(m.build(), stroke(fr, SMOKE, lw * 0.75, a)); cv.drawCircle(cx, cy + r * 0.95, r * 0.13, fill(fr, SMOKE, a)); }
  function drawSleepZ(cv, fr, x, y) { const { s, el, lw } = fr; for (let k = 0; k < 2; k++) { const p = (el * 0.33 + k * 0.5) % 1, z = s * (0.03 + 0.022 * p), zx = x + s * (0.1 + p * 0.22), zy = y - s * 0.02 - p * s * 0.16; cv.drawPath(pathBuilder(fr).moveTo(zx - z, zy - z).lineTo(zx + z, zy - z).lineTo(zx - z, zy + z).lineTo(zx + z, zy + z).build(), stroke(fr, SMOKE, lw * 0.6, Math.sin(p * PI) * 0.9)); } }
  function drawSticks(cv, fr) {
    const { s, cx, el, lw, mood } = fr, top = rimY(fr), half = rimHalf(fr);
    [-0.34, 0, 0.34].forEach((st, n) => {
      const mid = n === 1;
      let a = st * (mood === 'sleepy' ? 1.4 : 1) + Math.sin(el * 1.1 + n * 1.7) * 0.035;
      if (mood === 'wave' && n === 2) a = 0.55 + Math.sin(el * 8) * 0.45; // the right stick waves hello
      if (mood === 'nod') a += Math.max(0, Math.sin(el * 2.6)) * 0.28; // all three bow together
      if (mood === 'happy') a += Math.sin(el * 5.2 + n) * 0.08;
      const len = s * (mid ? 0.2 : 0.165), bx = cx + (n - 1) * half * 0.32, by = top + s * 0.008, tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len;
      const shaped = mid && (mood === 'happy' || mood === 'think');
      drawRibbon(cv, fr, n, tx, ty, mood === 'sleepy' ? 0.55 : shaped ? 0.4 : 1);
      const w = Math.max(1, lw * 0.62), hx = bx + (tx - bx) * 0.35, hy = by + (ty - by) * 0.35;
      cv.drawLine(bx, by, hx, hy, stroke(fr, '#c23b32', w)); cv.drawLine(hx, hy, tx, ty, stroke(fr, '#7a4a33', w));
      const br = 0.5 + 0.5 * Math.sin(el * 1.3 + n * 0.4), glow = mood === 'sleepy' ? 0.15 + br * 0.3 : mood === 'happy' ? 1 : br;
      cv.drawCircle(tx, ty, s * (0.026 + 0.012 * glow), fill(fr, '#ffb36b', 0.2 + 0.3 * glow)); cv.drawCircle(tx, ty, s * 0.013, fill(fr, '#ff7a2f')); cv.drawCircle(tx, ty, s * 0.006, fill(fr, '#ffe2b8', 0.3 + 0.7 * glow));
      if (mood === 'happy') for (let k = 0; k < 3; k++) { const p = (el * 1.1 + k / 3 + n * 0.21) % 1; cv.drawCircle(tx + Math.sin(p * 9 + k * 2 + n) * s * 0.022, ty - s * 0.01 - p * s * 0.13, s * 0.009 * (1 - p) + 0.4, fill(fr, '#ffd27a', 1 - p)); }
      if (mood === 'calm' && n === 0) { const p = (el % 5.5) / 1.1; if (p < 1) ellipse(cv, fr, tx + Math.sin(p * 7) * s * 0.012, ty + p * (top - ty), s * 0.008, s * 0.005, p * 3, fill(fr, '#cfc6c0', 1 - p * 0.3)); }
      if (!mid) return;
      if (mood === 'happy') drawHeart(cv, fr, tx, ty); if (mood === 'think') drawQuestion(cv, fr, tx, ty); if (mood === 'sleepy') drawSleepZ(cv, fr, tx, ty);
    });
  }
  function drawHandles(cv, fr) { const { s, cx, cy, rx, ry, lw } = fr; [-1, 1].forEach((k) => { const x = cx + k * rx * 1.04, y = cy - ry * 0.32, r = s * 0.034; cv.drawCircle(x, y, r, stroke(fr, INK, lw * 1.7)); cv.drawCircle(x, y, r, stroke(fr, GOLD2, lw * 0.75)); }); }
  function drawUrn(cv, fr) {
    const { s, cx, cy, rx, ry, lw } = fr, top = rimY(fr), half = rimHalf(fr);
    const urn = pathBuilder(fr).moveTo(cx - half, top).cubicTo(cx - rx * 1.18, cy - ry * 0.25, cx - rx * 1.02, cy + ry * 0.92, cx - rx * 0.42, cy + ry).lineTo(cx + rx * 0.42, cy + ry).cubicTo(cx + rx * 1.02, cy + ry * 0.92, cx + rx * 1.18, cy - ry * 0.25, cx + half, top).close().build();
    cv.save(); cv.clipPath(urn);
    fillGradient(cv, fr, '', ['#dcf5e8', '#97d3b9', '#4f9481'], [0, 0.5, 1], top, cy + ry);
    const band = cy + ry * 0.5;
    for (let i = -3; i <= 3; i++) { const x = cx + i * rx * 0.3, w = rx * 0.15; const pt = pathBuilder(fr).moveTo(x - w, band).quadTo(x, band - s * 0.065, x + w, band).close().build(); cv.drawPath(pt, fill(fr, GOLD2, 0.35)); cv.drawPath(pt, stroke(fr, GOLD2, lw * 0.55)); }
    cv.drawLine(cx - rx * 1.2, band, cx + rx * 1.2, band, stroke(fr, GOLD2, lw * 1.05)); cv.drawLine(cx - rx * 1.2, band + lw * 1.5, cx + rx * 1.2, band + lw * 1.5, stroke(fr, GOLD2, lw * 0.4));
    ellipse(cv, fr, cx - rx * 0.55, cy - ry * 0.3, s * 0.045, s * 0.022, -0.7, fill(fr, 'rgba(255,255,255,0.55)')); cv.drawCircle(cx - rx * 0.32, cy - ry * 0.52, s * 0.009, fill(fr, 'rgba(255,255,255,0.6)'));
    cv.restore();
    cv.drawPath(urn, stroke(fr, INK, lw));
    ellipse(cv, fr, cx, top, half * 1.08, s * 0.042, 0, fill(fr, GOLD2), stroke(fr, INK, lw * 0.85));
    ellipse(cv, fr, cx, top - s * 0.003, half * 0.86, s * 0.022, 0, fill(fr, '#ddd5cc'));
    [[-0.45, 0.004], [0.5, -0.004], [0.15, 0.008]].forEach(([ox, oy]) => cv.drawCircle(cx + ox * half, top + oy * s, s * 0.0045, fill(fr, '#9a9096')));
  }
  function drawSmokeRing(cv, fr) { const { s, cx, lw } = fr; for (let k = 0; k < 2; k++) { const t = fr.sinceF - k * 0.3; if (t < 0 || t >= 1.8) continue; const p = t / 1.8, r = s * (0.14 + 0.16 * p); ellipse(cv, fr, cx, rimY(fr) - p * s * 0.42, r, r * 0.28, 0, stroke(fr, SMOKE, lw * (1.4 - 0.9 * p), Math.pow(1 - p, 1.3) * 0.9)); } }
  function drawNhang(cv, fr) { drawFeet(cv, fr); drawArmsBehind(cv, fr); drawHandles(cv, fr); drawUrn(cv, fr); drawSticks(cv, fr); drawArmsInFront(cv, fr); drawFace(cv, fr); }

  // ---- banh bao ----
  const STEAM_EDGE = '#cfc3b8', BP = 24;
  function eX(fr, i) { const a = (i / BP) * PI * 2, sn = Math.sin(a); return fr.cx + Math.cos(a) * fr.rx * (sn > 0 ? 1.04 : 1) + jitter(fr, i, 0.004); }
  function eY(fr, i) { const a = (i / BP) * PI * 2, sn = Math.sin(a); return fr.cy + (sn > 0 ? fr.ry * 0.92 * Math.pow(sn, 0.45) : sn * fr.ry * 1.12) + jitter(fr, i + 40, 0.004); }
  function bunPath(fr) { const p = pathBuilder(fr), L = BP - 1; p.moveTo((eX(fr, L) + eX(fr, 0)) / 2, (eY(fr, L) + eY(fr, 0)) / 2); for (let i = 0; i < BP; i++) { const x = eX(fr, i), y = eY(fr, i), nx = (i + 1) % BP; p.quadTo(x, y, (x + eX(fr, nx)) / 2, (y + eY(fr, nx)) / 2); } return p.close().build(); }
  const knotY = (fr) => fr.cy - fr.ry * 1.1;
  function twistOf(fr) { const { mood, el, since, sinceF } = fr; let t = jiggle(since, 14) * 0.25 + jiggle(sinceF, 12) * 0.35; if (mood === 'wave') t += Math.sin(el * 9) * 0.32; if (mood === 'think') t += 0.18 + Math.sin(el * 0.9) * 0.08; if (mood === 'calm') t += Math.sin(el * 1.1) * 0.05; if (mood === 'happy') t += Math.sin(el * 10.4) * 0.12; return t; }
  function drawPleats(cv, fr) { const { s, cx, cy, rx, ry, lw } = fr, tw = twistOf(fr), ky = knotY(fr) + s * 0.012, line = stroke(fr, '#d2a578', Math.max(0.8, lw * 0.6)); for (let n = 0; n < 7; n++) { const a = PI * (1.1 + (n / 6) * 0.8), fx = cx + Math.cos(a) * rx * 0.66, fy = cy + Math.sin(a) * ry * 0.48, bend = (fx - cx) * 0.4 + tw * s * 0.09; cv.drawPath(pathBuilder(fr).moveTo(fx, fy).quadTo((fx + cx) / 2 + bend, (fy + ky) / 2 - ry * 0.14, cx + tw * s * 0.012, ky).build(), line); } }
  function drawKnot(cv, fr) { const { s, cx, lw } = fr, tw = twistOf(fr), ky = knotY(fr), x = cx + tw * s * 0.012; ellipse(cv, fr, x, ky, s * 0.042, s * 0.03, tw * 0.6, fill(fr, '#fff6e8'), stroke(fr, INK, lw * 0.8)); cv.drawCircle(x, ky - s * 0.004, s * 0.012, fill(fr, '#e0473e')); }
  function puff(cv, fr, x, y, r, a) { const rim = stroke(fr, STEAM_EDGE, Math.max(0.6, fr.lw * 0.4), a), w = fill(fr, '#ffffff', a); cv.drawCircle(x, y, r, rim); cv.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, rim); cv.drawCircle(x, y, r, w); cv.drawCircle(x + r * 0.8, y + r * 0.3, r * 0.7, w); }
  function drawSteam(cv, fr) {
    const { s, cx, el, lw, mood } = fr, ky = knotY(fr);
    if (mood === 'think') { const ph = (el * 1.4) % 4; for (let i = 0; i < 3; i++) { if (ph < i + 0.6) continue; const x = cx + (i - 1) * s * 0.055, y = ky - s * 0.1 - Math.sin(el * 3 + i) * s * 0.006; cv.drawCircle(x, y, s * 0.018, fill(fr, '#ffffff', 0.95)); cv.drawCircle(x, y, s * 0.018, stroke(fr, STEAM_EDGE, lw * 0.45)); } return; }
    if (mood === 'happy') { const p = (el % 1.6) / 1.6, r = s * 0.035 * (0.7 + 0.5 * p), hx = cx + Math.sin(p * 5) * s * 0.012, hy = ky - s * 0.07 - p * s * 0.16, a = Math.min(1, p * 4) * (1 - p); const h = pathBuilder(fr).moveTo(hx, hy + r).cubicTo(hx - r * 1.2, hy + r * 0.2, hx - r * 0.8, hy - r * 0.85, hx, hy - r * 0.25).cubicTo(hx + r * 0.8, hy - r * 0.85, hx + r * 1.2, hy + r * 0.2, hx, hy + r).close().build(); cv.drawPath(h, fill(fr, '#ffe3ea', a)); cv.drawPath(h, stroke(fr, '#f0a3b5', lw * 0.5, a)); return; }
    const pace = mood === 'sleepy' ? 0.5 : 1, br = 0.6 + 0.4 * Math.sin(el * 2.2);
    for (let n = 0; n < 3; n++) { const p = ((el * pace) / 2.8 + n / 3) % 1; puff(cv, fr, cx + (n - 1) * s * 0.05 + Math.sin(p * PI * 2 + n * 2) * s * 0.025, ky - s * 0.05 - p * s * 0.2, s * (0.022 + 0.03 * p), Math.min(1, Math.sin(p * PI) * 1.6) * br); }
  }
  function steamerBox(fr) { const s = fr.s, G = s * 0.865, R0 = s * 0.235, w = s * 0.335 * 1.12; return { top: G - R0 * 0.6, bot: G + s * 0.012, l: fr.cx - w, r: fr.cx + w }; }
  function drawSteamerBack(cv, fr) { const { s, cx } = fr, b = steamerBox(fr); ellipse(cv, fr, cx, b.top + s * 0.006, (b.r - b.l) / 2 - s * 0.01, s * 0.026, 0, fill(fr, '#7d5126')); }
  function drawSteamerFront(cv, fr) {
    const { s, cx, lw } = fr, { top, bot, l, r } = steamerBox(fr), c = s * 0.03;
    const box = pathBuilder(fr).moveTo(l, top).lineTo(r, top).lineTo(r, bot - c).quadTo(r, bot, r - c, bot).lineTo(l + c, bot).quadTo(l, bot, l, bot - c).close().build();
    cv.save(); cv.clipPath(box); fillGradient(cv, fr, '', ['#efc27e', '#d29a52', '#b47a38'], [0, 0.5, 1], top, bot);
    for (let x = l + s * 0.03; x < r; x += s * 0.042) cv.drawLine(x, top + s * 0.03, x, bot, stroke(fr, '#9b6630', lw * 0.42, 0.75));
    cv.drawLine(l, top + s * 0.024, r, top + s * 0.024, stroke(fr, '#9b6630', lw * 0.55));
    cv.drawLine(l, top + s * 0.01, r, top + s * 0.01, stroke(fr, '#fbe0a8', lw * 0.6));
    cv.restore();
    cv.drawPath(box, stroke(fr, INK, lw * 0.85));
  }
  function drawSnore(cv, fr) { if (fr.mood !== 'sleepy') return; const { s, cx, cy, ry, lw, el } = fr, p = (el % 3.2) / 3.2; if (p > 0.92) return; const r = s * (0.008 + 0.05 * p), x = cx + s * 0.035 + r * 0.6, y = cy + ry * 0.12 + s * 0.012 - r * 0.2; cv.drawCircle(x, y, r, fill(fr, '#eaf6ff', 0.45)); cv.drawCircle(x, y, r, stroke(fr, '#8ec3e6', lw * 0.5, 0.9)); cv.drawCircle(x - r * 0.35, y - r * 0.35, r * 0.18, fill(fr, '#ffffff', 0.9)); }
  function drawBun(cv, fr) {
    const { s, cx, cy, rx, ry, lw } = fr, bun = bunPath(fr);
    cv.save(); cv.clipPath(bun); fillGradient(cv, fr, '', ['#fffbf2', '#fbeedb', '#efd3ae'], [0, 0.55, 1], cy - ry * 1.12, cy + ry); drawPleats(cv, fr);
    ellipse(cv, fr, cx - rx * 0.5, cy - ry * 0.45, s * 0.05, s * 0.022, -0.5, fill(fr, 'rgba(255,255,255,0.75)'));
    cv.restore();
    cv.drawPath(bun, stroke(fr, INK, lw)); drawKnot(cv, fr);
  }
  function drawSteamBurst(cv, fr) { if (fr.sinceF < 0 || fr.sinceF >= 1.3) return; const { s, cx, lw } = fr, p = fr.sinceF / 1.3, f = 1 - p, ky = knotY(fr); for (let n = 0; n < 5; n++) { const a = -PI / 2 + (n - 2) * 0.45, d = s * (0.06 + 0.22 * p), x = cx + Math.cos(a) * d, y = ky + Math.sin(a) * d, r = s * (0.03 + 0.04 * p); cv.drawCircle(x, y, r, fill(fr, '#ffffff', 0.9 * f)); cv.drawCircle(x, y, r, stroke(fr, STEAM_EDGE, lw * 0.5, f)); } }
  function drawBanhBao(cv, fr) { drawSteamerBack(cv, fr); drawArmsBehind(cv, fr); drawBun(cv, fr); drawSteamerFront(cv, fr); drawSteam(cv, fr); drawArmsInFront(cv, fr); drawFace(cv, fr); drawSnore(cv, fr); }

  // ---- giot ----
  const tipX = (fr) => fr.cx + Math.sin(fr.el * 2.3) * fr.s * 0.018 + (fr.mood === 'think' ? fr.s * 0.03 : 0) + (fr.mood === 'wave' ? Math.sin(fr.el * 6) * fr.s * 0.075 : 0);
  const tipY = (fr) => fr.cy - fr.ry * (1.72 - 0.75 * (fr.mood === 'sleepy' ? puddleOf(fr.el) : 0)) + (fr.mood === 'wave' ? Math.abs(Math.sin(fr.el * 6)) * fr.ry * 0.12 : 0);
  function dropPath(fr) { const { cx, cy, rx, ry } = fr, tx = tipX(fr), ty = tipY(fr); return pathBuilder(fr).moveTo(tx, ty).cubicTo(tx + rx * 0.12, ty + ry * 0.45, cx + rx, cy - ry * 0.7, cx + rx, cy).cubicTo(cx + rx, cy + ry * 0.56, cx + rx * 0.56, cy + ry, cx, cy + ry).cubicTo(cx - rx * 0.56, cy + ry, cx - rx, cy + ry * 0.56, cx - rx, cy).cubicTo(cx - rx, cy - ry * 0.7, tx - rx * 0.12, ty + ry * 0.45, tx, ty).close().build(); }
  function drawDrop(cv, fr) {
    const { s, cx, cy, rx, ry, lw, el } = fr, d = dropPath(fr);
    cv.save(); cv.clipPath(d); fillGradient(cv, fr, '', ['#e3f7ff', '#8fd3f7', '#3f93dc'], [0, 0.45, 1], tipY(fr), cy + ry);
    ellipse(cv, fr, cx + rx * 0.12, cy + ry * 0.66, rx * 0.62, ry * 0.2, 0, fill(fr, '#d2f6ff', 0.6));
    for (let k = 0; k < 4; k++) { const p = (el * 0.22 + k * 0.27) % 1; cv.drawCircle(cx + (k - 1.5) * rx * 0.38 + Math.sin(el * 2 + k) * s * 0.01, cy + ry * 0.85 - p * ry * 1.7, s * (0.008 + 0.005 * (k % 2)), stroke(fr, '#ffffff', Math.max(0.6, lw * 0.4), (1 - p) * 0.7)); }
    cv.restore();
    cv.drawPath(d, stroke(fr, INK, lw));
    cv.drawArc(oval(fr, cx, cy, rx * 0.72, ry * 0.72), 196, 52, false, stroke(fr, '#ffffff', lw * 1.05, 0.85));
    ellipse(cv, fr, cx + rx * 0.55, cy + ry * 0.35, s * 0.012, s * 0.024, 0.5, fill(fr, '#ffffff', 0.5));
    cv.drawCircle(cx - rx * 0.06, cy - ry * 0.74, s * 0.011, fill(fr, '#ffffff', 0.85));
  }
  function drawMini(cv, fr, x, y, r) { const { s, lw } = fr; const m = pathBuilder(fr).moveTo(x, y - r * 1.6).cubicTo(x + r * 0.2, y - r * 1.1, x + r, y - r * 0.6, x + r, y).cubicTo(x + r, y + r * 0.55, x + r * 0.55, y + r, x, y + r).cubicTo(x - r * 0.55, y + r, x - r, y + r * 0.55, x - r, y).cubicTo(x - r, y - r * 0.6, x - r * 0.2, y - r * 1.1, x, y - r * 1.6).close().build(); cv.drawPath(m, fill(fr, '#8fd3f7')); cv.drawPath(m, stroke(fr, INK, Math.max(0.8, lw * 0.7))); const e = fill(fr, INK); cv.drawCircle(x - r * 0.35, y, Math.max(0.6, s * 0.008), e); cv.drawCircle(x + r * 0.35, y, Math.max(0.6, s * 0.008), e); }
  function drawSplit(cv, fr, front) { if (fr.mood !== 'happy') return; const ph = splitPhase(fr.el); if (ph < 0) return; const ap = Math.sin(ph * PI), r = fr.s * 0.085 * ap; if (r < fr.s * 0.015) return; for (let k = 0; k < 2; k++) { const a = ph * PI * 2 + k * PI; if (Math.sin(a) > 0 !== front) continue; drawMini(cv, fr, fr.cx + Math.cos(a) * fr.rx * (1.15 + 0.45 * ap), fr.cy - fr.ry * 0.1 + Math.sin(a) * fr.ry * 0.35, r); } }
  function drawSweat(cv, fr) { if (fr.mood !== 'nod') return; const { s, cx, cy, rx, ry, lw, el } = fr, p = (el * 0.5) % 1, x = cx + rx * 0.82, y = cy - ry * 0.6 + p * ry * 0.3, r = s * 0.024; const m = pathBuilder(fr).moveTo(x, y - r * 1.7).cubicTo(x + r * 0.3, y - r, x + r, y - r * 0.4, x + r, y).cubicTo(x + r, y + r * 0.6, x + r * 0.5, y + r, x, y + r).cubicTo(x - r * 0.5, y + r, x - r, y + r * 0.6, x - r, y).cubicTo(x - r, y - r * 0.4, x - r * 0.3, y - r, x, y - r * 1.7).close().build(); cv.drawPath(m, fill(fr, '#d8f3ff', 1 - p * 0.4)); cv.drawPath(m, stroke(fr, INK, lw * 0.6, 1 - p * 0.4)); }
  function drawRainCloud(cv, fr) {
    if (fr.mood !== 'think') return;
    const { s, cx, lw, el } = fr, x = cx + s * 0.2, y = s * 0.13 + Math.sin(el * 1.6) * s * 0.008;
    for (let k = 0; k < 3; k++) { const p = (el * 1.3 + k / 3) % 1; cv.drawLine(x + (k - 1) * s * 0.035, y + s * 0.04 + p * s * 0.13, x + (k - 1) * s * 0.035 - s * 0.006, y + s * 0.065 + p * s * 0.13, stroke(fr, '#6cbcea', Math.max(0.8, lw * 0.6), 1 - p)); }
    const C = [[-0.045, 0.008, 0.03], [0, -0.012, 0.042], [0.048, 0.008, 0.032]];
    C.forEach(([ox, oy, r]) => cv.drawCircle(x + ox * s, y + oy * s, r * s, stroke(fr, INK, lw * 1.2)));
    C.forEach(([ox, oy, r]) => cv.drawCircle(x + ox * s, y + oy * s, r * s, fill(fr, '#f4f8fb')));
  }
  function ripple(cv, fr, p, str) { if (p < 0 || p >= 1) return; const r = fr.rx * (0.7 + p * 0.9); ellipse(cv, fr, fr.cx, fr.s * 0.905, r, r * 0.18, 0, stroke(fr, '#6cbcea', Math.max(0.7, fr.lw * 0.6), (1 - p) * str)); }
  function drawRipples(cv, fr) { if (fr.mood === 'happy') ripple(cv, fr, ((fr.el * 5.2) / PI) % 1, 0.7); ripple(cv, fr, fr.since / 0.9, 0.6); ripple(cv, fr, fr.sinceF / 1.3, 0.9); ripple(cv, fr, (fr.sinceF - 0.25) / 1.3, 0.7); if (fr.mood === 'sleepy') ripple(cv, fr, (fr.el * 0.3) % 1, 0.35); }
  function drawSplash(cv, fr) { if (fr.sinceF < 0 || fr.sinceF >= 1.3) return; const { s, cx } = fr, p = fr.sinceF / 1.3, pf = fill(fr, '#8fd3f7', 1 - p), o = stroke(fr, INK, Math.max(0.6, fr.lw * 0.5), 1 - p); for (let n = 0; n < 4; n++) { const side = n < 2 ? -1 : 1, reach = n % 2 === 0 ? 0.36 : 0.24, x = cx + side * s * reach * p, y = s * 0.86 - Math.sin(p * PI) * s * (n % 2 === 0 ? 0.16 : 0.24), r = s * 0.018 * (1 - p * 0.5); cv.drawCircle(x, y, r, pf); cv.drawCircle(x, y, r, o); } }
  function drawGiot(cv, fr) { drawSplit(cv, fr, false); drawArmsBehind(cv, fr); drawDrop(cv, fr); drawArmsInFront(cv, fr); drawFace(cv, fr); drawSweat(cv, fr); drawSplit(cv, fr, true); }

  // ---- hac ----
  const LIGHT = '#f26a6f', MID = '#d94450', DARK = '#b52d3d', CREASE = '#f5cf72';
  const REVEAL = 1.7, PAPER = 0.45;
  const clamp01 = (v) => Math.max(0, Math.min(1, v)), ease = (v) => v * v * (3 - 2 * v);
  function revealOf(fr) { return fr.sinceF >= 0 && fr.sinceF < REVEAL ? fr.sinceF / REVEAL : 1; }
  function grownOf(fr) { const p = revealOf(fr); if (p >= 1) return 1; if (p < PAPER) return 0; const u = (p - PAPER) / (1 - PAPER); return 1 - Math.pow(1 - u, 3); }
  function popOf(fr) { const p = revealOf(fr); if (p >= 1) return 1; if (p < PAPER) return 0; const u = clamp01((p - PAPER) / 0.4) - 1, c1 = 2.2; return 1 + (c1 + 1) * u * u * u + c1 * u * u; }
  function hacWing(cv, fr, ax, ay, bx, by, theta, L, front) {
    const { lw } = fr, mx = (ax + bx) / 2, my = (ay + by) / 2, tx = mx + Math.sin(theta) * L, ty = my - Math.cos(theta) * L, up = L >= 0;
    cv.drawPath(pathBuilder(fr).moveTo(ax, ay).lineTo(tx, ty).lineTo(mx, my).close().build(), fill(fr, up ? (front ? LIGHT : MID) : '#a92a38'));
    cv.drawPath(pathBuilder(fr).moveTo(mx, my).lineTo(tx, ty).lineTo(bx, by).close().build(), fill(fr, up ? (front ? MID : DARK) : '#8c1f2e'));
    cv.drawLine(mx, my, tx, ty, stroke(fr, CREASE, Math.max(0.6, lw * 0.4)));
    const edge = pathBuilder(fr).moveTo(ax, ay).lineTo(tx, ty).lineTo(bx, by).build();
    cv.drawPath(edge, stroke(fr, INK, lw * 0.95)); cv.drawPath(edge, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
    return { tip: [tx, ty], path: pathBuilder(fr).moveTo(ax, ay).lineTo(tx, ty).lineTo(bx, by).close().build() };
  }
  function hacPoint(cv, fr, side, rise, reach, head, bob) {
    const { s, cx, cy, rx, ry, lw } = fr, bx = cx + side * rx * 0.72, by = cy + ry * 0.4, len = s * (head ? 0.42 : 0.38) * reach, tx = bx + side * Math.cos(rise) * len, ty = by - Math.sin(rise) * len, w = s * 0.05, nx = Math.sin(rise) * w, ny = Math.cos(rise) * w * side;
    const sh = pathBuilder(fr).moveTo(bx - nx, by - ny).lineTo(tx, ty).lineTo(bx + nx, by + ny).close().build();
    cv.drawPath(sh, fill(fr, head ? MID : LIGHT)); cv.drawPath(sh, stroke(fr, INK, lw * 0.6)); cv.drawPath(sh, stroke(fr, GOLD, Math.max(0.5, lw * 0.25)));
    cv.drawLine(bx, by, tx, ty, stroke(fr, CREASE, Math.max(0.5, lw * 0.32)));
    if (!head || reach <= 0.05) return [tx, ty];
    const hx = tx + side * s * 0.065 * reach, hy = ty + s * (0.045 + (bob || 0)) * reach;
    const bk = pathBuilder(fr).moveTo(tx - side * s * 0.008, ty - s * 0.01).lineTo(hx, hy).lineTo(tx - side * s * 0.012, ty + s * 0.026 * reach).close().build();
    cv.drawPath(bk, fill(fr, DARK)); cv.drawPath(bk, stroke(fr, INK, lw * 0.75));
    cv.drawCircle(tx - side * s * 0.004, ty + s * 0.006, s * 0.009, fill(fr, GOLD)); // gold crest
    return [tx, ty];
  }
  function drawPaperBody(cv, fr) {
    const { s, cx, cy, rx, ry, lw } = fr, top = cy - ry * 0.6, L = cx - rx * 1.05, R = cx + rx * 1.05, mid = cy + ry * 0.05, bot = cy + ry;
    cv.drawPath(pathBuilder(fr).moveTo(cx, top).lineTo(L, mid).lineTo(cx - rx * 0.3, bot).lineTo(cx, bot).close().build(), fill(fr, LIGHT));
    cv.drawPath(pathBuilder(fr).moveTo(cx, top).lineTo(R, mid).lineTo(cx + rx * 0.3, bot).lineTo(cx, bot).close().build(), fill(fr, MID));
    cv.drawPath(pathBuilder(fr).moveTo(L, mid).lineTo(cx, bot).lineTo(cx - rx * 0.3, bot).close().build(), fill(fr, '#ffffff', 0.14));
    [[-0.55, 0.42], [0.62, 0.3], [0.3, 0.72], [-0.25, 0.8], [0.78, 0.12]].forEach(([ox, oy]) => cv.drawCircle(cx + ox * rx, cy + oy * ry - ry * 0.2, s * 0.0055, fill(fr, GOLD, 0.85)));
    const c = stroke(fr, CREASE, Math.max(0.6, lw * 0.4)); cv.drawLine(cx, top, cx, bot, c); cv.drawLine(L, mid, cx, bot, c); cv.drawLine(R, mid, cx, bot, c);
    const out = pathBuilder(fr).moveTo(cx, top).lineTo(R, mid).lineTo(cx + rx * 0.3, bot).lineTo(cx - rx * 0.3, bot).lineTo(L, mid).close().build();
    cv.drawPath(out, stroke(fr, INK, lw)); cv.drawPath(out, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
    return out;
  }
  function hacSheen(cv, fr, path, delay) {
    const { s, cx, cy, el } = fr, p = ((el + delay) % 3.8) / 3.8; if (p > 0.4) return;
    const u = p / 0.4, x = cx - s * 0.45 + u * s * 0.9;
    cv.save(); cv.clipPath(path); cv.rotate(deg(0.45), x, cy);
    cv.drawRect(box(fr, x - s * 0.035, cy - s * 0.6, s * 0.07, s * 1.2), fill(fr, '#fff4dc', 0.55 * Math.sin(u * PI)));
    cv.drawRect(box(fr, x + s * 0.05, cy - s * 0.6, s * 0.018, s * 1.2), fill(fr, '#fff4dc', 0.4 * Math.sin(u * PI)));
    cv.restore();
  }
  function hacRibbons(cv, fr, x, y) {
    const { s, el, lw, mood } = fr, amp = mood === 'happy' ? 0.035 : mood === 'sleepy' ? 0.008 : 0.02, sp = mood === 'happy' ? 7 : 3.2;
    [[GOLD, 0, 0.2], ['#ff9fd0', 1.6, 0.16]].forEach(([col, ph, len]) => {
      const p = pathBuilder(fr).moveTo(x, y);
      for (let i = 1; i <= 12; i++) { const t = i / 12; p.lineTo(x + t * s * len, y + t * s * 0.07 + Math.sin(t * 5.5 - el * sp + ph) * s * amp * t); }
      cv.drawPath(p.build(), stroke(fr, col, lw * 0.75));
    });
  }
  function hacConfetti(cv, fr, front, lift) {
    const { s, cx, cy, ry, lw, el, mood } = fr; if (mood === 'sleepy') return;
    const spread = mood === 'happy' ? 0.44 + Math.sin(el * 3.5) * 0.03 : 0.38, cols = [GOLD, '#ff9fd0', '#c9b8ff'];
    for (let k = 0; k < 3; k++) {
      const a = el * 0.9 + k * 2.094, sn = Math.sin(a); if ((sn > 0) !== front) continue;
      const x = cx + Math.cos(a) * s * spread, y = cy - ry * 1.55 + sn * s * 0.08, r = s * 0.036 * (0.8 + 0.2 * sn);
      cv.save(); cv.rotate(deg(el * 2 + k), x, y);
      const d = pathBuilder(fr).moveTo(x, y - r).lineTo(x + r * 0.62, y).lineTo(x, y + r).lineTo(x - r * 0.62, y).close().build();
      cv.drawPath(d, fill(fr, cols[k])); cv.drawLine(x, y - r, x, y + r, stroke(fr, '#ffffff', lw * 0.35, 0.8)); cv.drawPath(d, stroke(fr, INK, lw * 0.38));
      cv.restore();
    }
  }
  function drawSquare(cv, fr) {
    const { s, cx, cy, ry, lw } = fr, t = clamp01(revealOf(fr) / PAPER), D = s * 0.2;
    const drop = clamp01(t / 0.3), yo = -Math.pow(1 - drop, 2) * s * 0.32 + (drop >= 1 ? Math.sin(clamp01((t - 0.3) / 0.12) * PI) * -s * 0.02 : 0);
    const x = cx, y = cy - ry * 0.15 + yo, spin = (1 - drop) * 0.9 + ease(clamp01((t - 0.32) / 0.28)) * (PI / 4), k = ease(clamp01((t - 0.62) / 0.38));
    cv.save(); cv.rotate(deg(spin), x, y);
    if (k <= 0) {
      const h = D / Math.SQRT2, sq = pathBuilder(fr).moveTo(x - h, y - h).lineTo(x + h, y - h).lineTo(x + h, y + h).lineTo(x - h, y + h).close().build();
      cv.drawPath(sq, fill(fr, LIGHT)); const cr = stroke(fr, CREASE, lw * 0.4, ease(clamp01((t - 0.4) / 0.2)));
      cv.drawLine(x - h, y - h, x + h, y + h, cr); cv.drawLine(x + h, y - h, x - h, y + h, cr);
      cv.drawPath(sq, stroke(fr, INK, lw)); cv.drawPath(sq, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
    } else {
      cv.restore(); cv.save(); // now a diamond: fold its side corners in toward the centre crease
      const w = D * (1 - 0.62 * k), H = D * (1 + 0.15 * k);
      const kite = pathBuilder(fr).moveTo(x, y - H).lineTo(x + w, y).lineTo(x, y + H).lineTo(x - w, y).close().build();
      cv.drawPath(kite, fill(fr, LIGHT));
      cv.drawPath(pathBuilder(fr).moveTo(x, y - H).lineTo(x + w, y).lineTo(x, y + H).close().build(), fill(fr, MID));
      [-1, 1].forEach((sd) => { const tip = x + sd * (D - k * D * 1.15); const fl = pathBuilder(fr).moveTo(x, y - H).lineTo(tip, y).lineTo(x, y + H * 0.72).close().build(); cv.drawPath(fl, fill(fr, sd < 0 ? '#ff8a8e' : DARK, 0.95)); cv.drawPath(fl, stroke(fr, INK, lw * 0.6)); });
      cv.drawLine(x, y - H, x, y + H, stroke(fr, CREASE, lw * 0.4));
      cv.drawPath(kite, stroke(fr, INK, lw)); cv.drawPath(kite, stroke(fr, GOLD, Math.max(0.5, lw * 0.32)));
    }
    cv.restore();
  }
  function drawPlane(cv, fr) {
    if (fr.form !== 'hac' || fr.mood !== 'think') return;
    const { s, cx, lw, el } = fr, a = el * 1.7, x = cx + Math.cos(a) * s * 0.34, y = s * 0.17 + Math.sin(a) * s * 0.06, dir = -Math.sin(a) >= 0 ? 1 : -1, L = s * 0.05;
    const body = pathBuilder(fr).moveTo(x + dir * L, y).lineTo(x - dir * L * 0.8, y - L * 0.55).lineTo(x - dir * L * 0.35, y).lineTo(x - dir * L * 0.8, y + L * 0.35).close().build();
    cv.drawPath(body, fill(fr, '#fffaf2')); cv.drawPath(body, stroke(fr, INK, lw * 0.55));
    cv.drawLine(x + dir * L, y, x - dir * L * 0.35, y, stroke(fr, '#d8cfc4', lw * 0.4));
    for (let k = 1; k <= 3; k++) cv.drawCircle(x - dir * (L + k * s * 0.025), y + Math.sin(a + k) * s * 0.004, s * 0.004, fill(fr, '#ffffff', 0.6 - k * 0.15));
  }
  function drawCraneBurst(cv, fr) {
    if (fr.form !== 'hac') return; const t = fr.sinceF - REVEAL * PAPER; if (t < 0 || t >= 1.4) return;
    const { s, cx, lw } = fr, p = t / 1.4, f = 1 - p;
    cv.drawCircle(cx, s * 0.5, s * (0.14 + p * 0.36), stroke(fr, GOLD, lw * 2.2 * f + 0.5, f));
    cv.drawCircle(cx, s * 0.5, s * (0.2 + 0.25 * p), fill(fr, '#fff0d2', 0.35 * f * f * f));
    for (let n = 0; n < 8; n++) { const a = (n / 8) * PI * 2 + 0.3, d = s * (0.1 + p * 0.38), x = cx + Math.cos(a) * d, y = s * 0.5 + Math.sin(a) * d, r = s * 0.02 * f; cv.save(); cv.rotate(deg(p * 6 + n), x, y); cv.drawPath(pathBuilder(fr).moveTo(x, y - r).lineTo(x + r * 0.6, y).lineTo(x, y + r).lineTo(x - r * 0.6, y).close().build(), fill(fr, n % 2 ? '#ff9fd0' : GOLD, f)); cv.restore(); }
  }
  function drawHac(cv, fr) {
    const { s, el, mood, since, cx, cy, rx, ry } = fr, grown = grownOf(fr);
    const rp = revealOf(fr);
    if (rp < 0.7) { const keep = LA; LA = keep * (1 - ease(clamp01((rp - PAPER) / 0.25))); drawSquare(cv, fr); LA = keep; }
    if (grown <= 0) return;
    const pop = popOf(fr);
    const br = Math.sin(el * 2);
    let tF = -0.22 + br * 0.06, tB = 0.36 + br * 0.06, fold = 1 - 0.08 * (0.5 + 0.5 * br), neck = 1.05 + Math.sin(el * 1.2) * 0.04, tail = 0.72, bob = 0;
    let lift = s * 0.035 + Math.sin(el * 1.6) * s * 0.015;
    if (mood === 'happy') { const fl = Math.sin(el * 7); tF = -0.4 - fl * 0.55; tB = 0.5 + fl * 0.55; fold = 1; neck = 1.18; tail = 0.88; lift += Math.abs(Math.sin(el * 3.5)) * s * 0.07; }
    if (mood === 'wave') tF = -0.55 + Math.sin(el * 9) * 0.5;
    if (mood === 'sleepy') { tF = -1.0; tB = 1.05; fold = 0.6; neck = 0.3; tail = 0.42; bob = 0.03; lift = 0; }
    if (mood === 'think') { neck = 1.32; bob = -0.022 + Math.sin(el * 1.7) * 0.006; tF = -0.15; }
    if (mood === 'nod') { neck = 0.8 + Math.sin(el * 2.6) * 0.32; bob = Math.max(0, Math.sin(el * 2.6)) * 0.025; }
    if (since < 0.8) fold *= Math.cos((since / 0.8) * PI * 2);
    fold *= grown; lift *= grown;
    const L = s * 0.36 * fold, hy = cy - ry * 0.4 - lift, glow = mood === 'sleepy' ? 0.35 : 0.75 + 0.25 * Math.sin(el * 1.6);
    cv.drawCircle(cx, hy, s * 0.42, fillShader(fr, radial(fr, cx, hy, s * 0.42, ['rgba(255,211,110,' + (0.42 * glow).toFixed(3) + ')', 'rgba(255,159,208,' + (0.16 * glow).toFixed(3) + ')', 'rgba(255,159,208,0)'], [0, 0.55, 1])));
    cv.save(); const sc = 0.6 + 0.4 * pop; cv.translate(cx, cy + ry - lift); cv.scale(sc, sc); cv.translate(-cx, -(cy + ry));
    hacConfetti(cv, fr, false, lift);
    hacWing(cv, fr, cx - rx * 0.05, cy - ry * 0.58, cx + rx * 0.88, cy + ry * 0.02, tB, L, false);
    const tt = hacPoint(cv, fr, 1, tail, grown, false); hacRibbons(cv, fr, tt[0], tt[1]);
    hacPoint(cv, fr, -1, neck, grown, true, bob);
    const body = drawPaperBody(cv, fr); hacSheen(cv, fr, body, 0);
    const w = hacWing(cv, fr, cx - rx * 0.88, cy + ry * 0.02, cx + rx * 0.05, cy - ry * 0.58, tF, L, true); hacSheen(cv, fr, w.path, -0.25);
    drawFace(cv, fr);
    hacConfetti(cv, fr, true, lift);
    if (mood === 'happy' && Math.sin(el * 7) < -0.8) drawStar(cv, fr, w.tip[0], w.tip[1], s * 0.034, GOLD);
    cv.restore();
  }

  // ---- compose ----
  function drawSun(cv, fr) { if (fr.mx) drawRing(cv, fr, false); drawFeet(cv, fr); drawRays(cv, fr); drawArmsBehind(cv, fr); drawBody(cv, fr); drawArmsInFront(cv, fr); drawFace(cv, fr); if (fr.mx) drawRing(cv, fr, true); }
  function drawCompanion(cv, fr) {
    drawGroundShadow(cv, fr);
    if (fr.form === 'giot') drawRipples(cv, fr);
    cv.save(); cv.rotate(deg(fr.tilt), fr.cx, fr.cy + fr.ry);
    ({ nhang: drawNhang, banhbao: drawBanhBao, giot: drawGiot, hac: drawHac }[fr.form] || drawSun)(cv, fr);
    cv.restore();
    drawExtras(cv, fr);
    if (fr.form === 'nhang') drawSmokeRing(cv, fr);
    if (fr.form === 'banhbao') drawSteamBurst(cv, fr);
    if (fr.form === 'giot') { drawSplash(cv, fr); drawRainCloud(cv, fr); }
    drawPlane(cv, fr); drawCraneBurst(cv, fr);
    drawBurst(cv, fr);
  }
  const formOf = (v) => (FORMS.includes(v) ? v : 'sun');

  class DuskBuddy extends HTMLElement {
    static get observedAttributes() { return ['size', 'mood', 'form']; }
    connectedCallback() {
      if (!this.c) {
        this.c = document.createElement('canvas');
        Object.assign(this.style, { display: 'inline-block', lineHeight: '0', flexShrink: '0' });
        this.appendChild(this.c);
        this.seed = Math.random() * 1000;
        this.t0 = performance.now();
        this.moodAt = this.t0;
      }
      this.setup();
      cancelAnimationFrame(this.raf);
      const loop = (t) => { this.raf = requestAnimationFrame(loop); this.draw(t); };
      this.raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this.raf); }
    attributeChangedCallback(name, o, v) {
      if (name === 'mood' && o !== v) this.moodAt = performance.now();
      if (name === 'form' && o !== v && o !== null) { this.formAt = performance.now(); this.leftForm = formOf(o); }
      if (name === 'size') this.setup();
    }
    setup() {
      if (!this.c) return;
      const s = +this.getAttribute('size') || 48, d = Math.min(3, window.devicePixelRatio || 1);
      this.s = s; this.d = d;
      this.c.width = Math.round(s * d); this.c.height = Math.round(s * d);
      this.c.style.width = s + 'px'; this.c.style.height = s + 'px';
      this.ctx = this.c.getContext('2d');
    }
    draw(t) {
      const ctx = this.ctx, s = this.s; if (!ctx) return;
      ctx.setTransform(this.d, 0, 0, this.d, 0, 0);
      ctx.clearRect(0, 0, s, s);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const el = (t - this.t0) / 1000, since = (t - this.moodAt) / 1000, sinceF = this.formAt ? (t - this.formAt) / 1000 : 99;
      const mood = this.getAttribute('mood') || 'calm', form = formOf(this.getAttribute('form'));
      X = ctx; LA = 1;
      drawCompanion(canvas, makeFrame({ s, el, since, sinceF, mood, form, seed: this.seed }));
      const fade = this.formAt ? 1 - Math.min(1, sinceF / 0.35) : 0;
      if (fade > 0 && this.leftForm && this.leftForm !== form) { LA = fade; drawCompanion(canvas, makeFrame({ s, el, since, sinceF: 99, mood, form: this.leftForm, seed: this.seed })); LA = 1; }
      X = null;
    }
  }
  customElements.define('dusk-buddy', DuskBuddy);
})();
