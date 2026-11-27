import { useCallback, useEffect, useRef } from 'react';
import { formatHundredths, formatTime } from '../lib/utils.js';

function elementById(id) {
  return document.getElementById(id);
}

function drawRoundedSquare(ctx, x, y, size, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, size, size, radius);
  } else {
    ctx.rect(x, y, size, size);
  }
}

export function useAudioFX({ audio, isPlaying, glyphSync, mono, crossfeed, sinkId = '' }) {
  const audioRef = useRef(audio);
  const graphRef = useRef(null);
  const settingsRef = useRef({ glyphSync, mono, crossfeed });
  const playingRef = useRef(isPlaying);
  const sinkIdRef = useRef(sinkId);

  audioRef.current = audio;
  settingsRef.current = { glyphSync, mono, crossfeed };
  playingRef.current = isPlaying;
  sinkIdRef.current = sinkId;

  const ensureGraph = useCallback(() => {
    if (graphRef.current) return true;
    const element = audioRef.current;
    if (!element) return false;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      let context;
      if (sinkIdRef.current) {
        try {
          context = new AudioContextClass({ sinkId: sinkIdRef.current });
        } catch {
          context = new AudioContextClass();
        }
      } else {
        context = new AudioContextClass();
      }
      if (sinkIdRef.current && typeof context.setSinkId === 'function' && context.sinkId !== sinkIdRef.current) {
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

    const matrixState = {
      width: 0,
      height: 0,
      dpr: 1,
      cols: 0,
      rows: 0,
      step: 28,
      box: 16,
      offsetX: 0,
      offsetY: 0,
      whiteCells: new Float32Array(0),
      redCells: new Float32Array(0),
      ripples: [],
      avgBass: 0.08,
      lastBeatAt: 0,
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
    };

    const syncMatrixGrid = (canvas) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (width === matrixState.width && height === matrixState.height && dpr === matrixState.dpr) return;

      matrixState.width = width;
      matrixState.height = height;
      matrixState.dpr = dpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      const step = width < 680 ? 24 : 28;
      const box = width < 680 ? 13 : 16;
      const cols = Math.ceil(width / step) + 1;
      const rows = Math.ceil(height / step) + 1;

      matrixState.step = step;
      matrixState.box = box;
      matrixState.cols = cols;
      matrixState.rows = rows;
      matrixState.offsetX = Math.floor((width - cols * step + (step - box)) / 2);
      matrixState.offsetY = Math.floor((height - rows * step + (step - box)) / 2);
      matrixState.whiteCells = new Float32Array(cols * rows);
      matrixState.redCells = new Float32Array(cols * rows);
    };

    const updateMatrixBackground = (playing, reactive, now, bass, lowMid, mid, high) => {
      const canvas = elementById('glyph-matrix-bg');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      syncMatrixGrid(canvas);
      const { cols, rows, step, box, offsetX, offsetY, whiteCells, redCells, dpr } = matrixState;
      const total = cols * rows;
      if (!total) return;

      const active = playing && settingsRef.current.glyphSync;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, matrixState.width, matrixState.height);

      if (!active) {
        whiteCells.fill(0);
        redCells.fill(0);
        matrixState.ripples.length = 0;
        matrixState.avgBass = 0.08;
        return;
      }

      // Decay existing LED cell levels
      for (let i = 0; i < total; i++) {
        whiteCells[i] *= 0.86;
        redCells[i] *= 0.84;
      }

      if (matrixState.reducedMotion) {
        const pulse = 0.42 + bass * 0.52;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if ((r + c) % 4 === 0) {
              const x = offsetX + c * step;
              const y = offsetY + r * step;
              ctx.fillStyle = `rgba(244, 244, 245, ${(pulse * 0.42).toFixed(3)})`;
              drawRoundedSquare(ctx, x, y, box, 3);
              ctx.fill();
            }
          }
        }
        return;
      }

      const graph = graphRef.current;
      const bins = graph?.fft.length || 128;

      // Adaptive beat detection
      const signalBass = reactive ? bass : 0;
      matrixState.avgBass = matrixState.avgBass * 0.92 + signalBass * 0.08;
      const beatThreshold = Math.max(0.14, matrixState.avgBass * 1.18);
      if (reactive && signalBass > beatThreshold && now - matrixState.lastBeatAt > 185) {
        matrixState.lastBeatAt = now;
        const maxDist = Math.hypot(cols * 0.5, rows * 0.5) + 2;
        const isCrimsonPeak = signalBass > Math.max(0.36, matrixState.avgBass * 1.42) || lowMid > 0.42;
        matrixState.ripples.push({
          radius: 0,
          speed: 0.5 + signalBass * 0.44,
          strength: Math.min(1, 0.72 + signalBass * 0.85),
          crimson: isCrimsonPeak,
          maxDist,
        });
        if (matrixState.ripples.length > 6) matrixState.ripples.shift();
      }

      // Advance Glyph Matrix geometric wave ripples (square Chebyshev + diamond hybrid)
      const cx = (cols - 1) * 0.5;
      const cy = (rows - 1) * 0.5;
      for (let i = matrixState.ripples.length - 1; i >= 0; i--) {
        const ripple = matrixState.ripples[i];
        ripple.radius += ripple.speed;
        ripple.strength *= 0.975;

        for (let r = 0; r < rows; r++) {
          const dy = Math.abs(r - cy);
          for (let c = 0; c < cols; c++) {
            const dx = Math.abs(c - cx);
            const chebyshev = Math.max(dx, dy);
            const manhattan = (dx + dy) * 0.72;
            const dist = chebyshev * 0.7 + manhattan * 0.3;
            const diff = Math.abs(dist - ripple.radius);
            if (diff < 1.35) {
              const hit = (1 - diff / 1.35) * ripple.strength;
              const idx = r * cols + c;
              if (ripple.crimson) {
                if (hit > redCells[idx]) redCells[idx] = hit;
              } else if (hit > whiteCells[idx]) {
                whiteCells[idx] = hit;
              }
            }
          }
        }

        if (ripple.radius > ripple.maxDist || ripple.strength < 0.05) {
          matrixState.ripples.splice(i, 1);
        }
      }

      // Symmetrical FFT column metering + high-hat sparkles across the matrix
      if (reactive && graph) {
        const halfCols = Math.max(1, Math.ceil(cols / 2));
        for (let c = 0; c < cols; c++) {
          const mirrorIdx = c < halfCols ? halfCols - 1 - c : c - halfCols;
          const norm = mirrorIdx / halfCols;
          const binLow = Math.max(1, Math.floor(Math.pow(bins * 0.75, norm)));
          const binHigh = Math.max(binLow + 1, Math.floor(Math.pow(bins * 0.75, Math.min(1, norm + 1 / halfCols))));
          const energy = band(binLow, binHigh);
          const litRows = Math.round(energy * rows * 0.62);

          for (let k = 0; k < litRows; k++) {
            const bottomIdx = (rows - 1 - k) * cols + c;
            const topIdx = k * cols + c;
            const val = Math.min(1, energy * 1.45 * (1 - k / Math.max(1, rows * 0.68)));
            if (val > whiteCells[bottomIdx]) whiteCells[bottomIdx] = val;
            if (val * 0.75 > whiteCells[topIdx]) whiteCells[topIdx] = val * 0.75;
          }
        }

        if (high > 0.14) {
          const sparkleCount = Math.min(14, Math.floor(high * 22));
          for (let s = 0; s < sparkleCount; s++) {
            const hash = Math.abs(Math.sin((now * 0.013) + s * 19.37)) * total;
            const idx = Math.floor(hash) % total;
            const boost = Math.min(1, high * 1.75);
            if (mid > 0.3 && s % 3 === 0) {
              if (boost > redCells[idx]) redCells[idx] = boost;
            } else if (boost > whiteCells[idx]) {
              whiteCells[idx] = boost;
            }
          }
        }
      }

      // Render matrix boxes with crisp LED brightness
      const maxCenterDist = Math.hypot(cx || 1, cy || 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = offsetX + c * step;
          const y = offsetY + r * step;

          const radial = Math.hypot(c - cx, r - cy) / maxCenterDist;
          const centerMask = 0.52 + 0.48 * Math.min(1, radial * 1.15);

          const w = whiteCells[idx] * centerMask;
          const rd = redCells[idx] * centerMask;

          if (rd > 0.025 && rd >= w * 0.7) {
            const alpha = Math.min(0.92, rd * 0.95);
            ctx.fillStyle = `rgba(229, 57, 53, ${alpha.toFixed(3)})`;
            drawRoundedSquare(ctx, x, y, box, 3);
            ctx.fill();
          } else if (w > 0.025) {
            const alpha = Math.min(0.84, w * 0.85);
            ctx.fillStyle = `rgba(244, 244, 245, ${alpha.toFixed(3)})`;
            drawRoundedSquare(ctx, x, y, box, 3);
            ctx.fill();
          }
        }
      }
    };

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
    };

    const updateDeck = (playing) => {
      const core = elementById('platter-core');
      if (core) core.style.animationPlayState = playing ? 'running' : 'paused';
      const engine = elementById('pb-engine');
      if (engine) engine.textContent = playing ? 'PLAYING' : 'STANDBY';
    };

    const tick = (now) => {
      const graph = graphRef.current;
      const reactive = playingRef.current && settingsRef.current.glyphSync && ensureGraph();
      if (reactive && graph?.context.state === 'suspended') graph.context.resume().catch(() => {});
      if (reactive && graph) graph.analyser.getByteFrequencyData(graph.fft);
      else if (graph) graph.fft.fill(0);

      const bass = reactive ? band(1, 7) : 0;
      const lowMid = reactive ? band(7, 20) : 0;
      const mid = reactive ? band(20, 44) : 0;
      const high = reactive ? band(44, 96) : 0;

      updateMatrixBackground(playingRef.current, reactive, now, bass, lowMid, mid, high);
      updateSpectrum(reactive);
      updateProgress();
      updateDeck(playingRef.current);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [audio, band, ensureGraph]);

  const setSinkId = useCallback(async (nextId) => {
    const context = graphRef.current?.context;
    if (!context || typeof context.setSinkId !== 'function') return false;
    await context.setSinkId(nextId || '');
    return true;
  }, []);

  useEffect(() => () => {
    const graph = graphRef.current;
    graphRef.current = null;
    graph?.context.close().catch(() => {});
  }, []);

  return { setSinkId };
}
