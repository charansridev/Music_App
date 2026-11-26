import { useCallback, useEffect, useRef } from 'react';
import { formatHundredths, formatTime } from '../lib/utils.js';

function elementById(id) {
  return document.getElementById(id);
}

export function useAudioFX({ audio, isPlaying, glyphSync, mono, crossfeed, immersionOpen, sinkId = '' }) {
  const audioRef = useRef(audio);
  const graphRef = useRef(null);
  const settingsRef = useRef({ glyphSync, mono, crossfeed });
  const playingRef = useRef(isPlaying);
  const immersionRef = useRef(immersionOpen);
  const sinkIdRef = useRef(sinkId);

  audioRef.current = audio;
  settingsRef.current = { glyphSync, mono, crossfeed };
  playingRef.current = isPlaying;
  immersionRef.current = immersionOpen;
  sinkIdRef.current = sinkId;

  const ensureGraph = useCallback(() => {
    if (graphRef.current) return true;
    const element = audioRef.current;
    if (!element) return false;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      if (sinkIdRef.current && typeof context.setSinkId === 'function') {
        context.setSinkId(sinkIdRef.current).catch(() => {});
      }
      const source = context.createMediaElementSource(element);
      const splitter = context.createChannelSplitter(2);
      const merger = context.createChannelMerger(2);
      const lowPassLeft = context.createBiquadFilter();
      const lowPassRight = context.createBiquadFilter();
      const delayLeft = context.createDelay(0.001);
      const delayRight = context.createDelay(0.001);
      const crossfeedLeft = context.createGain();
      const crossfeedRight = context.createGain();
      const monoNode = context.createGain();
      const analyser = context.createAnalyser();

      lowPassLeft.type = 'lowpass';
      lowPassRight.type = 'lowpass';
      lowPassLeft.frequency.value = 700;
      lowPassRight.frequency.value = 700;
      delayLeft.delayTime.value = 0.00027;
      delayRight.delayTime.value = 0.00027;
      crossfeedLeft.gain.value = settingsRef.current.crossfeed ? 0.42 : 0;
      crossfeedRight.gain.value = settingsRef.current.crossfeed ? 0.42 : 0;
      monoNode.channelCount = settingsRef.current.mono ? 1 : 2;
      monoNode.channelCountMode = settingsRef.current.mono ? 'explicit' : 'max';

      source.connect(splitter);
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 1, 1);
      splitter.connect(lowPassLeft, 0);
      lowPassLeft.connect(delayLeft);
      delayLeft.connect(crossfeedLeft);
      crossfeedLeft.connect(merger, 0, 1);
      splitter.connect(lowPassRight, 1);
      lowPassRight.connect(delayRight);
      delayRight.connect(crossfeedRight);
      crossfeedRight.connect(merger, 0, 0);
      merger.connect(monoNode);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      monoNode.connect(analyser);
      analyser.connect(context.destination);

      graphRef.current = {
        context,
        analyser,
        fft: new Uint8Array(analyser.frequencyBinCount),
        crossfeedGains: [crossfeedLeft, crossfeedRight],
        monoNode,
      };
      return true;
    } catch {
      return false;
    }
  }, []);

  const band = useCallback((start, end) => {
    const graph = graphRef.current;
    if (!graph) return 0;
    let sum = 0;
    const limit = Math.min(end, graph.fft.length);
    for (let index = start; index < limit; index++) sum += graph.fft[index];
    return sum / Math.max(1, limit - start) / 255;
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.monoNode.channelCount = mono ? 1 : 2;
    graph.monoNode.channelCountMode = mono ? 'explicit' : 'max';
  }, [mono]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.crossfeedGains.forEach((gain) => {
      gain.gain.value = crossfeed ? 0.42 : 0;
    });
  }, [crossfeed]);

  useEffect(() => {
    const context = graphRef.current?.context;
    if (!context || typeof context.setSinkId !== 'function') return;
    context.setSinkId(sinkId || '').catch(() => {});
  }, [sinkId]);

  useEffect(() => {
    if (!audio) return undefined;
    let frameId;

    const updateSpectrum = (reactive) => {
      if (!elementById('sp-0')) return;
      const graph = graphRef.current;
      const bins = graph?.fft.length || 128;
      for (let index = 0; index < 16; index++) {
        const bar = elementById(`sp-${index}`);
        if (!bar) continue;
        let value = 0;
        if (reactive) {
          const low = Math.max(1, Math.floor(Math.pow(bins, index / 16)));
          const high = Math.max(low + 1, Math.floor(Math.pow(bins, (index + 1) / 16)));
          value = band(low, high);
        }
        bar.style.height = `${Math.max(4, value * 100)}%`;
      }
    };

    const updateProgress = () => {
      const total = Number.isFinite(audio.duration) ? audio.duration : 0;
      const time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const percentage = total ? time / total : 0;
      const currentLabel = elementById('pb-cur');
      const durationLabel = elementById('pb-dur');
      if (currentLabel) currentLabel.textContent = formatTime(time);
      if (durationLabel) durationLabel.textContent = formatTime(total);

      const counter = elementById('tc-cur');
      if (counter) {
        counter.textContent = formatHundredths(time);
        const remaining = elementById('tc-rem');
        if (remaining) remaining.textContent = total ? `-${formatHundredths(Math.max(0, total - time))}` : '-00:00.00';
      }

      const rulerFill = elementById('ruler-fill');
      if (rulerFill) {
        rulerFill.style.width = `${percentage * 100}%`;
        const point = elementById('tpoint');
        if (point) point.textContent = `T-POINT ${(percentage * 100).toFixed(1)}%`;
      }

      const strip = elementById('led-strip');
      if (strip) {
        const lit = Math.floor(percentage * strip.children.length);
        [...strip.children].forEach((segment, index) => {
          segment.className = `led${index < lit ? ' lit' : index === lit && percentage > 0 ? ' head' : ''}`;
        });
      }

      const immersionFill = elementById('imm-fill');
      if (immersionFill) immersionFill.style.width = `${percentage * 100}%`;
      const immersionCurrent = elementById('imm-cur');
      const immersionDuration = elementById('imm-dur');
      if (immersionCurrent) immersionCurrent.textContent = formatTime(time);
      if (immersionDuration) immersionDuration.textContent = formatTime(total);
    };

    const updateGlyphSegments = (selector, reactive, bass, mid) => {
      const segments = document.querySelectorAll(selector);
      if (!segments.length) return;
      const count = reactive ? 3 + Math.round(bass * 4) : 0;
      const offset = Math.floor(performance.now() / (380 - Math.min(220, mid * 220))) % 8;
      segments.forEach((segment, index) => {
        segment.classList.toggle('lit', reactive && (index - offset + 8) % 8 < count);
      });
    };

    const updateDeck = (playing, reactive, bass, mid) => {
      const core = elementById('platter-core');
      if (core) core.style.animationPlayState = playing ? 'running' : 'paused';
      updateGlyphSegments('.gl-seg', reactive, bass, mid);
      const engine = elementById('pb-engine');
      if (engine) engine.textContent = playing ? 'PLAYING' : 'STANDBY';
    };

    const updateImmersion = (playing, reactive, bass, mid) => {
      const platterCore = elementById('imm-platter-core');
      if (platterCore) platterCore.style.animationPlayState = playing ? 'running' : 'paused';
      updateGlyphSegments('.imm-gl-seg', reactive, bass, mid);

      const middleRing = elementById('glyph-ring-mid');
      const outerRing = elementById('glyph-ring-outer');
      if (middleRing) {
        middleRing.style.strokeDashoffset = String(-(bass * 120));
        middleRing.style.opacity = String(reactive ? 0.55 + bass * 0.45 : 0.25);
      }
      if (outerRing) {
        outerRing.style.strokeDashoffset = String(-(mid * 60 + (performance.now() / 90) % 92));
        outerRing.style.opacity = String(reactive ? 0.4 + mid * 0.4 : 0.3);
      }
      const redGlow = elementById('glow-red');
      const cyanGlow = elementById('glow-cyan');
      if (redGlow) redGlow.style.transform = `scale(${1 + bass * 0.45})`;
      if (cyanGlow) cyanGlow.style.transform = `translate(-128px,-80px) scale(${1 + mid * 0.5})`;
      const dot = elementById('imm-dot');
      if (dot) {
        dot.style.background = playing ? 'var(--red)' : 'var(--ink-4)';
        dot.style.boxShadow = playing ? '0 0 8px rgba(215, 25, 32, .85)' : 'none';
      }
    };

    const tick = () => {
      const graph = graphRef.current;
      const reactive = playingRef.current && settingsRef.current.glyphSync && ensureGraph();
      if (reactive && graph?.context.state === 'suspended') graph.context.resume().catch(() => {});
      if (reactive && graph) graph.analyser.getByteFrequencyData(graph.fft);
      else if (graph) graph.fft.fill(0);

      const bass = reactive ? band(1, 8) : 0;
      const mid = reactive ? band(8, 32) : 0;
      updateSpectrum(reactive);
      updateProgress();
      updateDeck(playingRef.current, reactive, bass, mid);
      if (immersionRef.current) updateImmersion(playingRef.current, reactive, bass, mid);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [audio, band, ensureGraph]);

  useEffect(() => () => {
    const graph = graphRef.current;
    graphRef.current = null;
    graph?.context.close().catch(() => {});
  }, []);
}
