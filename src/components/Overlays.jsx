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
        {queue.length ? queue.map((song, index) => (
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
        )) : <div className="empty">QUEUE IS EMPTY</div>}
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
          {!normalizedQuery && (
            <div className="empty" style={{ margin: 14 }}>
              {songs.length ? 'TYPE TO SEARCH THE ARCHIVE' : 'MOUNT A LOCAL FOLDER TO SEARCH'}
            </div>
          )}
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
  onClose,
  onToggle,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
}) {
  const exitRef = useRef(null);
  const song = currentSong || songs[0];
  const progress = duration ? currentTime / duration : 0;
  const trackIndex = song ? songs.indexOf(song) : -1;
  const trackCounter = trackIndex >= 0
    ? `TRACK ${String(trackIndex + 1).padStart(2, '0')} / ${String(songs.length).padStart(2, '0')}`
    : 'STANDBY';
  const repeatLabel = repeat === 'off' ? 'REPEAT OFF' : repeat === 'all' ? 'REPEAT ALL' : 'REPEAT 1';

  useEffect(() => {
    if (open) exitRef.current?.focus();
  }, [open]);

  return (
    <div id="immersion" className={classNames(open && 'open')} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="imm-glows">
        <div className="glow glow-red" id="glow-red" />
        <div className="glow glow-cyan" id="glow-cyan" />
      </div>

      <div className="imm-top">
        <div className="imm-brand">
          <span className="imm-dot" id="imm-dot" />
          <span className="mono bold">NOTHING (R)</span>
          <span className="mono dim">// {trackCounter}</span>
        </div>
        <button type="button" className="imm-exit milled-button hw-press" ref={exitRef} onClick={onClose}>
          ESC // EXIT
        </button>
      </div>

      <div className="imm-stage">
        <div className="imm-turntable">
          <svg className="imm-glyph-svg" viewBox="0 0 460 460" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="230" cy="230" r="224" className="g-track" strokeDasharray="10 8 3 8" strokeWidth="1.2" />
            <circle cx="230" cy="230" r="214" id="glyph-ring-outer" strokeDasharray="48 16 12 16" strokeWidth="2" />
            <circle cx="230" cy="230" r="198" id="glyph-ring-mid" strokeDasharray="6 10" strokeWidth="2.5" />
            <circle cx="230" cy="230" r="182" className="g-ticks" strokeDasharray="2 6" strokeWidth="1" />
          </svg>

          <div className="imm-glyph-leds" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <span className="imm-gl-seg" style={{ '--seg-angle': `${index * 45}deg` }} key={index} />
            ))}
          </div>

          <div className="imm-platter">
            <div className="imm-strobe" />
            <div
              className="imm-platter-core spool"
              id="imm-platter-core"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              <div className="imm-grooves" />
              <span className="imm-spoke h" />
              <span className="imm-spoke v" />
              <div className="imm-label" style={song ? { backgroundImage: `url('${song.art}')` } : undefined} />
              <div className="imm-spindle"><i /></div>
            </div>
          </div>

          <div className={classNames('imm-tonearm', isPlaying && 'engaged')} aria-hidden="true">
            <div className="imm-arm-base"><i /></div>
            <div className="imm-arm-wand">
              <div className="imm-arm-headshell"><span className="imm-stylus" /></div>
            </div>
          </div>
        </div>

        <div className="imm-meta">
          <h2 id="imm-title">{song?.title || 'No track loaded'}</h2>
          <p id="imm-artist">
            {song ? `${song.artist} · ${song.album}${song.year ? ` · ${song.year}` : ''}` : 'Select a track to begin'}
          </p>
        </div>
      </div>

      <div className="imm-dock hw-card" id="imm-card">
        <div className="imm-progress">
          <span className="font-dot" id="imm-cur">{formatTime(currentTime)}</span>
          <SeekSurface id="imm-track" className="imm-track" value={progress} onSeek={onSeek} label="Seek immersion playback">
            <div className="ticks ruler-tape" />
            <div className="imm-fill" id="imm-fill" style={{ width: `${progress * 100}%` }} />
          </SeekSurface>
          <span className="font-dot" id="imm-dur">{formatTime(duration)}</span>
        </div>

        <div className="imm-transport">
          <div className="imm-left">
            <button
              type="button"
              className={classNames('pf-toggle', shuffle && 'active')}
              id="imm-shuffle"
              title="Shuffle"
              aria-label="Toggle shuffle"
              aria-pressed={shuffle}
              onClick={onToggleShuffle}
            >
              SHUFFLE
            </button>
          </div>

          <div className="imm-mid">
            <button type="button" className="milled-button imm-skip hw-press" id="imm-prev" title="Previous" aria-label="Previous track" onClick={onPrevious}>⏮</button>
            <button type="button" className="imm-play hw-press" id="imm-play" title="Play / Pause" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button type="button" className="milled-button imm-skip hw-press" id="imm-next" title="Next" aria-label="Next track" onClick={onNext}>⏭</button>
          </div>

          <div className="imm-right">
            <button
              type="button"
              className={classNames('pf-toggle', repeat !== 'off' && 'active')}
              id="imm-repeat"
              title="Repeat"
              aria-label={`Repeat mode: ${repeat}`}
              onClick={onCycleRepeat}
            >
              {repeatLabel}
            </button>
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

