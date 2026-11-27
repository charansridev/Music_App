import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  FolderOpen,
  Heart,
  ListMusic,
  ListPlus,
  Play,
  Plus,
  Search,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react';
import { EmptyState } from './EmptyState.jsx';
import { MODAL_PANEL, OVERLAY_BACKDROP, SPRING_SNAPPY, SPRING_SMOOTH } from '../lib/motion.js';
import { classNames } from '../lib/utils.js';

export function BootScreen() {
  const [mounted, setMounted] = useState(() => {
    try {
      return sessionStorage.getItem('booted') !== '1';
    } catch {
      return true;
    }
  });
  const [lines, setLines] = useState([]);

  const dismiss = useCallback(() => {
    setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    try {
      sessionStorage.setItem('booted', '1');
    } catch {
      // Ignore storage errors when sessionStorage is unavailable.
    }
    const messages = [
      'DAC CLOCK ........ 24-BIT LOCK',
      'GLYPH BUS ........ 1:1 TELEMETRY',
      'ARCHIVE .......... READY',
    ];
    let index = 0;
    const interval = window.setInterval(() => {
      const nextLine = messages[index];
      index += 1;
      if (nextLine) {
        setLines((current) => [...current, nextLine]);
      }
      if (index >= messages.length) window.clearInterval(interval);
    }, 180);
    const timeout = window.setTimeout(dismiss, 900);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [dismiss, mounted]);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          id="boot"
          role="button"
          tabIndex={0}
          aria-label="Skip boot sequence"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
          onClick={dismiss}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') dismiss();
          }}
        >
          <motion.div
            className="boot-inner"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SMOOTH}
          >
            <div className="boot-mark" aria-hidden="true">
              <span className="boot-mark-ring" />
              <span className="boot-mark-core" />
            </div>
            <div className="boot-name">NOTHING</div>
            <div className="boot-sub mono">AUDIO OS-1</div>
            <div className="boot-log mono">
              {lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QueuePanel({ open, queue, qIndex, isPlaying, onClose, onJump, onRemove }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="queue-scrim"
            variants={OVERLAY_BACKDROP}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <motion.aside
            id="queue-panel"
            className="open"
            aria-label="Transmission queue"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING_SMOOTH}
          >
            <div className="q-head">
              <span className="mono">QUEUE · <b>{queue.length}</b></span>
              <button type="button" title="Close" aria-label="Close queue" onClick={onClose}>
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
            <div id="queue-list">
              {queue.length ? queue.map((song, index) => (
                <div
                  className={classNames('q-row', index === qIndex && 'current')}
                  key={`${song.id}-${index}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onJump(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onJump(index);
                    }
                  }}
                >
                  <div className="q-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
                  <div className="q-meta">
                    <div className="t1">{song.title}</div>
                    <div className="t2 mono">{song.artist}</div>
                  </div>
                  {index === qIndex && isPlaying ? (
                    <span className="q-eq" aria-label="Now playing"><i /><i /><i /></span>
                  ) : (
                    <button
                      type="button"
                      className="q-x"
                      aria-label={`Remove ${song.title} from queue`}
                      onClick={(event) => { event.stopPropagation(); onRemove(index); }}
                    >
                      <X size={13} strokeWidth={1.9} />
                    </button>
                  )}
                </div>
              )) : (
                <EmptyState
                  compact
                  variant="queue"
                  eyebrow="QUEUE"
                  title="Queue is empty"
                  description="Select a track or album to stage playback."
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
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
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timeout);
  }, [open]);

  const renderRow = (art, title, subtitle, onClick, key) => (
    <button type="button" className="sr-row" key={key} onClick={onClick}>
      <div className="sr-thumb" style={{ backgroundImage: `url('${art}')` }} />
      <div className="sr-meta">
        <div className="t1">{title}</div>
        <div className="t2 mono">{subtitle}</div>
      </div>
      <span className="go mono">PLAY <ArrowRight size={11} strokeWidth={2} /></span>
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="search-overlay"
          className="open"
          role="dialog"
          aria-modal="true"
          aria-label="Search archive"
          variants={OVERLAY_BACKDROP}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(event) => { if (event.target.id === 'search-overlay') onClose(); }}
        >
          <motion.div className="search-box hw-card" variants={MODAL_PANEL} initial="initial" animate="animate" exit="exit">
            <div className="search-head mono">
              <span>SEARCH ARCHIVE</span>
              <button type="button" onClick={onClose} aria-label="Close search">
                <X size={14} strokeWidth={1.9} />
              </button>
            </div>
            <div className="search-input-wrap">
              <Search size={15} strokeWidth={1.8} className="search-input-ico" />
              <input
                ref={inputRef}
                id="search-input"
                type="text"
                placeholder="Search songs, artists, or albums..."
                autoComplete="off"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && songResults[0]) onPlaySong(songResults[0]);
                  if (event.key === 'Escape') onClose();
                }}
              />
            </div>
            <div id="search-results">
              {!normalizedQuery && (
                <EmptyState
                  compact
                  variant="search"
                  eyebrow="INDEX"
                  title={songs.length ? 'Type to search' : 'Archive offline'}
                  description={songs.length ? `Searching ${songs.length} local tracks across ${albums.length} albums.` : 'Mount a local music folder or start demo mode first.'}
                />
              )}
              {artistResults.length > 0 && <div className="sr-label mono">ARTISTS</div>}
              {artistResults.map((artist) => renderRow(artist.art, artist.name, `${artist.songIds.length} tracks`, () => onSearchArtist(artist), artist.name))}
              {albumResults.length > 0 && <div className="sr-label mono">ALBUMS</div>}
              {albumResults.map((album) => renderRow(album.art, album.name, `${album.artist} · ${album.year}`, () => onSearchAlbum(album), album.key))}
              {songResults.length > 0 && <div className="sr-label mono">TRACKS</div>}
              {songResults.map((song) => renderRow(song.art, song.title, `${song.artist} · ${song.spec}`, () => onPlaySong(song), song.id))}
              {normalizedQuery && !artistResults.length && !albumResults.length && !songResults.length && (
                <EmptyState
                  compact
                  variant="search"
                  eyebrow="NO MATCH"
                  title={`No results for "${query.trim()}"`}
                  description="Try a different song, artist, or album name."
                />
              )}
            </div>
            <div className="search-foot mono">
              <span>ENTER TO PLAY TOP MATCH</span>
              <span>ESC TO CLOSE</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContextMenu({ menu, playlists, loved, onClose, onPlay, onPlayNext, onQueue, onToggleLove, onAddToPlaylist, onNewPlaylistWith }) {
  return (
    <AnimatePresence>
      {menu && (
        <>
          <div id="menu-overlay" className="open" onClick={onClose} />
          <motion.div
            id="ctx-menu"
            className="ctx-menu hw-card"
            role="menu"
            style={{
              left: Math.max(8, Math.min(menu.x, window.innerWidth - 236)),
              top: Math.max(8, Math.min(menu.y, window.innerHeight - 310)),
            }}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={SPRING_SNAPPY}
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const run = (action) => {
                action();
                onClose();
              };
              const isLoved = loved.has(menu.song.id);
              return (
                <>
                  <div className="ctx-head mono">{menu.song.title}</div>
                  <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onPlay(menu.song))}>
                    <Play size={13} strokeWidth={1.9} /> Play now
                  </button>
                  <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onPlayNext(menu.song))}>
                    <SkipForward size={13} strokeWidth={1.9} /> Play next
                  </button>
                  <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onQueue(menu.song))}>
                    <ListMusic size={13} strokeWidth={1.9} /> Add to queue
                  </button>
                  <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onToggleLove(menu.song.id))}>
                    <Heart size={13} strokeWidth={1.9} fill={isLoved ? 'currentColor' : 'none'} className={isLoved ? 'red' : ''} />
                    {isLoved ? 'Remove from loved' : 'Add to loved'}
                  </button>
                  {playlists.length > 0 && <div className="ctx-sep" />}
                  {playlists.map((playlist) => (
                    <button type="button" className="ctx-item" role="menuitem" key={playlist.id} onClick={() => run(() => onAddToPlaylist(playlist, menu.song))}>
                      <ListPlus size={13} strokeWidth={1.9} /> Add to {playlist.name}
                    </button>
                  ))}
                  <div className="ctx-sep" />
                  <button type="button" className="ctx-item" role="menuitem" onClick={() => run(() => onNewPlaylistWith(menu.song))}>
                    <Plus size={13} strokeWidth={1.9} /> New reel from song
                  </button>
                </>
              );
            })()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Toasts({ messages }) {
  return (
    <div id="toasts" aria-live="polite">
      <AnimatePresence>
        {messages.map((toast) => (
          <motion.div
            className="toast"
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 18, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 14, scale: 0.96 }}
            transition={SPRING_SNAPPY}
          >
            <span className="toast-dot" />
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
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
    }, 30);
    return () => window.clearTimeout(timer);
  }, [modal]);

  const isRename = modal?.mode === 'rename';
  const trimmed = name.trim();

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-label={isRename ? 'Rename reel' : 'Create new reel'}
          variants={OVERLAY_BACKDROP}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.form
            className="modal-box hw-card"
            variants={MODAL_PANEL}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={(event) => {
              event.preventDefault();
              if (trimmed) onSubmit(trimmed);
            }}
          >
            <div className="modal-head mono">
              <span>{isRename ? 'RENAME REEL' : 'NEW REEL'}</span>
              <button type="button" onClick={onClose} aria-label="Close dialog">
                <X size={14} strokeWidth={1.9} />
              </button>
            </div>
            <div className="modal-body">
              {modal.song && (
                <div className="modal-hint mono">SEEDING WITH: <b>{modal.song.title}</b></div>
              )}
              <input
                ref={inputRef}
                type="text"
                className="modal-input"
                placeholder="Enter reel name (e.g. Night Drive)"
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
              <button type="button" className="hw-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="hw-btn primary" disabled={!trimmed}>
                {isRename ? 'Save Name' : 'Create Reel'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AddSongsModal({ playlist, songs, onClose, onToggleSong, onPickFolder, onStartDemo }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!playlist?.id) return undefined;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
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

  return (
    <AnimatePresence>
      {playlist && (
        <motion.div
          className="modal-overlay open"
          role="dialog"
          aria-modal="true"
          aria-label={`Add songs to ${playlist.name}`}
          variants={OVERLAY_BACKDROP}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.div
            className="modal-box hw-card modal-lg"
            variants={MODAL_PANEL}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="modal-head mono">
              <span>ADD SONGS · {playlist.name.toUpperCase()}</span>
              <button type="button" onClick={onClose} aria-label="Close song picker">
                <X size={14} strokeWidth={1.9} />
              </button>
            </div>

            {songs.length > 0 ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  className="modal-input modal-search"
                  placeholder="Filter tracks by title, artist, or album..."
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
                          <div className="t2 mono">{song.artist} · {song.album}</div>
                        </div>
                        <span className={classNames('picker-pill mono', added && 'added')}>
                          {added ? <><Check size={11} strokeWidth={2.2} /> Added</> : <><Plus size={11} strokeWidth={2.2} /> Add</>}
                        </span>
                      </button>
                    );
                  }) : (
                    <EmptyState
                      compact
                      variant="search"
                      eyebrow="NO MATCHES"
                      title="No matching tracks"
                      description="Clear the filter to see all tracks."
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="modal-body">
                <EmptyState
                  compact
                  variant="folder"
                  eyebrow="ARCHIVE EMPTY"
                  title="No tracks indexed yet"
                  description="Mount a local music folder or start demo mode first."
                  actions={(
                    <>
                      <button type="button" className="hw-btn primary" onClick={() => { onClose(); onPickFolder(); }}>
                        <FolderOpen size={14} strokeWidth={1.8} /> Mount Local Folder
                      </button>
                      <button type="button" className="hw-btn" onClick={() => { onClose(); onStartDemo(); }}>
                        <Sparkles size={14} strokeWidth={1.8} /> Demo Mode
                      </button>
                    </>
                  )}
                />
              </div>
            )}

            <div className="modal-foot">
              <span className="modal-count mono">{playlist.songIds.length} {playlist.songIds.length === 1 ? 'song' : 'songs'} in reel</span>
              <button type="button" className="hw-btn primary" onClick={onClose}>Done</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
