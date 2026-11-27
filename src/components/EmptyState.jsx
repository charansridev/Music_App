import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { SPRING_SMOOTH } from '../lib/motion.js';
import { classNames } from '../lib/utils.js';

const CRATE_COLORS = ['#F4D026', '#F25C2A', '#18B848', '#E892C4', '#2B7DE9', '#D8D1C5', '#F2F1EC'];

function EmptyIllustration({ variant = 'disc' }) {
  if (variant === 'folder') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="8" y="14" width="80" height="48" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 24h80" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.4" />
        <path d="M14 14V9a3 3 0 0 1 3-3h20l6 8" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="48" cy="43" r="11" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="48" cy="43" r="4" fill="#00921E" />
        <circle cx="75" cy="32" r="4" fill="#F4D026" />
      </svg>
    );
  }

  if (variant === 'tape') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="8" y="12" width="80" height="48" rx="6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="32" cy="36" r="11" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="64" cy="36" r="11" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="32" cy="36" r="4" fill="#F25C2A" />
        <circle cx="64" cy="36" r="4" fill="#F4D026" />
        <path d="M32 47h32" stroke="#18B848" strokeWidth="2" />
      </svg>
    );
  }

  if (variant === 'search') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <circle cx="42" cy="34" r="18" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="42" cy="34" r="7" fill="#F4D026" />
        <path d="M55 47l14 14" stroke="#F25C2A" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'hires') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="12" y="12" width="72" height="48" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M22 42V30M29 47V25M36 40V32M43 50V22M50 44V28M57 48V24M64 41V31M71 45V27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="76" cy="18" r="4" fill="#F4D026" />
      </svg>
    );
  }

  if (variant === 'queue' || variant === 'history') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="14" y="12" width="68" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="30" width="68" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.65" />
        <rect x="14" y="48" width="68" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.35" />
        <circle cx="22" cy="18" r="3" fill="#00921E" />
      </svg>
    );
  }

  return (
    <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
      <circle cx="48" cy="36" r="24" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="48" cy="36" r="14" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="48" cy="36" r="6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="48" cy="36" r="2.5" fill="#F25C2A" />
    </svg>
  );
}