export function ReelModal({ modal, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!modal) return undefined;
    setName(modal.mode === 'rename' ? modal.playlist?.name || '' : '');
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [modal]);

  if (!modal) return null;
  const isRename = modal.mode === 'rename';
  const trimmed = name.trim();

  return (
    <div
      className="modal-overlay open"
      role="dialog"
      aria-modal="true"
      aria-label={isRename ? 'Rename reel' : 'Create new reel'}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <form
        className="modal-box hw-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onSubmit(trimmed);
        }}
      >
        <div className="modal-head mono">
          <span>{isRename ? 'RENAME REEL // TAPE STASH' : 'NEW REEL // TAPE STASH'}</span>
          <button type="button" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">
          {modal.song && (
            <div className="modal-hint mono">SEEDING WITH: <b>{modal.song.title.toUpperCase()}</b></div>
          )}
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder="ENTER REEL NAME (E.G. NIGHT DRIVE)"
            maxLength={48}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
              }
            }}
          />
        </div>
        <div className="modal-foot">
          <button type="button" className="hw-btn" onClick={onClose}>CANCEL</button>
          <button type="submit" className="hw-btn primary" disabled={!trimmed}>
            {isRename ? 'SAVE NAME' : 'CREATE REEL'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddSongsModal({ playlist, songs, onClose, onToggleSong, onPickFolder, onStartDemo }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!playlist?.id) return undefined;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [playlist?.id]);

  const normalized = query.trim().toLowerCase();
  const addedSet = useMemo(() => new Set(playlist?.songIds || []), [playlist?.songIds]);
  const filteredSongs = useMemo(() => {
    if (!normalized) return songs;
    return songs.filter((song) => (
      song.title.toLowerCase().includes(normalized)
      || song.artist.toLowerCase().includes(normalized)
      || song.album.toLowerCase().includes(normalized)
    ));
  }, [normalized, songs]);

  if (!playlist) return null;

  return (
    <div
      className="modal-overlay open"
      role="dialog"
      aria-modal="true"
      aria-label={`Add songs to ${playlist.name}`}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="modal-box hw-card modal-lg">
        <div className="modal-head mono">
          <span>ADD SONGS // {playlist.name.toUpperCase()}</span>
          <button type="button" onClick={onClose} aria-label="Close song picker">✕</button>
        </div>

        {songs.length > 0 ? (
          <>
            <input
              ref={inputRef}
              type="text"
              className="modal-input modal-search"
              placeholder="FILTER TRACKS BY TITLE, ARTIST, OR ALBUM..."
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  onClose();
                }
              }}
            />
            <div className="picker-list">
              {filteredSongs.length ? filteredSongs.map((song) => {
                const added = addedSet.has(song.id);
                return (
                  <button
                    type="button"
                    key={song.id}
                    className={classNames('picker-row', added && 'added')}
                    onClick={() => onToggleSong(playlist.id, song)}
                  >
                    <div className="sr-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
                    <div className="picker-meta">
                      <div className="t1">{song.title}</div>
                      <div className="t2">{song.artist} · {song.album}</div>
                    </div>
                    <span className={classNames('picker-pill mono', added && 'added')}>
                      {added ? '✓ ADDED' : '+ ADD'}
                    </span>
                  </button>
                );
              }) : <div className="empty" style={{ margin: 12 }}>NO MATCHING TRACKS</div>}
            </div>
          </>
        ) : (
          <div className="modal-body" style={{ padding: 24, textAlign: 'center', alignItems: 'center' }}>
            <div className="modal-hint mono">NO TRACKS INDEXED YET. MOUNT A LOCAL FOLDER OR START DEMO MODE FIRST.</div>
            <div className="mount-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="hw-btn primary" onClick={() => { onClose(); onPickFolder(); }}>+ MOUNT LOCAL FOLDER</button>
              <button type="button" className="hw-btn" onClick={() => { onClose(); onStartDemo(); }}>▶ DEMO MODE</button>
            </div>
          </div>
        )}

        <div className="modal-foot">
          <span className="modal-count mono">{playlist.songIds.length} {playlist.songIds.length === 1 ? 'SONG' : 'SONGS'} IN REEL</span>
          <button type="button" className="hw-btn primary" onClick={onClose}>DONE</button>
        </div>
      </div>
    </div>
  );
}
