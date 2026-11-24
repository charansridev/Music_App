import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeekSurface } from './SeekSurface.jsx';
import { classNames, formatTime } from '../lib/utils.js';

export function BootScreen() {
  const [mounted, setMounted] = useState(() => {
    try {
      return sessionStorage.getItem('booted') !== '1';
    } catch {
      return true;
    }
  });
  const [gone, setGone] = useState(false);
  const [lines, setLines] = useState([]);

  const dismiss = useCallback(() => {
    setGone(true);
    window.setTimeout(() => setMounted(false), 450);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    try {
      sessionStorage.setItem('booted', '1');
    } catch {
      // The boot animation still works when session storage is unavailable.
    }
    const messages = ['> DAC ............ LOCKED', '> GLYPH BUS ...... 1:1 SYNC', '> NVME ARCHIVE ... MOUNTED', '> SIGNAL ......... WARM'];
    let index = 0;
    const interval = window.setInterval(() => {
      setLines((current) => [...current, messages[index++]]);
      if (index >= messages.length) window.clearInterval(interval);
    }, 380);
    const timeout = window.setTimeout(dismiss, 1900);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [dismiss, mounted]);

  if (!mounted) return null;

  return (
    <div
      id="boot"
      className={classNames(gone && 'gone')}
      role="button"
      tabIndex={0}
      aria-label="Skip boot sequence"
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') dismiss();
      }}
    >
      <div className="boot-inner">
        <div className="boot-mark">◉</div>
        <div className="boot-name">NOTHING</div>
        <div className="boot-sub">AUDIO OS · TP-01</div>
        <div className="dot-loader"><span /><span /><span /></div>
        <div className="boot-log mono">{lines.map((line) => <div key={line}>{line}</div>)}</div>
        <div className="boot-skip mono">CLICK TO SKIP</div>
      </div>
    </div>
  );
}

export function QueuePanel({ open, queue, qIndex, currentSong, isPlaying, onClose, onJump, onRemove }) {
  return (
    <aside id="queue-panel" className={classNames(open && 'open')} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="q-head">
        <span className="mono">TRANSMISSION QUEUE · <b>{queue.length}</b></span>
        <button type="button" title="Close" aria-label="Close queue" onClick={onClose}>✕</button>
      </div>
      <div id="queue-list">
        {queue.map((song, index) => (
          <div
            className={classNames('q-row', index === qIndex && 'current')}
            key={`${song.id}-${index}`}
            role="button"
            tabIndex={open ? 0 : -1}
            onClick={() => onJump(index)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onJump(index);
              }
            }}
          >
            <div className="q-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
            <div style={{ minWidth: 0, flex: 1 }}><div className="t1">{song.title}</div><div className="t2">{song.artist}</div></div>
            {index === qIndex && isPlaying ? (
              <span className="q-eq" aria-label="Now playing"><i /><i /><i /></span>
            ) : (
              <button
                type="button"
                className="q-x"
                aria-label={`Remove ${song.title} from queue`}
                tabIndex={open ? 0 : -1}
                onClick={(event) => { event.stopPropagation(); onRemove(index); }}
              >
                ✕
              </button>
            )}
          </div>
        )) || <div className="empty">QUEUE IS EMPTY</div>}
      </div>
    </aside>
  );
}

export function SearchOverlay({ open, query, songs, artists, albums, onQuery, onClose, onPlaySong, onSearchArtist, onSearchAlbum }) {
  const inputRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const songResults = useMemo(() => (
    normalizedQuery
      ? songs.filter((song) => song.title.toLowerCase().includes(normalizedQuery) || song.artist.toLowerCase().includes(normalizedQuery) || song.album.toLowerCase().includes(normalizedQuery)).slice(0, 8)
      : []
  ), [normalizedQuery, songs]);
  const artistResults = useMemo(() => (
    normalizedQuery ? artists.filter((artist) => artist.name.toLowerCase().includes(normalizedQuery)).slice(0, 3) : []
  ), [normalizedQuery, artists]);
  const albumResults = useMemo(() => (
    normalizedQuery ? albums.filter((album) => album.name.toLowerCase().includes(normalizedQuery)).slice(0, 3) : []
  ), [normalizedQuery, albums]);

  useEffect(() => {
    if (!open) return undefined;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const renderRow = (art, title, subtitle, onClick, key) => (
    <button type="button" className="sr-row" key={key} onClick={onClick}>
      <div className="sr-thumb" style={{ backgroundImage: `url('${art}')` }} />
      <div><div className="t1">{title}</div><div className="t2">{subtitle}</div></div>
      <span className="go">LOAD ▸</span>
    </button>
  );

  return (
    <div
      id="search-overlay"
      className={classNames(open && 'open')}
      role="dialog"
      aria-modal="true"
      aria-label="Search archive"
      aria-hidden={!open}
      inert={open ? undefined : ''}
      onClick={(event) => { if (event.target.id === 'search-overlay') onClose(); }}
    >
      <div className="search-box hw-card">
        <div className="search-head mono">
          ARCHIVE QUERY // DECK-01
          <button type="button" onClick={onClose} aria-label="Close search">✕</button>
        </div>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="SEARCH COMPOSITION / PERFORMER / RELEASE"
          autoComplete="off"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && songResults[0]) onPlaySong(songResults[0]);
            if (event.key === 'Escape') onClose();
          }}
        />
        <div id="search-results">
          {!normalizedQuery && <div className="empty" style={{ margin: 14 }}>TYPE TO SEARCH THE ARCHIVE</div>}
          {artistResults.length > 0 && <div className="sr-label">PERFORMERS</div>}
          {artistResults.map((artist) => renderRow(artist.art, artist.name, `${artist.songIds.length} songs`, () => onSearchArtist(artist), artist.name))}
          {albumResults.length > 0 && <div className="sr-label">RELEASES</div>}
          {albumResults.map((album) => renderRow(album.art, album.name, `${album.artist} · ${album.year}`, () => onSearchAlbum(album), album.key))}
          {songResults.length > 0 && <div className="sr-label">TRANSMISSIONS</div>}
          {songResults.map((song) => renderRow(song.art, song.title, `${song.artist} · ${song.spec}`, () => onPlaySong(song), song.id))}
          {normalizedQuery && !artistResults.length && !albumResults.length && !songResults.length && <div className="empty" style={{ margin: 14 }}>NO RESULTS</div>}
        </div>
      </div>
    </div>
  );
}

