// FX layer: Web Audio graph (mono/crossfeed), spectrum, glyph reactivity, immersion.
const FX = {
  audioCtx: null,
  analyser: null,
  fft: null,
  cfGains: [],
  monoNode: null,
  raf: null,
  immersionOpen: false,

  init() {
    this.boot();
    this.buildLedStrip();
    this.wireSeek();
    this.tick();
  },

  /* ---------- boot sequence ---------- */
  boot() {
    if (sessionStorage.getItem('booted')) return;
    sessionStorage.setItem('booted', '1');
    const el = document.createElement('div');
    el.id = 'boot';
    el.innerHTML = `
      <div class="boot-inner">
        <div class="boot-mark">◉</div>
        <div class="boot-name">NOTHING</div>
        <div class="boot-sub">AUDIO OS · TP-01</div>
        <div class="dot-loader"><span></span><span></span><span></span></div>
        <div class="boot-log mono" id="boot-log"></div>
        <div class="boot-skip mono">CLICK TO SKIP</div>
      </div>`;
    document.body.appendChild(el);
    const log = document.getElementById('boot-log');
    const lines = ['> DAC ............ LOCKED', '> GLYPH BUS ...... 1:1 SYNC', '> NVME ARCHIVE ... MOUNTED', '> SIGNAL ......... WARM'];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) { const d = document.createElement('div'); d.textContent = lines[i++]; log.appendChild(d); }
      else { clearInterval(timer); dismiss(); }
    }, 380);
    function dismiss() { clearInterval(timer); el.classList.add('gone'); setTimeout(() => el.remove(), 450); }
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 1900);
  },

  /* ---------- Web Audio graph ---------- */
  ensureAnalyser() {
    if (this.audioCtx) return !!(this.analyser && this.fft);
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AC();
      const src = this.audioCtx.createMediaElementSource(Player.audio);
      const splitter = this.audioCtx.createChannelSplitter(2);
      const merger = this.audioCtx.createChannelMerger(2);

      // crossfeed: opposite channel, low-passed, delayed, attenuated
      const lpL = this.audioCtx.createBiquadFilter(); lpL.type = 'lowpass'; lpL.frequency.value = 700;
      const lpR = this.audioCtx.createBiquadFilter(); lpR.type = 'lowpass'; lpR.frequency.value = 700;
      const dL = this.audioCtx.createDelay(0.001); dL.delayTime.value = 0.00027;
      const dR = this.audioCtx.createDelay(0.001); dR.delayTime.value = 0.00027;
      const cfL = this.audioCtx.createGain(); cfL.gain.value = 0;
      const cfR = this.audioCtx.createGain(); cfR.gain.value = 0;
      this.cfGains = [cfL, cfR];
      src.connect(splitter);
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 1, 1);
      splitter.connect(lpL, 0); lpL.connect(dL); dL.connect(cfL); cfL.connect(merger, 0, 1);
      splitter.connect(lpR, 1); lpR.connect(dR); dR.connect(cfR); cfR.connect(merger, 0, 0);

      // mono downmix node (channelCount 1 sums L+R)
      this.monoNode = this.audioCtx.createGain();
      this.setMono(App.switches.mono);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      this.fft = new Uint8Array(this.analyser.frequencyBinCount);

      merger.connect(this.monoNode);
      this.monoNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.setCrossfeed(App.switches.crossfeed);
      return true;
    } catch { return false; }
  },

  setMono(on) {
    App.switches.mono = on;
    if (this.monoNode) {
      this.monoNode.channelCount = on ? 1 : 2;
      this.monoNode.channelCountMode = on ? 'explicit' : 'max';
    }
  },
  setCrossfeed(on) {
    App.switches.crossfeed = on;
    if (this.cfGains.length) this.cfGains.forEach(g => { g.gain.value = on ? 0.42 : 0; });
  },

  band(a, b) {
    if (!this.fft) return 0;
    let s = 0;
    for (let i = a; i < Math.min(b, this.fft.length); i++) s += this.fft[i];
    return s / Math.max(1, Math.min(b, this.fft.length) - a) / 255;
  },

  /* ---------- main loop ---------- */
  tick() {
    const step = () => {
      const playing = Player.isPlaying();
      const reactive = playing && App.switches.glyphSync && this.ensureAnalyser();
      if (reactive && this.audioCtx.state === 'suspended') this.audioCtx.resume();
      if (reactive) this.analyser.getByteFrequencyData(this.fft);
      else if (this.fft) this.fft.fill(0);

      const bass = reactive ? this.band(1, 8) : 0;
      const mid = reactive ? this.band(8, 32) : 0;
      const treb = reactive ? this.band(32, 96) : 0;

      this.updateHeaderGlyphs(reactive, bass, mid, treb);
      this.updateSpectrum(reactive);
      this.updateProgress();
      this.updateDeck(playing, reactive, bass, mid);
      if (this.immersionOpen) this.updateImmersion(reactive, bass, mid, treb);
      this.raf = requestAnimationFrame(step);
    };
    step();
  },

  updateHeaderGlyphs(reactive, bass, mid, treb, ) {
    const bars = [document.getElementById('gbar-0'), document.getElementById('gbar-1'), document.getElementById('gbar-2'), document.getElementById('gbar-3')];
    const vals = [bass, mid, treb, treb * 0.8 + bass * 0.2];
    bars.forEach((el, i) => {
      if (!el) return;
      const v = reactive ? vals[i] : 0;
      el.style.height = (4 + v * 10) + 'px';
      el.classList.toggle('lit', v > 0.35);
    });
    const st = document.getElementById('gm-status');
    if (st) st.textContent = reactive ? 'SYNCED' : Player.isPlaying() ? 'LOCAL' : 'IDLE';
  },

  updateSpectrum(reactive) {
    if (!document.getElementById('sp-0')) return;
    const bins = this.fft ? this.fft.length : 128;
    for (let i = 0; i < 16; i++) {
      const el = document.getElementById('sp-' + i);
      if (!el) continue;
      let v = 0;
      if (reactive) {
        const lo = Math.max(1, Math.floor(Math.pow(bins, i / 16)));
        const hi = Math.max(lo + 1, Math.floor(Math.pow(bins, (i + 1) / 16)));
        v = this.band(lo, hi);
      }
      el.style.height = Math.max(4, v * 100) + '%';
    }
  },

  updateProgress() {
    const a = Player.audio;
    if (!a) return;
    const dur = a.duration || 0;
    const t = a.currentTime || 0;
    const pct = dur ? t / dur : 0;
    UI.updateTime();
    // counter
    const tc = document.getElementById('tc-cur');
    if (tc) {
      tc.textContent = this.hundredths(t);
      const rem = document.getElementById('tc-rem');
      if (rem) rem.textContent = dur ? '-' + this.hundredths(Math.max(0, dur - t)) : '-00:00.00';
    }
    // ruler
    const fill = document.getElementById('ruler-fill');
    if (fill) {
      fill.style.width = (pct * 100) + '%';
      const tp = document.getElementById('tpoint');
      if (tp) tp.textContent = `T-POINT ${(pct * 100).toFixed(1)}%`;
    }
    // LED strip
    const leds = document.getElementById('led-strip');
    if (leds) {
      const lit = Math.floor(pct * leds.children.length);
      [...leds.children].forEach((seg, i) => {
        seg.className = 'led' + (i < lit ? ' lit' : i === lit && pct > 0 ? ' head' : '');
      });
    }
  },

  hundredths(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60), c = Math.floor((sec % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
  },

  updateDeck(playing, reactive, bass, mid) {
    // platter spin
    const core = document.getElementById('platter-core');
    if (core) core.style.animationPlayState = playing ? 'running' : 'paused';
    // glyph segments rotate with the beat
    const segs = document.querySelectorAll('.gl-seg');
    if (segs.length) {
      const count = reactive ? 3 + Math.round(bass * 4) : 0;
      const offset = Math.floor(performance.now() / (380 - Math.min(220, mid * 220))) % 8;
      segs.forEach((el, i) => el.classList.toggle('lit', reactive && (i - offset + 8) % 8 < count));
    }
    // play/pause label
    const ico = document.getElementById('t-pp-icon');
    if (ico) ico.textContent = playing ? '❚❚' : '▶';
    const lab = document.getElementById('t-pp-label');
    if (lab) lab.textContent = playing ? 'PAUSE' : 'PLAY';
    const engine = document.getElementById('pb-engine');
    if (engine) engine.textContent = playing ? 'ASIO DIRECT' : 'STANDBY';
  },

  /* ---------- seek wiring (delegated: survives view re-renders) ---------- */
  wireSeek() {
    let dragging = false, current = null;
    const pctOf = (el, e) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    };
    document.addEventListener('pointerdown', e => {
      const el = e.target.closest('#ruler, #led-strip, #imm-track');
      if (!el) return;
      dragging = true; current = el;
      Player.seekTo(pctOf(el, e));
    });
    document.addEventListener('pointermove', e => { if (dragging && current) Player.seekTo(pctOf(current, e)); });
    document.addEventListener('pointerup', () => { dragging = false; current = null; });
  },

  /* ---------- glyph immersion ---------- */

  onTrackChange(song) {
    const imm = document.getElementById('immersion');
    if (this.immersionOpen && song && imm) this.fillImmersion(song);
  },

  /* ---------- glyph immersion ---------- */
  fillImmersion(song) {
    if (!song) song = Player.current() || App.songs[0];
    document.getElementById('imm-art').style.backgroundImage = `url('${song.art}')`;
    document.getElementById('imm-title').textContent = song.title;
    document.getElementById('imm-artist').textContent = `${song.artist} · ${song.album} (Lossless)`;
    document.getElementById('imm-spec').textContent = song.hires ? song.spec.toUpperCase() : song.spec.toUpperCase();
    document.getElementById('imm-dr').textContent = song.dr;
    document.getElementById('imm-track-label').textContent = `NOW PLAYING // TRACK ${String(App.songs.indexOf(song) + 1).padStart(2, '0')}`;
    document.getElementById('imm-shuffle').classList.toggle('active', Player.shuffle);
    document.getElementById('imm-repeat').classList.toggle('active', Player.repeat !== 'off');
    document.getElementById('imm-mode').classList.toggle('off', !App.switches.glyphSync);
    document.getElementById('imm-mode').textContent = App.switches.glyphSync ? 'SYNC: 1:1' : 'SYNC: OFF';
    const pl = document.getElementById('imm-play');
    if (pl) pl.textContent = Player.isPlaying() ? '❚❚' : '▶';
  },
  openImmersion() {
    this.fillImmersion(Player.current());
    document.getElementById('immersion').classList.add('open');
    this.immersionOpen = true;
  },
  closeImmersion() {
    document.getElementById('immersion').classList.remove('open');
    this.immersionOpen = false;
  },
  updateImmersion(reactive, bass, mid, treb) {
    const playing = Player.isPlaying();
    const midRing = document.getElementById('glyph-ring-mid');
    const outerRing = document.getElementById('glyph-ring-outer');
    if (midRing) {
      midRing.style.strokeDashoffset = -(bass * 120);
      midRing.style.opacity = reactive ? 0.55 + bass * 0.45 : 0.25;
    }
    if (outerRing) {
      outerRing.style.strokeDashoffset = -(mid * 60 + performance.now() / 90 % 92);
      outerRing.style.opacity = reactive ? 0.4 + mid * 0.4 : 0.3;
    }
    const gr = document.getElementById('glow-red');
    if (gr) gr.style.transform = `scale(${1 + bass * 0.5})`;
    const gc = document.getElementById('glow-cyan');
    if (gc) gc.style.transform = `translate(-128px,-80px) scale(${1 + mid * 0.6})`;
    const ga = document.getElementById('glow-amber');
    if (ga) ga.style.transform = `translate(140px,96px) scale(${1 + treb * 0.5})`;
    const dot = document.getElementById('imm-dot');
    if (dot) dot.style.background = playing && reactive ? 'var(--cyan)' : 'var(--ink-4)';
    // progress
    const a = Player.audio;
    if (a && a.duration) {
      document.getElementById('imm-fill').style.width = (a.currentTime / a.duration * 100) + '%';
      document.getElementById('imm-cur').textContent = fmtTime(a.currentTime);
      document.getElementById('imm-dur').textContent = fmtTime(a.duration);
    }
    const pl = document.getElementById('imm-play');
    if (pl) pl.textContent = playing ? '❚❚' : '▶';
    document.getElementById('imm-shuffle')?.classList.toggle('active', Player.shuffle);
    document.getElementById('imm-repeat')?.classList.toggle('active', Player.repeat !== 'off');
    const mode = document.getElementById('imm-mode');
    if (mode) {
      mode.classList.toggle('off', !App.switches.glyphSync);
      mode.textContent = App.switches.glyphSync ? 'SYNC: 1:1' : 'SYNC: OFF';
    }
    const lu = document.getElementById('imm-lufs');
    if (lu) {
      const lvl = reactive ? this.band(2, 40) : 0;
      lu.textContent = 'LUFS ' + (lvl > 0.001 ? (20 * Math.log10(lvl)).toFixed(1) : '-14.2');
    }
  },

  /* ---------- footer LED strip ---------- */
  buildLedStrip() {
    const strip = document.getElementById('led-strip');
    if (!strip) return;
    strip.innerHTML = Array.from({ length: 20 }, () => '<div class="led"></div>').join('');
  },
};
