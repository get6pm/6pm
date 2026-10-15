// <app-icon form="sun|max|nhang|banhbao|giot|hac" size="180"> — 6pm app icons, drawn in a 1024 grid.
// System (from the Sunset icon): dusk sky → horizon at 640 → sea with four reflection bars; the companion meets the horizon.
(function () {
  const INK = '#371a29', PI = Math.PI, H = 640;
  function lin(c, y0, y1, stops) { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([col, t], i) => g.addColorStop(t ?? i / (stops.length - 1), col)); return g; }
  function scene(c, sky, sea, bars, glow) {
    c.fillStyle = lin(c, 0, H, sky); c.fillRect(0, 0, 1024, H);
    const g = c.createRadialGradient(512, H, 0, 512, H, 620); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1024, H);
    c.fillStyle = lin(c, H, 1024, sea.map((s, i) => [s, i])); c.fillRect(0, H, 1024, 384);
    [[634, 690, 34], [464, 760, 32], [294, 826, 30], [140, 886, 28]].forEach(([w, y, h], i) => { c.fillStyle = bars[i]; rr(c, 512 - w / 2, y, w, h, h / 2); c.fill(); });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ink(c, w) { c.strokeStyle = INK; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function clipSky(c) { c.beginPath(); c.rect(0, 0, 1024, H); c.clip(); }
  function face(c, x, y, k = 1, cheek = '#ff8a78') {
    c.fillStyle = cheek; [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(x + s * 214 * k, y + 82 * k, 54 * k, 30 * k, 0, 0, PI * 2); c.fill(); });
    [-1, 1].forEach((s) => { c.beginPath(); c.arc(x + s * 132 * k, y - 20 * k, 52 * k, PI * 0.15, PI * 0.85); ink(c, 32 * k); });
    c.beginPath(); c.arc(x, y + 44 * k, 42 * k, PI * 0.2, PI * 0.8); ink(c, 28 * k);
  }
  function shine(c, x, y, rx, ry, rot, a = 0.6) { c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, PI * 2); c.fill(); }
  function star(c, x, y, r, col, outline) { const k = r * 0.3; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + k, y - k); c.lineTo(x + r, y); c.lineTo(x + k, y + k); c.lineTo(x, y + r); c.lineTo(x - k, y + k); c.lineTo(x - r, y); c.lineTo(x - k, y - k); c.closePath(); c.fillStyle = col; c.fill(); if (outline) ink(c, outline); }
  function ray(c, a, r0, r1, w = 46) { c.beginPath(); c.moveTo(512 + Math.cos(a) * r0, H + Math.sin(a) * r0); c.lineTo(512 + Math.cos(a) * r1, H + Math.sin(a) * r1); ink(c, w); return [512 + Math.cos(a) * r1, H + Math.sin(a) * r1]; }

  const DRAW = {
    sun(c) {
      scene(c, [['#1f1d4f', 0], ['#5c2c78', 0.4], ['#c8456e', 0.78], ['#ff9a45', 1]], ['#9a3068', '#2a1c4f'], ['#ffb877', '#fb8f5f', '#e86a62', '#cc4a6e'], 'rgba(255,150,90,.35)');
      [-PI / 2, -PI / 2 - 0.68, -PI / 2 + 0.68].forEach((a, i) => ray(c, a, 380, i ? 470 : 500));
      c.save(); clipSky(c); c.beginPath(); c.arc(512, H, 350, 0, PI * 2); c.fillStyle = lin(c, 290, H, [['#fff0c4', 0], ['#ffc27a', 0.6], ['#ff9a5c', 1]]); c.fill(); ink(c, 38); c.restore();
      shine(c, 338, 425, 52, 30, -0.6); face(c, 512, 490);
    },
    max(c) {
      scene(c, [['#0c0a2e', 0], ['#2b1c66', 0.42], ['#7a3aa8', 0.8], ['#e58bd0', 1]], ['#3a2580', '#120e36'], ['#ffd36e', '#ff9fd0', '#c9a4ff', '#8d78ff'], 'rgba(230,140,220,.35)');
      [[150, 140, 18], [880, 110, 22], [800, 300, 12], [210, 330, 12], [640, 70, 10]].forEach(([x, y, r]) => star(c, x, y, r, 'rgba(255,240,255,.85)'));
      const ring = (front) => { c.save(); c.translate(512, 545); c.rotate(-0.16); c.beginPath(); c.ellipse(0, 0, 470, 118, 0, front ? 0 : PI, front ? PI : PI * 2); c.strokeStyle = INK; c.lineWidth = 62; c.lineCap = 'round'; c.stroke(); const g = c.createLinearGradient(-470, 0, 470, 0); g.addColorStop(0, '#ffd36e'); g.addColorStop(0.5, '#ff9fd0'); g.addColorStop(1, '#9d8bff'); c.strokeStyle = g; c.lineWidth = 30; c.stroke(); if (front) { const a = 0.3 * PI, x = Math.cos(a) * 470, y = Math.sin(a) * 118; c.beginPath(); c.arc(x, y, 40, 0, PI * 2); c.fillStyle = '#fff1c4'; c.fill(); ink(c, 22); } else { const a = 1.18 * PI; c.beginPath(); c.arc(Math.cos(a) * 470, Math.sin(a) * 118, 30, 0, PI * 2); c.fillStyle = '#c9b8ff'; c.fill(); ink(c, 20); } c.restore(); };
      c.save(); clipSky(c); ring(false); c.restore();
      [-PI / 2, -PI / 2 - 0.62, -PI / 2 + 0.62, -PI / 2 - 1.15, -PI / 2 + 1.15].forEach((a, i) => { const t = ray(c, a, 380, i === 0 ? 480 : i < 3 ? 460 : 440, 40); star(c, t[0] + Math.cos(a) * 40, t[1] + Math.sin(a) * 40, i ? 30 : 40, '#ffd36e', 14); });
      c.save(); clipSky(c); c.beginPath(); c.arc(512, H, 350, 0, PI * 2); c.fillStyle = lin(c, 290, H, [['#fff1c4', 0], ['#ffa8c8', 0.5], ['#b48cff', 1]]); c.fill(); ink(c, 38); c.restore();
      shine(c, 338, 425, 52, 30, -0.6); face(c, 512, 490);
      c.save(); c.beginPath(); c.rect(0, 0, 1024, H + 60); c.clip(); ring(true); c.restore();
    },
    nhang(c) {
      scene(c, [['#24102e', 0], ['#5e1f40', 0.42], ['#c9503e', 0.8], ['#ffb85a', 1]], ['#7a2a3a', '#24102e'], ['#ffd27a', '#9fe0c4', '#f2a05a', '#c7584e'], 'rgba(255,170,90,.38)');
      c.fillStyle = 'rgba(255,214,140,.18)'; c.beginPath(); c.arc(512, H, 470, PI, 0); c.fill();
      [[-150, -0.3, 150], [0, 0, 185], [150, 0.3, 150]].forEach(([dx, a, L], n) => {
        const bx = 512 + dx, by = 300, tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
        c.beginPath(); c.moveTo(tx, ty - 30); const w = n === 1 ? 70 : 50;
        c.bezierCurveTo(tx + w, ty - 90, tx - w, ty - 150, tx + (n - 1) * 30, ty - 200);
        c.strokeStyle = 'rgba(246,226,240,.55)'; c.lineWidth = 18; c.lineCap = 'round'; c.stroke();
        c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); ink(c, 40);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (tx - bx) * 0.4, by + (ty - by) * 0.4); c.strokeStyle = '#d4483c'; c.lineWidth = 18; c.stroke();
        c.beginPath(); c.moveTo(bx + (tx - bx) * 0.4, by + (ty - by) * 0.4); c.lineTo(tx, ty); c.strokeStyle = '#8a5a3e'; c.stroke();
        c.fillStyle = 'rgba(255,179,107,.5)'; c.beginPath(); c.arc(tx, ty, 48, 0, PI * 2); c.fill();
        c.fillStyle = '#ff7a2f'; c.beginPath(); c.arc(tx, ty, 22, 0, PI * 2); c.fill(); c.fillStyle = '#ffe2b8'; c.beginPath(); c.arc(tx, ty, 10, 0, PI * 2); c.fill();
      });
      c.save(); clipSky(c);
      [-1, 1].forEach((s) => { c.beginPath(); c.arc(512 + s * 372, 420, 52, 0, PI * 2); ink(c, 40); c.strokeStyle = '#f2c45a'; c.lineWidth = 16; c.stroke(); });
      const urn = new Path2D(); urn.moveTo(200, 305); urn.bezierCurveTo(110, 360, 120, 560, 170, 700); urn.lineTo(854, 700); urn.bezierCurveTo(904, 560, 914, 360, 824, 305); urn.closePath();
      c.fillStyle = lin(c, 300, H, [['#dcf5e8', 0], ['#97d3b9', 0.55], ['#4f9481', 1]]); c.fill(urn);
      c.save(); c.clip(urn);
      for (let i = -3; i <= 3; i++) { const x = 512 + i * 120; c.beginPath(); c.moveTo(x - 56, 590); c.quadraticCurveTo(x, 520, x + 56, 590); c.closePath(); c.fillStyle = 'rgba(242,196,90,.4)'; c.fill(); c.strokeStyle = '#f2c45a'; c.lineWidth = 9; c.stroke(); }
      c.fillStyle = '#f2c45a'; c.fillRect(0, 586, 1024, 22); c.fillRect(0, 622, 1024, 8);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 38; c.lineJoin = 'round'; c.stroke(urn);
      c.beginPath(); c.ellipse(512, 305, 326, 54, 0, 0, PI * 2); c.fillStyle = '#f2c45a'; c.fill(); ink(c, 32);
      c.beginPath(); c.ellipse(512, 300, 250, 22, 0, 0, PI * 2); c.fillStyle = '#b7a99f'; c.fill();
      c.restore();
      shine(c, 300, 400, 50, 26, -0.7, 0.55); face(c, 512, 470, 0.95, '#ff8f86');
    },
    banhbao(c) {
      scene(c, [['#1f1a3d', 0], ['#552a5e', 0.42], ['#d0606a', 0.8], ['#ffc27a', 1]], ['#8a3a5a', '#22183b'], ['#fff2dc', '#ffd3a0', '#f2a07a', '#d9707a'], 'rgba(255,190,130,.38)');
      const puff = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, PI * 2); p.moveTo(x + r * 1.55, y + r * 0.25); p.arc(x + r * 0.85, y + r * 0.25, r * 0.7, 0, PI * 2); p.moveTo(x - r * 0.1, y + r * 0.35); p.arc(x - r * 0.8, y + r * 0.35, r * 0.6, 0, PI * 2); c.strokeStyle = INK; c.lineWidth = 34; c.stroke(p); c.fillStyle = '#fffaf2'; c.fill(p); };
      puff(500, 120, 56); puff(250, 245, 36); puff(770, 215, 40);
      c.save(); clipSky(c);
      const bun = new Path2D(); bun.moveTo(128, 700); bun.bezierCurveTo(118, 430, 300, 268, 512, 262); bun.bezierCurveTo(724, 268, 906, 430, 896, 700); bun.closePath();
      c.fillStyle = lin(c, 262, H, [['#fffbf2', 0], ['#fbeedb', 0.55], ['#efd3ae', 1]]); c.fill(bun);
      c.save(); c.clip(bun);
      for (let n = 0; n < 7; n++) { const a = PI * (1.2 + (n / 6) * 0.6), fx = 512 + Math.cos(a) * 300, fy = 610 + Math.sin(a) * 270; c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo((fx + 512) / 2 + (fx - 512) * 0.35, (fy + 262) / 2 - 30, 512, 268); c.strokeStyle = '#c48d58'; c.lineWidth = 18; c.lineCap = 'round'; c.stroke(); }
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 38; c.lineJoin = 'round'; c.stroke(bun);
      c.restore();
      c.beginPath(); c.ellipse(512, 262, 62, 42, 0, 0, PI * 2); c.fillStyle = '#fff6e8'; c.fill(); ink(c, 28);
      c.beginPath(); c.arc(512, 258, 18, 0, PI * 2); c.fillStyle = '#e0473e'; c.fill();
      shine(c, 300, 420, 50, 24, -0.55, 0.8); face(c, 512, 500);
    },
    giot(c) {
      scene(c, [['#0d1b3d', 0], ['#244a7e', 0.42], ['#7d79b8', 0.78], ['#ffb08a', 1]], ['#2f5d9a', '#0e1c42'], ['#bfefff', '#8fd3f7', '#ffb08a', '#e48aa4'], 'rgba(255,170,150,.3)');
      c.strokeStyle = 'rgba(200,232,255,.38)'; c.lineWidth = 10; c.lineCap = 'round';
      [[120, 90], [230, 300], [860, 160], [760, 380], [930, 330], [90, 420], [330, 120], [690, 60]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 16, y + 58); c.stroke(); });
      c.beginPath(); c.ellipse(512, H + 16, 450, 34, 0, 0, PI * 2); c.strokeStyle = 'rgba(191,239,255,.5)'; c.lineWidth = 12; c.stroke();
      c.save(); clipSky(c);
      const d = new Path2D(); d.moveTo(512, 150); d.bezierCurveTo(560, 290, 850, 400, 850, 700); d.lineTo(174, 700); d.bezierCurveTo(174, 400, 464, 290, 512, 150); d.closePath();
      c.fillStyle = lin(c, 150, H, [['#e3f7ff', 0], ['#8fd3f7', 0.5], ['#3f93dc', 1]]); c.fill(d);
      c.strokeStyle = INK; c.lineWidth = 38; c.lineJoin = 'round'; c.stroke(d);
      c.restore();
      c.beginPath(); c.arc(512, 520, 260, PI * 1.08, PI * 1.32); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 26; c.lineCap = 'round'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(300, 300 + 120, 14, 0, PI * 2); c.fill();
      face(c, 512, 500, 1, '#ff9aaa');
    },
    hac(c) {
      scene(c, [['#140d33', 0], ['#46205e', 0.42], ['#b23a5e', 0.8], ['#ffa25a', 1]], ['#7a2048', '#180e30'], ['#ffd36e', '#ff8a7a', '#e8506a', '#b02a52'], 'rgba(255,170,100,.4)');
      [[140, 120, 22], [890, 90, 16], [930, 420, 12], [70, 400, 12], [520, 60, 10]].forEach(([x, y, r]) => star(c, x, y, r, '#ffd36e'));
      c.save(); clipSky(c); c.beginPath(); c.arc(512, H, 330, 0, PI * 2); c.fillStyle = lin(c, 310, H, [['#ffe9b0', 0], ['#ffbe7a', 0.6], ['#ff8a5c', 1]]); c.fill(); c.restore();
      const LIGHT = '#f26a6f', MID = '#d94450', DARK = '#b52d3d', GOLD = '#ffd36e';
      const poly = (pts, col) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.fill(); };
      const edge = (pts, w = 32) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); ink(c, w); c.strokeStyle = GOLD; c.lineWidth = w * 0.32; c.stroke(); };
      const wing = (a, t, b, f) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; poly([a, t, m], f ? LIGHT : MID); poly([m, t, b], f ? MID : DARK); c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(t[0], t[1]); c.strokeStyle = '#f5cf72'; c.lineWidth = 9; c.stroke(); edge([a, t, b]); };
      wing([520, 340], [870, 125], [770, 470], false);
      const neck = [[262, 545], [70, 300], [300, 505]]; poly(neck, MID); edge(neck, 26);
      const beak = [[70, 300], [52, 380], [104, 330]]; poly(beak, DARK); edge(beak, 22);
      const tail = [[762, 545], [960, 320], [730, 505]]; poly(tail, LIGHT); edge(tail, 26);
      const body = [[512, 330], [800, 480], [610, 618], [414, 618], [224, 480]];
      poly([[512, 330], [224, 480], [414, 618], [512, 618]], LIGHT); poly([[512, 330], [800, 480], [610, 618], [512, 618]], MID);
      c.strokeStyle = '#f5cf72'; c.lineWidth = 10; c.beginPath(); c.moveTo(512, 330); c.lineTo(512, 618); c.moveTo(224, 480); c.lineTo(512, 618); c.lineTo(800, 480); c.stroke();
      edge(body, 36);
      wing([254, 480], [150, 125], [512, 340], true);
      [[330, 560], [700, 530], [600, 400]].forEach(([x, y]) => { c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 9, 0, PI * 2); c.fill(); });
      face(c, 512, 470, 0.72, 'rgba(255,214,190,.75)');
      star(c, 150, 125, 42, GOLD, 12);
    },
  };

  class AppIcon extends HTMLElement {
    static get observedAttributes() { return ['form', 'size']; }
    connectedCallback() { if (!this.c) { this.c = document.createElement('canvas'); Object.assign(this.style, { display: 'block', lineHeight: '0' }); this.appendChild(this.c); } this.render(); }
    attributeChangedCallback() { this.render(); }
    render() {
      if (!this.c) return;
      const s = +this.getAttribute('size') || 180, d = Math.min(3, window.devicePixelRatio || 1), px = Math.round(s * d);
      this.c.width = px; this.c.height = px; this.c.style.width = s + 'px'; this.c.style.height = s + 'px';
      const c = this.c.getContext('2d'); c.setTransform(px / 1024, 0, 0, px / 1024, 0, 0);
      (DRAW[this.getAttribute('form')] || DRAW.sun)(c);
    }
  }
  window.drawAppIcon = (c, form) => (DRAW[form] || DRAW.sun)(c);
  if (!customElements.get('app-icon')) customElements.define('app-icon', AppIcon);
})();
