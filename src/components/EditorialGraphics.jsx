import { useMemo } from 'react';
import { SeekSurface } from './SeekSurface.jsx';
import { classNames } from '../lib/utils.js';

function hashSeed(input) {
  const text = String(input || 'muzik');
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function SignalBadge({
  label,
  tone = 'yellow',
  size = 'md',
  active = false,
  onClick,
  title,
  ariaLabel,
  pressed,
  className = '',
}) {
  const classes = classNames(
    'sig-badge',
    `tone-${tone}`,
    `size-${size}`,
    active && 'active',
    onClick && 'interactive',
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel || title || String(label)}
        aria-pressed={pressed !== undefined ? pressed : active}
      >
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className={classes} title={title}>
      <span>{label}</span>
    </span>
  );
}

export function WaveformScrubber({
  songId,
  progress = 0,
  onSeek,
  variant = 'paper',
  id = 'ruler',
  fillId = 'ruler-fill',
  label = 'Seek playback',
}) {
  const bars = useMemo(() => {
    let seed = hashSeed(songId);
    const count = 72;
    const out = [];
    for (let i = 0; i < count; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const rand = (seed >>> 16) / 65536;
      const env = Math.sin((i / (count - 1)) * Math.PI) * 0.45 + 0.55;
      const spike = i % 7 === 0 ? 0.24 : i % 3 === 0 ? 0.12 : 0;
      const height = Math.max(14, Math.min(96, Math.round((rand * 0.65 + spike + 0.15) * env * 100)));
      out.push(height);
    }
    return out;
  }, [songId]);

  const pct = Math.max(0, Math.min(1, progress || 0));
  const activeCount = Math.round(pct * bars.length);

  return (
    <SeekSurface
      id={id}
      className={classNames('ed-wave', `variant-${variant}`)}
      value={pct}
      onSeek={onSeek}
      label={label}
    >
      <div className="ed-wave-bars" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={index}
            className={classNames('ed-wave-bar', index < activeCount && 'played')}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div
        id={fillId}
        className="ed-wave-fill"
        style={{ width: `${pct * 100}%` }}
        aria-hidden="true"
      />
      <div
        className="ed-wave-needle"
        style={{ left: `${pct * 100}%` }}
        aria-hidden="true"
      />
    </SeekSurface>
  );
}

export function DotMatrixScrubber({
  progress = 0,
  onSeek,
  id = 'ruler',
  fillId = 'ruler-fill',
  label = 'Seek playback',
}) {
  const cols = 32;
  const rows = 7;
  const pct = Math.max(0, Math.min(1, progress || 0));
  const activeCol = Math.floor(pct * cols);

  const dots = useMemo(() => {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wave = Math.abs(Math.sin(c * 0.42 + r * 0.7)) > 0.35;
        cells.push({ r, c, dense: wave });
      }
    }
    return cells;
  }, []);

  return (
    <SeekSurface
      id={id}
      className="ed-dotmatrix"
      value={pct}
      onSeek={onSeek}
      label={label}
    >
      <div className="ed-dotmatrix-grid" aria-hidden="true">
        {dots.map((dot) => {
          const isPlayed = dot.c <= activeCol && pct > 0;
          return (
            <span
              key={`${dot.r}-${dot.c}`}
              className={classNames(
                'ed-dotmatrix-cell',
                dot.dense && 'dense',
                isPlayed && 'played',
              )}
            />
          );
        })}
      </div>
      <div
        id={fillId}
        className="ed-dotmatrix-fill"
        style={{ width: `${pct * 100}%` }}
        aria-hidden="true"
      />
      <div
        className="ed-dotmatrix-needle"
        style={{ left: `${pct * 100}%` }}
        aria-hidden="true"
      />
    </SeekSurface>
  );
}

export function ThreeProngReel({ isPlaying = false, size = 210, id = 'platter-core' }) {
  return (
    <div
      className="ed-reel-well"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        id={id}
        className={classNames('ed-reel-svg spool', isPlaying && 'spinning')}
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        viewBox="0 0 220 220"
        fill="none"
      >
        <circle cx="110" cy="110" r="102" fill="#0A0A0A" />
        <circle cx="110" cy="110" r="92" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <circle cx="110" cy="110" r="68" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 5" />
        <path
          d="M95 26 C105 22, 115 22, 125 26 L118 78 C113 76, 107 76, 102 78 Z"
          fill="#B5AAA0"
        />
        <path
          d="M95 26 C105 22, 115 22, 125 26 L118 78 C113 76, 107 76, 102 78 Z"
          fill="#B5AAA0"
          transform="rotate(120 110 110)"
        />
        <path
          d="M95 26 C105 22, 115 22, 125 26 L118 78 C113 76, 107 76, 102 78 Z"
          fill="#B5AAA0"
          transform="rotate(240 110 110)"
        />
        <circle cx="110" cy="110" r="24" fill="#181818" stroke="#B5AAA0" strokeWidth="2.5" />
        <circle cx="110" cy="110" r="7" fill="#F2F1EC" />
        <circle cx="110" cy="96" r="2.2" fill="#E53935" />
      </svg>
    </div>
  );
}

