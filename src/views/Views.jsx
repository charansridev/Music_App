import { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Disc3,
  Edit3,
  FolderOpen,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { EmptyState, LibrarySkeleton } from '../components/EmptyState.jsx';
import { HardwareSwitch } from '../components/HardwareSwitch.jsx';
import { SeekSurface } from '../components/SeekSurface.jsx';
import { Tooltip } from '../components/Tooltip.jsx';
import { TrackTable } from '../components/TrackTable.jsx';
import { SPRING_SNAPPY, SPRING_SMOOTH, STAGGER_CONTAINER, STAGGER_ITEM } from '../lib/motion.js';
import { Stats } from '../lib/stats.js';
import { classNames, dayKey, formatDay, formatHundredths, formatMinutes, formatTime } from '../lib/utils.js';

const RHYTHM_PALETTE = ['#F4F4F5', '#E53935', '#D4A14A', '#52525B'];

function HeroAlbumSleeve({ current, isPlaying, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 24 });
  const rotateY = useTransform(smoothX, [0, 1], [-8, 8]);
  const rotateX = useTransform(smoothY, [0, 1], [8, -8]);
  const sheenX = useTransform(smoothX, [0, 1], ['10%', '90%']);
  const sheenY = useTransform(smoothY, [0, 1], ['10%', '90%']);
  const sheenBg = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 34%, transparent 66%)`;

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
    pointerY.set(Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)));
  };

  const handlePointerLeave = () => {
    setHovered(false);
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <div className="hero-art-col">
      <button
        type="button"
        className={classNames('hero-art-btn', isPlaying && 'playing', hovered && 'hovered')}
        onClick={onToggle}
        onPointerEnter={() => setHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label={isPlaying ? 'Pause playback' : 'Listen to track'}
      >
        <motion.div
          className="hero-vinyl-carrier"
          initial={false}
          animate={{
            x: isPlaying ? '38%' : hovered ? '11%' : '0%',
            scale: isPlaying ? 0.96 : hovered ? 0.93 : 0.89,
          }}
          transition={SPRING_SMOOTH}
          aria-hidden="true"
        >
          <div
            className={classNames('hero-vinyl-disc spool', isPlaying && 'spinning')}
            id="platter-core"
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            <div className="hero-vinyl-grooves" />
            <div className="hero-vinyl-sheen" />
            <div
              className="hero-vinyl-label"
              style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
            />
            <div className="hero-vinyl-spindle" />
          </div>
        </motion.div>

        <motion.div
          className="hero-sleeve-tilt"
          initial={false}
          animate={{
            x: isPlaying ? -28 : 0,
            scale: hovered ? 1.02 : 1,
          }}
          transition={SPRING_SMOOTH}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 900,
          }}
        >
          <div
            className="hero-art-frame"
            style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
          >
            {!current.art && <Disc3 size={48} strokeWidth={1.2} className="dim" />}
            <motion.div
              className="hero-art-sheen"
              style={{ background: sheenBg }}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </button>
    </div>
  );
}

function HeroControlPanel({ children }) {
  const [hovered, setHovered] = useState(false);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 24 });
  const rotateY = useTransform(smoothX, [0, 1], [-4.5, 4.5]);
  const rotateX = useTransform(smoothY, [0, 1], [4.5, -4.5]);
  const sheenX = useTransform(smoothX, [0, 1], ['10%', '90%']);
  const sheenY = useTransform(smoothY, [0, 1], ['10%', '90%']);
  const sheenBg = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 36%, transparent 68%)`;

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
    pointerY.set(Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)));
  };

  const handlePointerLeave = () => {
    setHovered(false);
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return (
    <motion.div
      className={classNames('hero-meta-col', hovered && 'hovered')}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      animate={{ scale: hovered ? 1.012 : 1 }}
      transition={SPRING_SMOOTH}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
    >
      <motion.div
        className="hero-panel-sheen"
        style={{ background: sheenBg }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}

export function DeckView({
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  savedFolderName,
  scanning,
  scanProgress,
  onPickFolder,
  onReconnectFolder,
  onStartDemo,
  onToggle,
  onStop,
  onNext,
  onPrevious,
  onSeek,
}) {
  const current = currentSong || songs[0];

  if (!current) {
    if (scanning) {
      return (
        <div className="mount-wrap">
          <div className="mount-stack">
            <LibrarySkeleton rows={6} progress={scanProgress} label="Indexing local audio archive" />
          </div>
        </div>
      );
    }

    return (
      <div className="mount-wrap">
        <EmptyState
          className="mount-hero"
          variant="folder"
          eyebrow="LOCAL AUDIO PLAYER"
          title="Drop in a folder to listen"
          description="Index FLAC, WAV, MP3, M4A, AAC, OGG, or OPUS files directly on your device with embedded artwork and lossless playback."
          actions={(
            <>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className="hw-btn primary"
                disabled={scanning}
                onClick={onPickFolder}
              >
                <FolderOpen size={14} strokeWidth={2} />
                Mount Local Folder
              </motion.button>
              {savedFolderName && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  className="hw-btn"
                  onClick={onReconnectFolder}
                >
                  <RefreshCw size={14} strokeWidth={1.9} />
                  Reconnect &ldquo;{savedFolderName}&rdquo;
                </motion.button>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className="hw-btn"
                disabled={scanning}
                onClick={onStartDemo}
              >
                <Sparkles size={14} strokeWidth={1.9} />
                Try Demo Mode
              </motion.button>
            </>
          )}
        />
      </div>
    );
  }

  const progress = duration ? currentTime / duration : 0;
  const trackNum = String(Math.max(1, songs.indexOf(current) + 1)).padStart(2, '0');
  const totalNum = String(songs.length).padStart(2, '0');

  return (
    <div className="hero-stage">
      <HeroAlbumSleeve current={current} isPlaying={isPlaying} onToggle={onToggle} />

      <HeroControlPanel>
        <div className="hero-kicker mono">
          <span>TRACK {trackNum} / {totalNum}</span>
        </div>

        <h1 className="hero-title">{current.title}</h1>
        <p className="hero-subtitle">
          <span className="hero-artist">{current.artist}</span>
          <span className="hero-sep">·</span>
          <span className="hero-album">{current.album}{current.year ? ` (${current.year})` : ''}</span>
        </p>

        <div className="hero-scrubber">
          <SeekSurface id="ruler" className="ruler" value={progress} onSeek={onSeek} label="Seek playback">
            <div className="ruler-fill" id="ruler-fill" style={{ width: `${progress * 100}%` }}>
              <span className="ruler-knob" />
            </div>
          </SeekSurface>
          <div className="hero-timecodes mono">
            <span id="tc-cur">{formatHundredths(currentTime)}</span>
            <span id="tpoint" className="sr-only">T-POINT {(progress * 100).toFixed(1)}%</span>
            <span id="tc-rem" className="hero-rem">
              {duration ? `-${formatHundredths(Math.max(0, duration - currentTime))}` : '-00:00.00'}
            </span>
          </div>
        </div>

        <div className="hero-actions">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="hero-play-btn"
            id="t-pp"
            onClick={onToggle}
          >
            <span id="t-pp-icon">
              {isPlaying ? <Pause size={16} strokeWidth={2.2} fill="currentColor" /> : <Play size={16} strokeWidth={2.2} fill="currentColor" />}
            </span>
            <span id="t-pp-label">{isPlaying ? 'Pause' : 'Listen'}</span>
          </motion.button>

          <Tooltip content="Previous track" shortcut="⇧←">
            <motion.button type="button" whileTap={{ scale: 0.94 }} className="hero-ghost-btn" id="t-prev" aria-label="Previous track" onClick={onPrevious}>
              <SkipBack size={16} strokeWidth={1.9} />
            </motion.button>
          </Tooltip>

          <Tooltip content="Stop">
            <motion.button type="button" whileTap={{ scale: 0.94 }} className="hero-ghost-btn" id="t-stop" aria-label="Stop playback" onClick={onStop}>
              <Square size={14} strokeWidth={2} fill="currentColor" />
            </motion.button>
          </Tooltip>

          <Tooltip content="Next track" shortcut="⇧→">
            <motion.button type="button" whileTap={{ scale: 0.94 }} className="hero-ghost-btn" id="t-next" aria-label="Next track" onClick={onNext}>
              <SkipForward size={16} strokeWidth={1.9} />
            </motion.button>
          </Tooltip>
        </div>
      </HeroControlPanel>
    </div>
  );
}

export function LibraryView({
  songs,
  albums,
  artists,
  genres,
  currentSong,
  folderName,
  scanning,
  tab,
  genre,
  sort,
  onTab,
  onGenre,
  onSort,
  onPickFolder,
  onStartDemo,
  onPlay,
  onContextMenu,
  onPlayAlbum,
  onPlayArtist,
}) {
  if (scanning && !songs.length) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1 className="page-title">Library</h1>
            <div className="page-sub mono">Indexing local archive...</div>
          </div>
        </div>
        <LibrarySkeleton rows={7} label="Scanning audio tags" />
      </>
    );
  }

  if (!songs.length) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1 className="page-title">Library</h1>
            <div className="page-sub mono">No archive mounted</div>
          </div>
        </div>
        <EmptyState
          variant="folder"
          eyebrow="MASTER ARCHIVE"
          title="Your library is empty"
          description="Mount a local music folder or try Demo Mode to browse tracks, albums, and artists."
          actions={(
            <>
              <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
                <FolderOpen size={14} strokeWidth={1.9} /> Mount Local Folder
              </button>
              <button type="button" className="hw-btn" disabled={scanning} onClick={onStartDemo}>
                <Sparkles size={14} strokeWidth={1.9} /> Try Demo Mode
              </button>
            </>
          )}
        />
      </>
    );
  }

  let filteredSongs = songs.filter((song) => genre === 'All' || song.genre === genre);
  if (sort === 'az') filteredSongs = filteredSongs.slice().sort((a, b) => a.title.localeCompare(b.title));
  else filteredSongs = filteredSongs.slice().sort((a, b) => b.year - a.year || a.album.localeCompare(b.album) || a.track - b.track);

  let body;
  if (tab === 'songs') {
    body = <TrackTable songs={filteredSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} />;
  } else if (tab === 'albums') {
    let filteredAlbums = albums.filter((album) => genre === 'All' || album.genre === genre);
    if (sort === 'az') filteredAlbums = filteredAlbums.slice().sort((a, b) => a.name.localeCompare(b.name));
    else filteredAlbums = filteredAlbums.slice().sort((a, b) => b.year - a.year);
    body = (
      <motion.div className="album-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        {filteredAlbums.map((album) => (
          <motion.div
            variants={STAGGER_ITEM}
            whileHover={{ y: -4 }}
            transition={SPRING_SMOOTH}
            className="album-card"
            data-album={album.key}
            key={album.key}
            role="button"
            tabIndex={0}
            onClick={() => onPlayAlbum(album)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPlayAlbum(album);
              }
            }}
          >
            <div className="album-art-wrap">
              <div className="album-vinyl-peek" aria-hidden="true">
                <div className="album-vinyl-label" style={album.art ? { backgroundImage: `url('${album.art}')` } : undefined} />
              </div>
              <div className="album-art" style={{ backgroundImage: `url('${album.art}')` }}>
                <div className="album-sheen" aria-hidden="true" />
              </div>
              <button
                type="button"
                className="play-fab"
                title="Play album"
                aria-label={`Play ${album.name}`}
                onClick={(event) => { event.stopPropagation(); onPlayAlbum(album); }}
              >
                <Play size={14} strokeWidth={2.2} fill="currentColor" style={{ marginLeft: 1 }} />
              </button>
            </div>
            <div className="album-name">{album.name}</div>
            <div className="album-meta mono">
              {album.artist} · {album.year}
              {album.songIds.every((id) => songs.find((song) => song.id === id)?.hires) && (
                <span className="amber"> · HI-RES</span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  } else {
    body = (
      <motion.div className="artist-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        {artists.map((artist) => (
          <motion.div
            variants={STAGGER_ITEM}
            whileHover={{ y: -4 }}
            transition={SPRING_SMOOTH}
            className="artist-card"
            data-artist={artist.name}
            key={artist.name}
            role="button"
            tabIndex={0}
            onClick={() => onPlayArtist(artist)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPlayArtist(artist);
              }
            }}
          >
            <div className="artist-pic" style={{ backgroundImage: `url('${artist.art}')` }} />
            <div className="album-name">{artist.name}</div>
            <div className="album-meta mono">{artist.songIds.length} tracks</div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Library</h1>
          <div className="page-sub mono">
            {folderName ? `${folderName} · ` : ''}{songs.length} tracks · {albums.length} albums · {formatMinutes(songs.reduce((total, song) => total + song.duration, 0) * 1000)}
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="hw-btn" disabled={scanning} onClick={onPickFolder}>
            <FolderOpen size={13} strokeWidth={1.85} />
            {scanning ? 'Scanning...' : 'Change Folder'}
          </button>
          <button type="button" className="hw-btn" onClick={onSort}>
            {sort === 'az' ? 'Sort: A–Z' : 'Sort: Newest'}
          </button>
        </div>
      </div>

      <div className="hw-tabs" role="tablist" aria-label="Library type">
        {['songs', 'albums', 'artists'].map((item) => {
          const active = tab === item;
          return (
            <button
              type="button"
              className={classNames('hw-tab', active && 'active')}
              role="tab"
              aria-selected={active}
              key={item}
              onClick={() => onTab(item)}
            >
              {active && <motion.span layoutId="lib-tab" className="hw-tab-pill" transition={SPRING_SNAPPY} />}
              <span className="hw-tab-label">{item}</span>
            </button>
          );
        })}
      </div>

      {tab === 'songs' && (
        <div className="hw-chips">
          {['All', ...genres].map((item) => (
            <button type="button" className={classNames('hw-chip', genre === item && 'active')} key={item} onClick={() => onGenre(item)}>
              <span>{item}</span>
              <span className="n mono">{item === 'All' ? songs.length : songs.filter((song) => song.genre === item).length}</span>
            </button>
          ))}
        </div>
      )}

      {body}
    </>
  );
}

