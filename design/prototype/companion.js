// <dusk-buddy size="48" mood="calm|happy|wave|nod|think|sleepy|plain"> — a little sun dipping into the evening sea.
(function () {
  if (customElements.get('dusk-buddy')) return;
  const INK = '#3a1d2a';
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
      if (name === 'form' && o !== v && o !== null) this.formAt = performance.now();
      if (name === 'size') this.setup();
    }
    setup() {
      if (!this.c) return;
      const s = +this.getAttribute('size') || 48, d = Math.min(3, window.devicePixelRatio || 1);
      this.s = s;
      this.c.width = Math.round(s * d); this.c.height = Math.round(s * d);
      this.c.style.width = s + 'px'; this.c.style.height = s + 'px';
      this.ctx = this.c.getContext('2d');
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    rnd(i, f) { const x = Math.sin(i * 127.1 + f * 311.7 + this.seed) * 43758.5453; return x - Math.floor(x); }
    draw(t) {
      const ctx = this.ctx, s = this.s; if (!ctx) return;
      const mood = this.getAttribute('mood') || 'calm';
      const plain = mood === 'plain';
      const mx = this.getAttribute('form') === 'max' && !plain;
      const el = (t - this.t0) / 1000, since = (t - this.moodAt) / 1000, sinceF = this.formAt ? (t - this.formAt) / 1000 : 99;
      const f = Math.floor(el * 6);
      const j = (i, a) => (this.rnd(i, f) - 0.5) * 2 * a * s;
      const lw = Math.max(1.3, s * 0.034);
      ctx.clearRect(0, 0, s, s);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      const breathe = mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02;
      let hop = 0, tilt = 0;
      if (mood === 'happy') hop = -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025);
      if (mood === 'nod') tilt = Math.sin(el * 2.6) * 0.08;
      if (mood === 'think') tilt = -0.07;
      if (mood === 'wave') tilt = Math.sin(el * 2) * 0.03;

      const cx = s / 2, rx = s * 0.3, ry = s * 0.28 * (1 + breathe), cy = s * 0.57 + hop - breathe * s * 0.1;
      const hz = cy + ry * 0.3;

      // ground shadow
      ctx.fillStyle = 'rgba(30,10,30,.16)';
      ctx.beginPath(); ctx.ellipse(cx, s * 0.92, rx * (0.85 + hop / s), s * 0.03, 0, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.translate(cx, cy + ry); ctx.rotate(tilt); ctx.translate(-cx, -(cy + ry));
      const ringPart = (front) => {
        const RX = rx * 1.55, RY = ry * 0.4;
        ctx.save(); ctx.translate(cx, cy + ry * 0.05); ctx.rotate(-0.28);
        const gr = ctx.createLinearGradient(-RX, 0, RX, 0); gr.addColorStop(0, '#ffd36e'); gr.addColorStop(0.5, '#ff9fd0'); gr.addColorStop(1, '#9d8bff');
        ctx.strokeStyle = gr; ctx.lineWidth = lw * 1.35;
        ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke();
        [0, Math.PI].forEach((ph, n) => {
          const a = el * 1.1 + ph, sn = Math.sin(a); if ((sn > 0) !== front) return;
          ctx.beginPath(); ctx.arc(Math.cos(a) * RX, sn * RY, s * (n ? 0.024 : 0.032), 0, Math.PI * 2);
          ctx.fillStyle = n ? '#c9b8ff' : '#fff1c4'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.6; ctx.stroke();
        });
        ctx.restore();
      };
      const star = (x, y, r, col) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.5; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.32, -r * 0.32); ctx.lineTo(r, 0); ctx.lineTo(r * 0.32, r * 0.32); ctx.lineTo(0, r); ctx.lineTo(-r * 0.32, r * 0.32); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.32, -r * 0.32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
      if (mx) ringPart(false);

      // feet
      [-1, 1].forEach((k, n) => {
        ctx.beginPath(); ctx.ellipse(cx + k * s * 0.11 + j(90 + n, 0.003), cy + ry * 0.98, s * 0.062, s * 0.034, 0, 0, Math.PI * 2);
        ctx.fillStyle = plain ? '#8d848a' : mx ? '#5a46c0' : '#9b3f5f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.85; ctx.stroke();
      });

      // rays (crown)
      if (!plain) {
        const pulse = mood === 'happy' ? 1.25 + Math.sin(el * 8) * 0.12 : mood === 'sleepy' ? 0.7 : 1;
        (mx ? [-1.12, -0.56, 0, 0.56, 1.12] : [-0.62, 0, 0.62]).forEach((da, n, arr) => {
          const a = -Math.PI / 2 + da + Math.sin(el * 1.8 + n) * 0.05;
          const mid = n === (arr.length - 1) / 2, r0 = 1.12, r1 = 1.12 + (mid ? 0.38 : 0.28) * pulse;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * rx * r0 + j(70 + n, 0.004), cy + Math.sin(a) * ry * r0);
          ctx.lineTo(cx + Math.cos(a) * rx * r1 + j(75 + n, 0.006), cy + Math.sin(a) * ry * r1 + j(78 + n, 0.006));
          ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.05; ctx.stroke();
          if (mx) star(cx + Math.cos(a) * rx * (r1 + 0.1), cy + Math.sin(a) * ry * (r1 + 0.1), s * (mid ? 0.05 : 0.036) * (0.85 + Math.sin(el * 4 + n) * 0.15), '#ffd36e');
        });
      }

      // body path
      const N = 22, pts = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2, sn = Math.sin(a);
        pts.push([cx + Math.cos(a) * rx * (1 + 0.07 * Math.max(0, sn)) + j(i, 0.0045), cy + sn * ry * (sn > 0 ? 0.96 : 1.04) + j(i + 40, 0.0045)]);
      }
      const body = () => {
        ctx.beginPath();
        const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const m0 = mid(pts[N - 1], pts[0]); ctx.moveTo(m0[0], m0[1]);
        for (let i = 0; i < N; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % N]); ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
        ctx.closePath();
      };

      // arms (behind when resting)
      const arm = (side, up, wav) => {
        const ax = cx + side * rx * (up ? 0.92 : 1.02), ay = up ? cy - ry * 0.32 : cy + ry * 0.18;
        let rot = side * (up ? -0.9 : 0.35);
        if (wav) rot = side * (-1.1 + Math.sin(el * 9) * 0.45);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(rot);
        ctx.beginPath(); ctx.ellipse(0, up ? -s * 0.03 : 0, s * 0.045, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fillStyle = plain ? '#d6cec9' : mx ? '#ffc1d8' : '#ffb27c'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.85; ctx.stroke();
        ctx.restore();
      };
      const armsUp = mood === 'happy';
      const waving = mood === 'wave';
      if (!armsUp && !waving) { arm(-1, false); arm(1, false); }

      // fill: sky-sun top, sea bottom
      body();
      ctx.save(); ctx.clip();
      const g = ctx.createLinearGradient(0, cy - ry, 0, hz);
      if (plain) { g.addColorStop(0, '#ece6e1'); g.addColorStop(1, '#cfc6c0'); }
      else if (mx) { g.addColorStop(0, '#fff1c4'); g.addColorStop(0.5, '#ffa8c8'); g.addColorStop(1, '#b48cff'); }
      else { g.addColorStop(0, '#ffe2a6'); g.addColorStop(0.55, '#ffb070'); g.addColorStop(1, '#ff8a5c'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      // sea band with a gentle wave
      ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= s; x += s / 24) ctx.lineTo(x, hz + Math.sin(x / s * 14 + el * 2.4) * s * 0.008);
      ctx.lineTo(s, s); ctx.lineTo(0, s); ctx.closePath();
      const g2 = ctx.createLinearGradient(0, hz, 0, cy + ry);
      if (plain) { g2.addColorStop(0, '#a79ea4'); g2.addColorStop(1, '#8d848a'); }
      else if (mx) { g2.addColorStop(0, '#5a46c0'); g2.addColorStop(1, '#241a6e'); }
      else { g2.addColorStop(0, '#e8607a'); g2.addColorStop(1, '#a8406c'); }
      ctx.fillStyle = g2; ctx.fill();
      // horizon line + glints
      ctx.strokeStyle = plain ? 'rgba(60,50,60,.35)' : 'rgba(90,20,50,.45)'; ctx.lineWidth = lw * 0.6;
      ctx.beginPath(); for (let x = 0; x <= s; x += s / 24) { const y = hz + Math.sin(x / s * 14 + el * 2.4) * s * 0.008; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      if (!plain) {
        ctx.strokeStyle = 'rgba(255,225,200,.75)'; ctx.lineWidth = lw * 0.55;
        [[0.12, 0.55, 0.07], [-0.14, 0.72, 0.05], [0.05, 0.86, 0.04]].forEach(([ox, oy, w], n) => {
          const gx = cx + ox * s + Math.sin(el * 1.6 + n) * s * 0.01, gy = hz + (cy + ry - hz) * oy - s * 0.02;
          ctx.beginPath(); ctx.moveTo(gx - w * s / 2, gy); ctx.lineTo(gx + w * s / 2, gy); ctx.stroke();
        });
      }
      if (mx) { [[0.36, 0.3], [0.6, 0.55], [0.46, 0.8], [0.7, 0.25]].forEach(([px, py], n) => { const a = 0.4 + 0.6 * Math.abs(Math.sin(el * 2.2 + n * 1.7)); ctx.fillStyle = 'rgba(255,240,255,' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(cx - rx + px * rx * 2, hz + (cy + ry - hz) * py, s * 0.009, 0, Math.PI * 2); ctx.fill(); }); }
      // specular
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(cx - rx * 0.48, cy - ry * 0.58, s * 0.05, s * 0.025, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - rx * 0.22, cy - ry * 0.78, s * 0.011, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      body(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();

      if (armsUp) { arm(-1, true); arm(1, true); }
      if (waving) { arm(-1, false); arm(1, true, true); }

      // cheeks
      if (!plain) {
        ctx.fillStyle = 'rgba(255,92,120,.42)';
        [-1, 1].forEach((k) => { ctx.beginPath(); ctx.ellipse(cx + k * s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, 0, Math.PI * 2); ctx.fill(); });
      }

      // eyes
      const ex = s * 0.1, ey = cy - ry * 0.2;
      const blink = (mood === 'calm' || mood === 'think' || mood === 'wave') && (el % 4.1) > 3.96;
      const look = mood === 'think' ? [s * 0.012, -s * 0.014] : [0, 0];
      ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = lw;
      [-1, 1].forEach((k, n) => {
        const x = cx + k * ex + j(95 + n, 0.002), y = ey;
        ctx.beginPath();
        if (mood === 'happy') { ctx.arc(x, y + s * 0.022, s * 0.038, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke(); }
        else if (mood === 'nod' || mood === 'sleepy' || blink) { ctx.arc(x, y - s * 0.012, s * 0.034, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
        else if (plain) { ctx.arc(x, y, s * 0.026, 0, Math.PI * 2); ctx.fill(); }
        else {
          ctx.ellipse(x, y, s * 0.037, s * 0.047, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(x + s * 0.011 + look[0], y - s * 0.015 + look[1], s * 0.014, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x - s * 0.01 + look[0], y + s * 0.016 + look[1], s * 0.006, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = INK;
        }
      });

      // mouth
      const my = cy + ry * 0.1;
      ctx.beginPath(); ctx.lineWidth = lw;
      if (mood === 'happy') {
        ctx.moveTo(cx - s * 0.05, my - s * 0.005); ctx.quadraticCurveTo(cx, my + s * 0.085, cx + s * 0.05, my - s * 0.005); ctx.closePath();
        ctx.fillStyle = '#6e2236'; ctx.fill(); ctx.stroke();
        ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7f96'; ctx.beginPath(); ctx.ellipse(cx, my + s * 0.055, s * 0.03, s * 0.02, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (plain) { ctx.moveTo(cx - s * 0.03, my + s * 0.01); ctx.lineTo(cx + s * 0.03, my + s * 0.01); ctx.stroke(); }
      else if (mood === 'sleepy' || mood === 'think') { ctx.ellipse(cx + (mood === 'think' ? s * 0.02 : 0), my + s * 0.012, s * 0.014, s * 0.018, 0, 0, Math.PI * 2); ctx.fillStyle = '#6e2236'; ctx.fill(); }
      else { ctx.moveTo(cx - s * 0.035, my); ctx.quadraticCurveTo(cx, my + s * 0.04, cx + s * 0.035, my); ctx.stroke(); }
      if (mx) ringPart(true);
      ctx.restore();

      // extras
      if (mood === 'happy' || mx) {
        [[0.14, 0.2, 0], [0.86, 0.28, 1.3], [0.8, 0.08, 2.4]].forEach(([px, py, ph]) => {
          const k = Math.max(0, Math.sin(el * 3 + ph));
          const r = s * 0.045 * k; if (r < 0.5) return;
          ctx.save(); ctx.translate(px * s, py * s); ctx.rotate(Math.PI / 4 * 0);
          ctx.fillStyle = '#ffd36e'; ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.6;
          ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.35, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.35, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, r * 0.35); ctx.lineTo(r, 0); ctx.lineTo(0, -r * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
      }
      if (mood === 'sleepy') {
        const ph = (el * 0.5) % 1;
        ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.fillStyle = '#c9b8ff';
        ctx.font = `italic ${Math.round(s * 0.2)}px Newsreader, Georgia, serif`;
        ctx.fillText('z', s * (0.74 + ph * 0.08), s * (0.3 - ph * 0.14));
        ctx.font = `italic ${Math.round(s * 0.13)}px Newsreader, Georgia, serif`;
        ctx.fillText('z', s * (0.86 + ph * 0.05), s * (0.16 - ph * 0.1));
        ctx.restore();
      }
      if (mood === 'think') {
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.6;
        [[0.78, 0.3, 0.025], [0.86, 0.18, 0.04]].forEach(([px, py, r], n) => {
          ctx.beginPath(); ctx.arc(px * s, py * s - Math.sin(el * 2 + n) * s * 0.01, r * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
      }
      if (mx && sinceF < 1.4) {
        const p = sinceF / 1.4;
        ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = lw * 2.2 * (1 - p) + 0.5;
        ctx.beginPath(); ctx.arc(s / 2, s * 0.57, s * (0.16 + p * 0.34), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,210,' + (0.6 * (1 - p) * (1 - p)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(s / 2, s * 0.55, s * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }
  customElements.define('dusk-buddy', DuskBuddy);
})();