export function RainbowArcMeter({ progress = 0 }) {
  const pct = Math.max(0, Math.min(1, progress || 0));
  const angle = Math.PI - pct * Math.PI;
  const radius = 92;
  const cx = 130;
  const cy = 114;
  const knobX = cx + Math.cos(angle) * radius;
  const knobY = cy - Math.sin(angle) * radius;

  return (
    <svg className="ed-rainbow-arc" viewBox="0 0 260 132" fill="none" aria-hidden="true">
      <path d="M 38 114 A 92 92 0 0 1 222 114" stroke="#F4D026" strokeWidth="14" strokeLinecap="round" strokeOpacity="0.22" />
      <path d="M 38 114 A 92 92 0 0 1 222 114" stroke="#F4D026" strokeWidth="14" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={289 * (1 - pct)} />
      <path d="M 55 114 A 75 75 0 0 1 205 114" stroke="#18B848" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.24" />
      <path d="M 55 114 A 75 75 0 0 1 205 114" stroke="#18B848" strokeWidth="12" strokeLinecap="round" strokeDasharray="236" strokeDashoffset={236 * (1 - pct)} />
      <path d="M 72 114 A 58 58 0 0 1 188 114" stroke="#F25C2A" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.26" />
      <path d="M 72 114 A 58 58 0 0 1 188 114" stroke="#F25C2A" strokeWidth="10" strokeLinecap="round" strokeDasharray="182" strokeDashoffset={182 * (1 - pct)} />
      <circle cx={knobX} cy={knobY} r="7" fill="#F2F1EC" stroke="#0A0A0A" strokeWidth="2.5" />
    </svg>
  );
}

export function TransitMapGraphic({ className = '' }) {
  const stations = [
    { x: 146, y: 88, label: 'M', tone: '#F2F1EC' },
    { x: 146, y: 162, label: 'U', tone: '#F4D026' },
    { x: 146, y: 202, label: 'Z', tone: '#18B848' },
    { x: 146, y: 242, label: 'I', tone: '#E892C4' },
    { x: 146, y: 282, label: 'K', tone: '#F25C2A' },
  ];

  return (
    <svg className={classNames('ed-transit-svg', className)} viewBox="0 0 360 360" fill="none" aria-hidden="true">
      <rect width="360" height="360" fill="#0A0A0A" />
      <path d="M 320 20 L 210 130 C 185 155, 168 162, 146 162 L 146 348" stroke="#F2F1EC" strokeWidth="16" strokeLinecap="round" />
      <path d="M 36 110 L 146 162 L 245 212 C 282 230, 300 264, 300 348" stroke="#F4D026" strokeWidth="18" strokeLinecap="round" />
      <path d="M 36 146 L 146 202 L 232 246 C 258 260, 268 286, 268 348" stroke="#18B848" strokeWidth="18" strokeLinecap="round" />
      <path d="M 36 182 L 146 242 L 218 282 C 234 292, 238 312, 238 348" stroke="#E892C4" strokeWidth="18" strokeLinecap="round" />
      <path d="M 36 218 L 146 282 L 194 310 C 204 316, 208 328, 208 348" stroke="#F25C2A" strokeWidth="18" strokeLinecap="round" />
      <path d="M 146 16 L 146 348" stroke="#2B7DE9" strokeWidth="10" />
      <line x1="28" y1="242" x2="332" y2="242" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="3 5" />
      <line x1="28" y1="282" x2="332" y2="282" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="3 5" />
      {stations.map((st) => (
        <g key={st.label}>
          <circle cx={st.x} cy={st.y} r="13" fill="#0A0A0A" stroke={st.tone} strokeWidth="3.5" />
          <text
            x={st.x}
            y={st.y + 4}
            textAnchor="middle"
            fill="#F2F1EC"
            fontSize="11"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {st.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function DotArrowGraphic({ className = '' }) {
  const rows = [
    '000010000',
    '000111000',
    '001111100',
    '011111110',
    '111111111',
    '000111000',
    '000111000',
    '000111000',
    '000111000',
    '000111000',
  ];

  return (
    <svg className={classNames('ed-dotarrow-svg', className)} viewBox="0 0 108 120" fill="none" aria-hidden="true">
      {rows.map((row, r) => (
        [...row].map((cell, c) => (
          cell === '1' ? (
            <circle
              key={`${r}-${c}`}
              cx={10 + c * 11}
              cy={10 + r * 11}
              r="3.2"
              fill="currentColor"
            />
          ) : null
        ))
      ))}
    </svg>
  );
}

export function DiagonalArrowGraphic({ className = '' }) {
  return (
    <svg className={classNames('ed-diagarrow-svg', className)} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <path
        d="M36 34 H166 V164 M162 38 L34 166"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