export function HiresView({ songs, currentSong, onPlayHires, onPlay, onContextMenu }) {
  const hiresSongs = songs.filter((song) => song.hires);
  const dsdCount = hiresSongs.filter((song) => song.spec.includes('DSD')).length;
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hi-Res Vault</h1>
          <div className="page-sub mono">{hiresSongs.length} master files · {dsdCount} DSD · 24-bit lossless</div>
        </div>
        <button type="button" className="hw-btn primary" disabled={!hiresSongs.length} onClick={onPlayHires}>
          <Play size={13} strokeWidth={2.2} fill="currentColor" /> Play Vault
        </button>
      </div>
      <TrackTable
        songs={hiresSongs}
        currentSong={currentSong}
        onPlay={onPlay}
        onContextMenu={onContextMenu}
        options={{
          master: true,
          empty: 'No Hi-Res masters found',
          emptyDesc: 'Mount a folder containing 24-bit FLAC, 96kHz PCM, or DSD files.',
        }}
      />
    </>
  );
}

export function StashView({ songs, playlists, loved, currentSong, onNewPlaylist, onOpenPlaylist, onShuffleLoved, onPlay, onContextMenu }) {
  const lovedSongs = songs.filter((song) => loved.has(song.id));
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tape Stash</h1>
          <div className="page-sub mono">{playlists.length} reels · {lovedSongs.length} loved tracks</div>
        </div>
        <button type="button" className="hw-btn primary" onClick={onNewPlaylist}>
          <Plus size={14} strokeWidth={2} /> New Reel
        </button>
      </div>

      {playlists.length > 0 ? (
        <motion.div className="pl-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
          {playlists.map((playlist) => {
            const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
            const cover = playlistSongs[0]?.art || '';
            return (
              <motion.div
                variants={STAGGER_ITEM}
                whileHover={{ y: -4 }}
                transition={SPRING_SMOOTH}
                className="pl-card"
                key={playlist.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenPlaylist(playlist.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenPlaylist(playlist.id);
                  }
                }}
              >
                <div className="album-art-wrap">
                  <div className="album-vinyl-peek" aria-hidden="true">
                    <div className="album-vinyl-label" style={cover ? { backgroundImage: `url('${cover}')` } : undefined} />
                  </div>
                  <div className="pl-cover" style={cover ? { backgroundImage: `url('${cover}')` } : undefined}>
                    {!cover && <Disc3 size={28} strokeWidth={1.3} />}
                    <div className="album-sheen" aria-hidden="true" />
                  </div>
                </div>
                <div className="album-name">{playlist.name}</div>
                <div className="album-meta mono">{playlistSongs.length} tracks</div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          compact
          variant="tape"
          eyebrow="TAPE STASH"
          title="No reels created yet"
          description="Create a custom tape reel to organize tracks for focused listening."
          actions={(
            <button type="button" className="hw-btn primary" onClick={onNewPlaylist}>
              <Plus size={14} strokeWidth={2} /> Create First Reel
            </button>
          )}
        />
      )}

      <div className="section-block">
        <div className="section-head">
          <h2 className="section-title">Loved Tracks</h2>
          <button type="button" className="hw-btn" onClick={onShuffleLoved}>
            <Shuffle size={13} strokeWidth={1.9} /> Shuffle Loved
          </button>
        </div>
        <TrackTable
          songs={lovedSongs}
          currentSong={currentSong}
          onPlay={onPlay}
          onContextMenu={onContextMenu}
          options={{
            empty: 'No loved tracks yet',
            emptyDesc: 'Click the heart button on the player bar or right-click any track.',
          }}
        />
      </div>
    </>
  );
}

export function PlaylistView({ playlist, songs, currentSong, onPlayPlaylist, onAddSongs, onRename, onDelete, onPlay, onContextMenu }) {
  if (!playlist) {
    return (
      <EmptyState
        variant="tape"
        eyebrow="TAPE STASH"
        title="Reel not found"
        description="This reel may have been erased or moved."
      />
    );
  }
  const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{playlist.name}</h1>
          <div className="page-sub mono">{playlistSongs.length} tracks · {formatMinutes(playlistSongs.reduce((total, song) => total + song.duration, 0) * 1000)}</div>
        </div>
        <div className="page-actions">
          <button type="button" className="hw-btn primary" disabled={!playlistSongs.length} onClick={() => onPlayPlaylist(playlist)}>
            <Play size={13} strokeWidth={2.2} fill="currentColor" /> Play Reel
          </button>
          <button type="button" className="hw-btn" onClick={() => onAddSongs(playlist)}>
            <Plus size={13} strokeWidth={2} /> Add Songs
          </button>
          <button type="button" className="hw-btn" onClick={() => onRename(playlist)}>
            <Edit3 size={13} strokeWidth={1.85} /> Rename
          </button>
          <button type="button" className="hw-btn danger" onClick={() => onDelete(playlist)}>
            <Trash2 size={13} strokeWidth={1.85} /> Erase
          </button>
        </div>
      </div>
      {playlistSongs.length ? (
        <TrackTable songs={playlistSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} />
      ) : (
        <EmptyState
          variant="tape"
          eyebrow={playlist.name.toUpperCase()}
          title="This reel is empty"
          description="Add tracks from your library to populate this reel."
          actions={(
            <button type="button" className="hw-btn primary" onClick={() => onAddSongs(playlist)}>
              <Plus size={14} strokeWidth={2} /> Add Songs to Reel
            </button>
          )}
        />
      )}
    </>
  );
}

function StatBox({ value, caption }) {
  return (
    <motion.div className="stat-box hw-card" variants={STAGGER_ITEM}>
      <div className="num mono">{value}</div>
      <div className="cap mono">{caption}</div>
    </motion.div>
  );
}

function computeBestStreak(history) {
  const days = [...new Set(history.map((entry) => dayKey(entry.ts)))].sort();
  if (!days.length) return 0;
  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index++) {
    const previous = new Date(`${days[index - 1]}T00:00:00`).getTime();
    const current = new Date(`${days[index]}T00:00:00`).getTime();
    if (Math.round((current - previous) / 86400000) === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export function StatsView({ history, songs, lovedCount, playlistCount, goalMin, tab, chartMode, onTab, onChartMode, onGoalChange }) {
  let body;
  if (tab === 'overview') {
    const buckets = Stats.whenYouListen(history).map((bucket, index) => ({
      ...bucket,
      color: RHYTHM_PALETTE[index % RHYTHM_PALETTE.length],
    }));
    const total = buckets.reduce((sum, bucket) => sum + bucket.n, 0) || 1;
    let accumulated = 0;
    const stops = buckets.map((bucket) => {
      const from = (accumulated / total) * 100;
      accumulated += bucket.n;
      return `${bucket.color} ${from}% ${(accumulated / total) * 100}%`;
    }).join(', ');
    const streak = Stats.streak(history);
    const chartData = chartMode === '7d' ? Stats.last7Days(history) : Stats.last8Weeks(history);
    const maximum = Math.max(...chartData.map((entry) => entry.ms), 1);

    body = (
      <>
        <motion.div className="stat-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
          <StatBox value={formatMinutes(Stats.totalMs(history))} caption="Time listened" />
          <StatBox value={Stats.totalPlays(history)} caption="Songs played" />
          <StatBox value={formatMinutes(Stats.avgDayMs(history))} caption="Daily average" />
          <StatBox value={streak} caption="Current streak · days" />
        </motion.div>

        <div className="two-col">
          <div className="panel hw-card">
            <div className="panel-head">
              <div className="panel-title mono">LISTENING ACTIVITY</div>
              <div className="hw-tabs">
                {['7d', '8w'].map((mode) => {
                  const active = chartMode === mode;
                  return (
                    <button
                      type="button"
                      key={mode}
                      className={classNames('hw-tab', active && 'active')}
                      onClick={() => onChartMode(mode)}
                    >
                      {active && <motion.span layoutId="chart-mode" className="hw-tab-pill" transition={SPRING_SNAPPY} />}
                      <span className="hw-tab-label">{mode === '7d' ? '7D' : '8W'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div id="stats-chart">
              <div className="chart">
                {chartData.map((entry, index) => (
                  <div className="bar" key={entry.ts}>
                    <div
                      className={classNames('fill', index === chartData.length - 1 && chartMode === '7d' ? 'today' : 'dim')}
                      style={{ height: `${Math.max(4, (entry.ms / maximum) * 88)}%` }}
                      title={formatMinutes(entry.ms)}
                    />
                    <div className="lbl mono">{entry.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel hw-card">
            <div className="panel-head"><div className="panel-title mono">TIME OF DAY</div></div>
            <div className="rhythm-wrap">
              <div
                className="donut"
                style={{
                  background: history.length ? `conic-gradient(${stops})` : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="donut-core">
                  <b className="mono">{formatMinutes(Stats.totalMs(history) / Math.max(1, Stats.totalPlays(history)))}</b>
                  <div className="donut-sub mono">AVG TRACK</div>
                </div>
              </div>
              <div className="rhythm-bars">
                {buckets.map((bucket) => (
                  <div className="genre-row" key={bucket.name}>
                    <div className="g-head mono">
                      <span>{bucket.name.toUpperCase()}</span>
                      <span>{Math.round((bucket.n / total) * 100)}%</span>
                    </div>
                    <div className="genre-track">
                      <div className="genre-fill" style={{ width: `${Math.round((bucket.n / total) * 100)}%`, background: bucket.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } else if (tab === 'history') {
    const dayGroups = Stats.historyByDay(history).slice(0, 14);
    body = dayGroups.length ? dayGroups.map((day) => (
      <div className="history-day hw-card" key={dayKey(day.ts)}>
        <div className="hd-date mono">
          {formatDay(day.ts)} · {day.plays.length} plays · {formatMinutes(day.plays.reduce((sum, play) => sum + (play.ms || 0), 0))}
        </div>
        {day.plays.slice(0, 6).map((play) => {
          const song = songs.find((item) => item.id === play.songId);
          if (!song) return null;
          return (
            <div className="hist-row" key={play.id || `${play.songId}-${play.ts}`}>
              <span className="hist-time mono">{new Date(play.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              <div className="hist-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
              <div className="hist-t"><div className="t1">{song.title}</div><div className="t2 mono">{song.artist}</div></div>
              <span className="hist-ms mono">{formatMinutes(play.ms || 0)}</span>
            </div>
          );
        })}
      </div>
    )) : (
      <EmptyState
        variant="history"
        eyebrow="PLAY HISTORY"
        title="No listening history yet"
        description="Playback activity is logged locally once you listen to tracks."
      />
    );
  } else {
    const streak = Stats.streak(history);
    const bestStreak = Math.max(computeBestStreak(history), streak);
    const activeDays = new Set(history.map((entry) => dayKey(entry.ts)));
    const dots = [];
    const date = new Date();
    for (let index = 0; index < 35; index++) {
      dots.unshift(activeDays.has(dayKey(date.getTime())));
      date.setDate(date.getDate() - 1);
    }
    body = (
      <>
        <motion.div className="stat-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
          <StatBox value={streak} caption="Current streak · days" />
          <StatBox value={bestStreak} caption="Best streak · days" />
          <StatBox value={formatMinutes(Stats.todayMs(history))} caption={`Today vs ${goalMin}m goal`} />
          <StatBox value={Math.round(Stats.avgDayMs(history) / 60000)} caption="Avg day · min" />
        </motion.div>
        <div className="panel hw-card">
          <div className="panel-head">
            <div className="panel-title mono">35-DAY CADENCE</div>
            <span className="page-sub mono">1 cell = 1 day</span>
          </div>
          <div className="streak-dots">
            {dots.map((active, index) => <div className={classNames('streak-dot', active && 'hit')} key={index} />)}
          </div>
          <div className="goal-row">
            <label className="page-sub mono" htmlFor="goal-input">DAILY GOAL</label>
            <input
              type="number"
              id="goal-input"
              className="goal-input mono"
              value={goalMin}
              min="5"
              max="480"
              aria-label="Daily listening goal in minutes"
              onChange={(event) => onGoalChange(Math.max(5, Math.min(480, Number(event.target.value) || 30)))}
            />
            <span className="page-sub mono">min / day</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Telemetry</h1>
          <div className="page-sub mono">{songs.length} tracks · 60-day window · {lovedCount} loved · {playlistCount} reels</div>
        </div>
        <div className="hw-tabs" role="tablist" aria-label="Telemetry section">
          {['overview', 'history', 'streak'].map((item) => {
            const active = tab === item;
            return (
              <button
                type="button"
                className={classNames('hw-tab', active && 'active')}
                role="tab"
                aria-selected={active}
                key={item}
                onClick={() => onTab(item)}
              >
                {active && <motion.span layoutId="stats-tab" className="hw-tab-pill" transition={SPRING_SNAPPY} />}
                <span className="hw-tab-label">{item}</span>
              </button>
            );
          })}
        </div>
      </div>
      {body}
    </>
  );
}

export function SettingsView({
  switches,
  folderName,
  songCount,
  canRescan,
  isDemoMode,
  scanning,
  onToggleSwitch,
  onPickFolder,
  onStartDemo,
  onRescan,
  onDisconnect,
  onClearHistory,
}) {
  const settingRow = (label, description, key) => (
    <div className="setting-row" key={key}>
      <div>
        <div className="setting-label">{label}</div>
        <div className="desc mono">{description}</div>
      </div>
      <HardwareSwitch checked={switches[key]} onChange={(value) => onToggleSwitch(key, value)} label={label} />
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">System</h1>
          <div className="page-sub mono">Audio DSP &amp; local archive configuration</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel hw-card">
          <div className="panel-head"><div className="panel-title mono">AUDIO DSP</div></div>
          {settingRow('Glyph Soundwire', 'Turntable & spectrum meters react 1:1 to live signal', 'glyphSync')}
          {settingRow('Crossfeed DSP', 'Subtle stereo crossfeed filter for headphone listening', 'crossfeed')}
          {settingRow('Mono downmix', 'Sum stereo channels to a single centered output', 'mono')}
        </div>

        <div className="panel hw-card">
          <div className="panel-head"><div className="panel-title mono">LOCAL ARCHIVE</div></div>
          <div className="settings-actions">
            <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
              <FolderOpen size={13} strokeWidth={1.9} />
              {scanning ? 'Scanning...' : folderName && !isDemoMode ? 'Change Folder' : 'Mount Local Folder'}
            </button>
            {!isDemoMode && (
              <button type="button" className="hw-btn" disabled={scanning} onClick={onStartDemo}>
                <Sparkles size={13} strokeWidth={1.9} /> Demo Mode
              </button>
            )}
            {canRescan && (
              <button type="button" className="hw-btn" disabled={scanning} onClick={onRescan}>
                <RefreshCw size={13} strokeWidth={1.9} /> Rescan Folder
              </button>
            )}
            {folderName && (
              <button type="button" className="hw-btn danger" disabled={scanning} onClick={onDisconnect}>
                {isDemoMode ? 'Exit Demo Mode' : 'Disconnect'}
              </button>
            )}
            <button type="button" className="hw-btn danger" onClick={onClearHistory}>
              <Trash2 size={13} strokeWidth={1.9} /> Erase History
            </button>
          </div>
          <p className="settings-note mono">
            {isDemoMode
              ? `Demo mode active · ${songCount} sample tracks loaded.`
              : folderName
                ? `Mounted folder: "${folderName}" · ${songCount} tracks indexed locally.`
                : 'No local folder mounted. Pick a folder or launch Demo Mode.'}
          </p>
        </div>
      </div>
    </>
  );
}

export function HelpView() {
  const shortcuts = [
    ['SPACE', 'Play / pause'],
    ['← / →', 'Seek ±5 seconds'],
    ['SHIFT + ← / →', 'Previous / next track'],
    ['CTRL / CMD + K', 'Search archive'],
    ['Q', 'Toggle queue drawer'],
    ['ESC', 'Close active overlay or modal'],
  ];
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Shortcuts</h1>
          <div className="page-sub mono">Keyboard controls &amp; transport bindings</div>
        </div>
      </div>
      <div className="panel hw-card" style={{ maxWidth: 600 }}>
        <div className="panel-head"><div className="panel-title mono">KEY BINDINGS</div></div>
        {shortcuts.map(([shortcut, description]) => (
          <div className="help-row" key={shortcut}>
            <kbd>{shortcut}</kbd>
            <span className="d">{description}</span>
          </div>
        ))}
      </div>
    </>
  );
}