export function EmptyState({
  variant = 'disc',
  eyebrow,
  title,
  description,
  actions,
  compact = false,
  className = '',
}) {
  return (
    <motion.div
      className={classNames('empty-state hw-card', compact && 'compact', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
    >
      <EmptyIllustration variant={variant} />
      {eyebrow && <div className="empty-eyebrow mono">{eyebrow}</div>}
      <div className="empty-title">{title}</div>
      {description && <p className="empty-desc mono">{description}</p>}
      {actions && <div className="empty-actions">{actions}</div>}
    </motion.div>
  );
}

export function LibrarySkeleton({ progress = null, label = 'INDEXING LOCAL ARCHIVE' }) {
  const total = progress?.total || 0;
  const done = progress?.done || 0;
  const recent = progress?.recent || [];
  const pct = total ? Math.round((done / total) * 100) : 14;

  const canvasRef = useRef(null);
  const simRef = useRef({
    width: 680,
    height: 290,
    dpr: 1,
    bodies: [],
    ripples: [],
    pointer: { x: -999, y: -999, vx: 0, vy: 0, active: false },
    nextColorIdx: 0,
    reducedMotion: false,
  });

  const [latestTrack, setLatestTrack] = useState(null);

  const spawnBody = useCallback((opts = {}) => {
    const sim = simRef.current;
    const width = sim.width || 680;
    const radius = opts.radius || (16 + Math.random() * 14);
    const kindRoll = Math.random();
    const kind = opts.kind || (kindRoll < 0.56 ? 'vinyl' : kindRoll < 0.8 ? 'reel' : 'badge');
    const color = opts.color || CRATE_COLORS[sim.nextColorIdx++ % CRATE_COLORS.length];

    if (sim.bodies.length >= 44) {
      sim.bodies.shift();
    }

    sim.bodies.push({
      x: opts.x ?? (radius + 16 + Math.random() * Math.max(40, width - radius * 2 - 32)),
      y: opts.y ?? (-radius - Math.random() * 36),
      vx: opts.vx ?? ((Math.random() - 0.5) * 2.4),
      vy: opts.vy ?? (Math.random() * 1.6),
      r: radius,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.08,
      kind,
      color,
      glyph: opts.glyph || '',
      hires: Boolean(opts.hires),
    });
  }, []);

  const shakeCrate = useCallback(() => {
    const sim = simRef.current;
    sim.bodies.forEach((b) => {
      b.vy -= 7.5 + Math.random() * 5.5;
      b.vx += (Math.random() - 0.5) * 7;
      b.vAngle += (Math.random() - 0.5) * 0.16;
    });
    spawnBody({ y: -18 });
  }, [spawnBody]);

  // Spawn bodies for newly scanned tracks
  useEffect(() => {
    if (!recent.length) return;
    setLatestTrack(recent[recent.length - 1]);
    recent.slice(0, 3).forEach((song) => {
      const firstChar = (song.title || 'M').trim().charAt(0).toUpperCase();
      spawnBody({
        glyph: song.hires ? 'HI' : firstChar,
        hires: song.hires,
        color: song.hires ? '#F4D026' : undefined,
      });
    });
  }, [recent, spawnBody]);

  // Ambient initial crate drops & physics loop
  useEffect(() => {
    const sim = simRef.current;
    sim.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

    for (let i = 0; i < 10; i++) {
      spawnBody({
        y: 30 + Math.random() * 120,
        glyph: ['M', 'U', 'Z', 'I', 'K', '♪', '33', 'HI', '24', 'LP'][i % 10],
      });
    }

    const ambientInterval = window.setInterval(() => {
      if (sim.bodies.length < 24) {
        spawnBody({
          glyph: ['M', 'U', 'Z', 'I', 'K', '♪'][Math.floor(Math.random() * 6)],
        });
      }
    }, 450);

    let frameId;
    const syncSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width));
      const height = Math.max(240, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (sim.width !== width || sim.height !== height || sim.dpr !== dpr) {
        sim.width = width;
        sim.height = height;
        sim.dpr = dpr;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    };

    const drawBody = (ctx, b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      if (b.kind === 'vinyl') {
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#141414';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(242, 241, 236, 0.28)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(242, 241, 236, 0.14)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2.2, b.r * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = '#0A0A0A';
        ctx.fill();
      } else if (b.kind === 'reel') {
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#B5AAA0';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0A0A0A';
        ctx.stroke();

        for (let k = 0; k < 3; k++) {
          ctx.save();
          ctx.rotate((k * Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.moveTo(-b.r * 0.16, -b.r * 0.76);
          ctx.lineTo(b.r * 0.16, -b.r * 0.76);
          ctx.lineTo(b.r * 0.09, -b.r * 0.28);
          ctx.lineTo(-b.r * 0.09, -b.r * 0.28);
          ctx.closePath();
          ctx.fillStyle = '#0A0A0A';
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#F25C2A';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        if (b.glyph) {
          ctx.fillStyle = b.color === '#2B7DE9' ? '#F2F1EC' : '#0A0A0A';
          ctx.font = `700 ${Math.round(b.r * 0.72)}px "Space Grotesk", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.glyph, 0, 1);
        }
      }

      ctx.restore();
    };

    const step = () => {
      syncSize();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) {
        frameId = requestAnimationFrame(step);
        return;
      }

      const { width, height, dpr, bodies, ripples, pointer } = sim;

      if (!sim.reducedMotion) {
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          b.vy += 0.34;
          b.vx *= 0.994;
          b.vy *= 0.994;
          b.x += b.vx;
          b.y += b.vy;
          b.angle += b.vAngle;
          b.vAngle *= 0.985;

          if (pointer.active) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            const pushRadius = b.r + 36;
            if (dist > 0.01 && dist < pushRadius) {
              const force = (1 - dist / pushRadius) * 2.2;
              b.vx += (dx / dist) * force + pointer.vx * 0.14;
              b.vy += (dy / dist) * force + pointer.vy * 0.14 - 0.6;
              b.vAngle += (pointer.vx * 0.008);
            }
          }

          if (b.x - b.r < 0) {
            b.x = b.r;
            b.vx = Math.abs(b.vx) * 0.72;
          } else if (b.x + b.r > width) {
            b.x = width - b.r;
            b.vx = -Math.abs(b.vx) * 0.72;
          }

          if (b.y + b.r > height) {
            b.y = height - b.r;
            if (Math.abs(b.vy) > 1.2) {
              b.vy = -b.vy * 0.54;
            } else {
              b.vy = 0;
            }
            b.vx *= 0.94;
            b.vAngle = b.vx / Math.max(12, b.r);
          }
        }

        // Circle-circle collisions
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.r + b.r;
            if (dist > 0.01 && dist < minDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = (minDist - dist) * 0.5;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal < 0) {
                const impulse = -0.82 * velAlongNormal;
                a.vx -= impulse * nx;
                a.vy -= impulse * ny;
                b.vx += impulse * nx;
                b.vy += impulse * ny;
                a.vAngle += (Math.random() - 0.5) * 0.03;
                b.vAngle += (Math.random() - 0.5) * 0.03;
              }
            }
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      // Subtle dot grid
      ctx.fillStyle = 'rgba(242, 241, 236, 0.1)';
      for (let gx = 16; gx < width; gx += 26) {
        for (let gy = 16; gy < height; gy += 26) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      // Draw shockwave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 5.5;
        rp.alpha *= 0.92;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 208, 38, ${rp.alpha.toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (rp.alpha < 0.04) ripples.splice(i, 1);
      }

      for (let i = 0; i < bodies.length; i++) {
        drawBody(ctx, bodies[i]);
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      window.clearInterval(ambientInterval);
    };
  }, [spawnBody]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const p = simRef.current.pointer;
    p.vx = x - (p.active ? p.x : x);
    p.vy = y - (p.active ? p.y : y);
    p.x = x;
    p.y = y;
    p.active = true;
  };

  const handlePointerLeave = () => {
    simRef.current.pointer.active = false;
  };

  const handleCanvasClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const sim = simRef.current;

    sim.ripples.push({ x, y, r: 8, alpha: 0.9 });
    sim.bodies.forEach((b) => {
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.max(18, Math.hypot(dx, dy));
      if (dist < 170) {
        const power = (1 - dist / 170) * 10.5;
        b.vx += (dx / dist) * power;
        b.vy += (dy / dist) * power - 4.8;
        b.vAngle += (Math.random() - 0.5) * 0.2;
      }
    });
    spawnBody({ x, y: Math.max(20, y - 24), vy: -2.5 });
  };

  return (
    <div className="scan-stage-card" aria-busy="true" aria-label={label}>
      <div className="scan-paper-head">
        <div className="scan-head-row">
          <div>
            <div className="scan-eyebrow mono">LIVE INDEXING</div>
            <div className="scan-title">{label}</div>
            <div className="scan-counts mono">
              {total ? `${done} / ${total} TRACKS` : 'READING DIRECTORY...'}
            </div>
          </div>

          <div className="scan-head-right">
            <div className="scan-pct-big">{pct}%</div>
            <button type="button" className="scan-shake-btn mono" onClick={shakeCrate}>
              <RotateCw size={12} strokeWidth={2.2} />
              Shake Crate
            </button>
          </div>
        </div>

        <div className="mount-progress-track">
          <div className="mount-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div
        className="scan-canvas-wrap"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="scan-canvas" />
        <div className="scan-hint mono">MOVE CURSOR OR CLICK TO BOUNCE RECORDS</div>
      </div>

      <div className="scan-ticker-foot mono">
        <span className="scan-ticker-dot" />
        <span className="scan-ticker-text">
          {latestTrack
            ? `INDEXED: ${latestTrack.title} — ${latestTrack.artist}`
            : 'SCANNING LOCAL AUDIO ARCHIVE...'}
        </span>
      </div>
    </div>
  );
}