export function ImmersionOverlay({
  open,
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  glyphSync,
  onClose,
  onToggle,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onToggleGlyph,
  onSeek,
}) {
  const exitRef = useRef(null);
  const song = currentSong || songs[0];
  const progress = duration ? currentTime / duration : 0;

  useEffect(() => {
    if (open) exitRef.current?.focus();
  }, [open]);

  return (
    <div id="immersion" className={classNames(open && 'open')} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="imm-top">
        <div className="imm-brand">
          <span className="imm-mark" />
          <span className="mono bold">NOTHING (R)</span>
          <span className="mono dim">// FULLSCREEN IMMERSION // DECK-01</span>
        </div>
        <button type="button" className="imm-exit hw-press" ref={exitRef} onClick={onClose}><span>ESC // EXIT FULLSCREEN</span></button>
      </div>
      <div className="imm-tel imm-tl mono">
        <span className="tel-dot" /> AUDIO CORE: DSD-ASIO
        <span>CH: 02 STEREO</span>
        <span>BUFFER: 64 SMPL</span>
        <span className="font-dot green">JITTER &lt; 0.01ps</span>
      </div>
      <div className="imm-tel imm-tr mono">
        <span>OUTPUT: NOTHING EAR (2) [LHDC 5.0]</span>
        <span className="font-dot">MOD: NO-AUD-FS</span>
      </div>
      <div className="imm-glows">
        <div className="glow glow-red" id="glow-red" />
        <div className="glow glow-cyan" id="glow-cyan" />
        <div className="glow glow-amber" id="glow-amber" />
      </div>
      <div className="imm-glyph">
        <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="300" r="260" className="g-track" strokeDasharray="12 8 4 8" strokeWidth="1.5" />
          <circle cx="400" cy="300" r="225" id="glyph-ring-outer" strokeDasharray="48 16 12 16" strokeWidth="2" />
          <circle cx="400" cy="300" r="185" id="glyph-ring-mid" strokeDasharray="6 10" strokeWidth="3" />
          <circle cx="400" cy="300" r="140" className="g-ticks" strokeDasharray="2 6" strokeWidth="1" />
          <g className="g-dots" fill="currentColor">
            <circle cx="90" cy="90" r="2.5" /><circle cx="106" cy="90" r="2.5" /><circle cx="122" cy="90" r="2.5" /><circle cx="138" cy="90" r="2.5" />
            <circle cx="90" cy="106" r="2.5" /><circle className="g-d1" cx="106" cy="106" r="2.5" /><circle cx="122" cy="106" r="2.5" /><circle cx="138" cy="106" r="2.5" />
            <circle cx="90" cy="122" r="2.5" /><circle cx="106" cy="122" r="2.5" /><circle className="g-d2" cx="122" cy="122" r="2.5" /><circle cx="138" cy="122" r="2.5" />
          </g>
          <g className="g-dots" fill="currentColor">
            <circle cx="662" cy="478" r="2.5" /><circle className="g-d1" cx="678" cy="478" r="2.5" /><circle cx="694" cy="478" r="2.5" /><circle cx="710" cy="478" r="2.5" />
            <circle cx="662" cy="494" r="2.5" /><circle cx="678" cy="494" r="2.5" /><circle className="g-d1" cx="694" cy="494" r="2.5" /><circle cx="710" cy="494" r="2.5" />
            <circle cx="662" cy="510" r="2.5" /><circle cx="678" cy="510" r="2.5" /><circle cx="694" cy="510" r="2.5" /><circle cx="710" cy="510" r="2.5" />
          </g>
          <path className="g-arc" d="M 140 300 A 260 260 0 0 1 210 120" strokeLinecap="round" strokeWidth="4" />
          <path className="g-arc a2" d="M 660 300 A 260 260 0 0 1 590 480" strokeLinecap="round" strokeWidth="4" />
          <path className="g-arc a3" d="M 270 70 A 260 260 0 0 1 360 45" strokeLinecap="round" strokeWidth="3" />
          <path className="g-arc a4" d="M 440 555 A 260 260 0 0 1 530 530" strokeLinecap="round" strokeWidth="3" />
        </svg>
      </div>
      <div className="imm-card hw-card" id="imm-card">
        <div className="imm-card-top">
          <div className="imm-badge"><span className="ping-dot" id="imm-dot" /><span className="mono">GLYPH MATRIX // 1:1 AUDIO REACTIVE</span></div>
          <span className="font-dot cyan" id="imm-spec">{song ? song.spec.toUpperCase() : 'FLAC 24-BIT / 96KHZ'}</span>
        </div>
        <div className="imm-now">
          <div className="imm-art" id="imm-art" style={song ? { backgroundImage: `url('${song.art}')` } : undefined} />
          <div className="imm-meta">
            <span className="mono red" id="imm-track-label">{song ? `NOW PLAYING // TRACK ${String(Math.max(0, songs.indexOf(song)) + 1).padStart(2, '0')}` : 'NOW PLAYING // STANDBY'}</span>
            <h2 id="imm-title">{song?.title || '—'}</h2>
            <p id="imm-artist">{song ? `${song.artist} · ${song.album} (Lossless)` : '—'}</p>
            <div className="imm-telemetry mono">
              <span id="imm-lufs">LUFS -14.2</span><span>·</span><span id="imm-dr">{song?.dr || 'DR 11'}</span><span>·</span><span>ASIO DIRECT</span>
            </div>
          </div>
        </div>
        <div className="imm-controls">
          <div className="imm-progress">
            <span className="mono" id="imm-cur">{formatTime(currentTime)}</span>
            <SeekSurface id="imm-track" className="imm-track" value={progress} onSeek={onSeek} label="Seek immersion playback">
              <div className="imm-fill" id="imm-fill" style={{ width: `${progress * 100}%` }} />
            </SeekSurface>
            <span className="mono" id="imm-dur">{formatTime(duration)}</span>
          </div>
          <div className="imm-transport">
            <div className="imm-left">
              <button type="button" className={classNames('imm-btn', shuffle && 'active')} id="imm-shuffle" title="Shuffle" aria-label="Toggle shuffle" aria-pressed={shuffle} onClick={onToggleShuffle}>⇄</button>
              <button type="button" className={classNames('imm-btn', repeat !== 'off' && 'active')} id="imm-repeat" title="Repeat" aria-label="Cycle repeat mode" onClick={onCycleRepeat}>↻</button>
            </div>
            <div className="imm-mid">
              <button type="button" className="imm-skip hw-press" id="imm-prev" title="Previous" aria-label="Previous track" onClick={onPrevious}>⏮</button>
              <button type="button" className="imm-play hw-press" id="imm-play" title="Play / Pause" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>{isPlaying ? '❚❚' : '▶'}</button>
              <button type="button" className="imm-skip hw-press" id="imm-next" title="Next" aria-label="Next track" onClick={onNext}>⏭</button>
            </div>
            <button type="button" className={classNames('imm-mode hw-press', !glyphSync && 'off')} id="imm-mode" onClick={onToggleGlyph}>{glyphSync ? 'SYNC: 1:1' : 'SYNC: OFF'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContextMenu({ menu, playlists, loved, onClose, onPlay, onPlayNext, onQueue, onToggleLove, onAddToPlaylist, onNewPlaylistWith }) {
  if (!menu) return null;
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - 228));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - 300));
  const run = (action) => {
    action();
    onClose();
  };

  return (
    <>
      <div id="menu-overlay" className="open" onClick={onClose} />
      <div id="ctx-menu" className="ctx-menu" role="menu" style={{ left, top }} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onPlay(menu.song))}>▸ Play now</button>
        <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onPlayNext(menu.song))}>⏭ Play next</button>
        <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onQueue(menu.song))}>≡ Add to queue</button>
        <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onToggleLove(menu.song.id))}>{loved.has(menu.song.id) ? '♡ Unlove' : '♥ Love'}</button>
        {playlists.map((playlist) => (
          <button type="button" className="ctx-item" role="menuitem" key={playlist.id} onClick={() => run(() => onAddToPlaylist(playlist, menu.song))}>+ Add to {playlist.name}</button>
        ))}
        <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onNewPlaylistWith(menu.song))}>+ New reel from song</button>
      </div>
    </>
  );
}

export function Toasts({ messages }) {
  return <div id="toasts" aria-live="polite">{messages.map((toast) => <div className="toast" key={toast.id}>{toast.message}</div>)}</div>;
}
