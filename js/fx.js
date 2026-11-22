// FX layer: boot, audio-reactive dots, tilt, sparks, party mode
const FX = {
  audioCtx: null,
  analyser: null,
  fft: null,
  raf: null,
  logoClicks: 0,
  waveBars: [],
  waveSongId: null,

  init() {
    this.boot();
    this.spotlight();
    this.tilt();
    this.party();
    this.scrambleNav();
    this.wireWave();
    this.tick();
  },

  /* ---------- boot sequence ---------- */
  boot() {
    const el = document.createElement('div');
    el.id = 'boot';
    el.innerHTML = `
      <div class="boot-inner">
        <div class="boot-mark">◉</div>
        <div class="boot-name">NOTHING</div>
        <div class="boot-sub">MUSIC OS · V1.0</div>
        <div class="dot-loader"><span></span><span></span><span></span></div>
        <div class="boot-log mono" id="boot-log"></div>
        <div class="boot-skip mono">CLICK TO SKIP</div>
      </div>`;
    document.body.appendChild(el);
    const log = document.getElementById('boot-log');
    const lines = ['> DOT MATRIX ......... OK', '> NEON ............... OK', '> SILENCE .... DETECTED', '> MAKING NOISE .......'];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        const line = document.createElement('div');
        line.textContent = lines[i++];
        log.appendChild(line);
      } else { clearInterval(timer); dismiss(); }
    }, 420);
    const dismiss = () => {
      clearInterval(timer);
      el.classList.add('gone');
      setTimeout(() => el.remove(), 500);
    };
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 2600);
  },

  /* ---------- Web Audio FFT ---------- */
  ensureAnalyser() {
    if (this.audioCtx) return !!(this.analyser && this.fft);
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = this.audioCtx.createMediaElementSource(Player.audio);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      src.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.fft = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch { return false; }
  },

  /* ---------- audio-reactive dot matrix canvas ---------- */
  drawDots() {
    const canvas = document.getElementById('hero-dots');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width !== rect.width * devicePixelRatio) {
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const playing = Player.isPlaying();
    const reactive = playing && this.ensureAnalyser();
    if (reactive) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      this.analyser.getByteFrequencyData(this.fft);
    }
    const gap = 14;
    const t = performance.now() / 1000;
    let bin = 0;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        let a, color;
        if (reactive) {
          const f = this.fft[bin++ % this.fft.length] / 255;
          const wave = Math.sin(t * 3 + x * 0.02 + y * 0.03) * 0.15;
          a = Math.min(1, f * 2.4 + wave + 0.05);
          color = a > 0.55 ? `rgba(0,245,255,${a})` : a > 0.3 ? `rgba(0,245,255,${a * 0.6})` : `rgba(46,46,46,${0.5 + a})`;
        } else {
          a = 0.12 + Math.sin(t + x * 0.015 + y * 0.02) * 0.06;
          color = `rgba(255,255,255,${a})`;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, reactive && a > 0.5 ? 1.8 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  /* ---------- main loop ---------- */
  tick() {
    const step = () => {
      const a = Player.audio;
      const playing = Player.isPlaying();
      this.drawDots();
      this.drawSignal(playing);
      this.reactiveEq(playing);
      this.drawWave(playing);
      // progress ring
      const ring = document.getElementById('play-ring-fill');
      if (ring && a && a.duration) ring.style.strokeDashoffset = 169.65 * (1 - a.currentTime / a.duration);
      // spinning logo + art
      document.querySelector('.logo-mark')?.classList.toggle('spinning', playing);
      document.getElementById('pb-art')?.classList.toggle('spinning', playing);
      document.getElementById('pb-bpm')?.classList.toggle('live', playing);
      // top progress line
      const line = document.getElementById('pb-line');
      if (line && a && a.duration) line.style.width = (a.currentTime / a.duration * 100) + '%';
      // track changed?
      const cur = Player.current();
      const curId = cur ? cur.id : null;
      if (curId !== this.waveSongId) this.onTrackChange(cur);
      this.raf = requestAnimationFrame(step);
    };
    step();
  },

  /* ---------- sidebar signal monitor ---------- */
  drawSignal(playing) {
    const canvas = document.getElementById('signal-canvas');
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth - 24;
    if (canvas.width !== w) canvas.width = w;
    const ctx = canvas.getContext('2d');
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bars = 22, gap = 3, bw = (w - (bars - 1) * gap) / bars;
    const t = performance.now() / 1000;
    let avg = 0;
    for (let i = 0; i < bars; i++) {
      let v;
      if (playing && this.analyser) {
        this.analyser.getByteFrequencyData(this.fft);
        v = this.fft[Math.floor(i / bars * this.fft.length * 0.7)] / 255;
        avg += v;
        v = Math.max(v, 0.05);
      } else {
        v = 0.08 + Math.abs(Math.sin(t * 1.4 + i * 0.5)) * 0.08;
      }
      const bh = Math.max(2, v * (h - 4));
      const x = i * (bw + gap);
      const hue = i / bars;
      const color = hue < 0.5 ? '#00F5FF' : hue < 0.8 ? '#39FF14' : '#FF2D2D';
      ctx.fillStyle = playing ? color : '#2E2E2E';
      if (playing) { ctx.shadowColor = color; ctx.shadowBlur = 5; } else ctx.shadowBlur = 0;
      ctx.fillRect(x, h - bh, bw, bh);
    }
    ctx.shadowBlur = 0;
    const db = document.getElementById('signal-db');
    if (db) db.textContent = playing && this.analyser ? `${Math.round(-46 + (avg / bars) * 46)} dB` : '-- dB';
  },

  /* ---------- EQ bars driven by real audio ---------- */
  reactiveEq(playing) {
    const apply = (container) => {
      if (!container) return;
      const bars = container.querySelectorAll('.eq-bar');
      if (playing && this.analyser) {
        container.classList.remove('idle');
        container.classList.remove('live');
        this.analyser.getByteFrequencyData(this.fft);
        bars.forEach((b, i) => {
          const v = this.fft[2 + i * 6] / 255;
          b.style.height = Math.max(3, v * (container.id === 'pb-eq' ? 24 : 48)) + 'px';
        });
      } else {
        container.classList.add('idle');
        bars.forEach(b => b.style.height = '');
      }
    };
    apply(document.getElementById('pb-eq'));
    apply(document.querySelector('.hero-eq'));
  },

  /* ---------- waveform seekbar ---------- */
  buildWave(song) {
    const seed = [...(song ? song.id : 'x')].reduce((a, c) => a + c.charCodeAt(0), 7);
    const rand = (i) => {
      const x = Math.sin(seed * 31.7 + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    this.waveBars = Array.from({ length: 110 }, (_, i) => {
      const env = 0.35 + 0.65 * Math.abs(Math.sin(i / 14));
      return Math.max(0.12, rand(i) * env);
    });
    this.waveSongId = song ? song.id : null;
  },
  drawWave(playing) {
    const canvas = document.getElementById('pb-wave');
    if (!canvas) return;
    if (!this.waveBars.length) this.buildWave(Player.current());
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * devicePixelRatio) {
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const a = Player.audio;
    const pct = a && a.duration ? a.currentTime / a.duration : 0;
    const n = this.waveBars.length;
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const played = i / n <= pct;
      const bh = this.waveBars[i] * (h - 6);
      ctx.fillStyle = played ? '#00F5FF' : '#2E2E2E';
      ctx.shadowColor = '#00F5FF';
      ctx.shadowBlur = played ? 4 : 0;
      ctx.fillRect(i * bw + 0.5, (h - bh) / 2, Math.max(1, bw - 1.6), bh);
    }
    ctx.shadowBlur = 0;
    // red playhead
    ctx.fillStyle = '#FF2D2D';
    ctx.shadowColor = '#FF2D2D';
    ctx.shadowBlur = 8;
    ctx.fillRect(pct * w - 1, 0, 2, h);
    ctx.shadowBlur = 0;
  },
  wireWave() {
    const canvas = document.getElementById('pb-wave');
    if (!canvas) return;
    let dragging = false;
    const seek = (e) => {
      const r = canvas.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      Player.seekTo(pct);
    };
    canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); seek(e); });
    canvas.addEventListener('pointermove', e => { if (dragging) seek(e); });
    canvas.addEventListener('pointerup', () => dragging = false);
  },

  onTrackChange(song) {
    this.buildWave(song);
    const bpm = document.getElementById('pb-bpm');
    if (bpm && song) {
      const seed = [...song.id].reduce((a, c) => a + c.charCodeAt(0), 0);
      bpm.textContent = `${84 + (seed % 64)} BPM`;
    }
    const title = document.getElementById('pb-title');
    if (title && song) {
      title.textContent = song.title;
      requestAnimationFrame(() => {
        if (title.scrollWidth > title.clientWidth + 8) {
          title.innerHTML = `<span class="marquee-track"><span>${esc(song.title)}</span><span>${esc(song.title)}</span></span>`;
        }
      });
    }
  },

  /* ---------- nav text scramble ---------- */
  scrambleNav() {
    const chars = '◉·#01%&';
    document.querySelectorAll('#nav a').forEach(a => {
      const el = a.querySelector('.nav-text');
      if (!el) return;
      const original = el.textContent;
      let timer = null;
      a.addEventListener('mouseenter', () => {
        let frame = 0;
        clearInterval(timer);
        timer = setInterval(() => {
          el.textContent = original.split('').map((c, i) =>
            i < frame / 2 ? c : chars[Math.floor(Math.random() * chars.length)]
          ).join('');
          if (++frame > original.length * 2) { clearInterval(timer); el.textContent = original; }
        }, 32);
      });
      a.addEventListener('mouseleave', () => { clearInterval(timer); el.textContent = original; });
    });
  },

  /* ---------- cursor spotlight ---------- */
  spotlight() {
    document.addEventListener('mousemove', e => {
      const hero = document.querySelector('.hero');
      if (hero) {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      }
      const dot = document.getElementById('cursor-dot');
      if (dot) {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    }, { passive: true });
  },

  /* ---------- 3D tilt on album cards ---------- */
  tilt() {
    document.addEventListener('mousemove', e => {
      const card = e.target.closest('.album-card, .pl-card');
      document.querySelectorAll('.tilting').forEach(el => {
        if (el !== card) { el.classList.remove('tilting'); el.style.transform = ''; }
      });
      if (!card) return;
      const art = card.querySelector('.album-art, .pl-cover');
      if (!art) return;
      card.classList.add('tilting');
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      art.style.transform = `perspective(600px) rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg) scale(1.03)`;
      art.style.boxShadow = `${-dx * 20}px ${dy * 10 + 12}px 30px rgba(0,245,255,.15)`;
    }, { passive: true });
    document.addEventListener('mouseleave', () => {
      document.querySelectorAll('.tilting .album-art, .tilting .pl-cover').forEach(a => { a.style.transform = ''; });
    });
  },

  /* ---------- heart sparks ---------- */
  sparks(x, y, color = '#FFB800') {
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const angle = (i / 8) * Math.PI * 2;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.background = color;
      s.style.boxShadow = `0 0 8px ${color}`;
      s.style.setProperty('--dx', Math.cos(angle) * (24 + Math.random() * 18) + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * (24 + Math.random() * 18) + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 650);
    }
  },

  /* ---------- party mode (click logo 5x) ---------- */
  party() {
    document.querySelector('.logo').style.cursor = 'pointer';
    document.querySelector('.logo').addEventListener('click', () => {
      this.logoClicks++;
      if (this.logoClicks >= 5) {
        this.logoClicks = 0;
        document.body.classList.add('party');
        toast('◉ PARTY MODE — NO SILENCE DETECTED');
        this.sparks(innerWidth / 2, innerHeight / 2, '#FF2D2D');
        this.sparks(innerWidth / 2, innerHeight / 2, '#00F5FF');
        setTimeout(() => document.body.classList.remove('party'), 6000);
      }
    });
  },
};

// Dot-rendered track numbers (3x5 dot matrix digits)
const DOT_DIGITS = {
  0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [7, 1, 7, 4, 7], 3: [7, 1, 7, 1, 7],
  4: [5, 5, 7, 1, 1], 5: [7, 4, 7, 1, 7], 6: [7, 4, 7, 5, 7], 7: [7, 1, 1, 2, 2],
  8: [7, 5, 7, 5, 7], 9: [7, 5, 7, 1, 7],
};
function dotNumber(n) {
  const digits = String(n).split('');
  const cols = digits.length * 4 - 1;
  let rects = '';
  digits.forEach((d, di) => {
    const pattern = DOT_DIGITS[d] || [0, 0, 0, 0, 0];
    pattern.forEach((row, ry) => {
      for (let rx = 0; rx < 3; rx++) {
        if (row & (1 << (2 - rx))) {
          rects += `<circle cx="${di * 4 + rx}" cy="${ry}" r="0.42"/>`;
        }
      }
    });
  });
  return `<svg class="dot-num" viewBox="-0.5 -0.5 ${cols} 5" width="${cols * 3.4}" height="17" fill="currentColor">${rects}</svg>`;
}
