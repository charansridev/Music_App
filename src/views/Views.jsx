import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Disc3,
  Edit3,
  FolderOpen,
  Heart,
  ListMusic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DiagonalArrowGraphic,
  DotMatrixScrubber,
  RainbowArcMeter,
  SignalBadge,
  ThreeProngReel,
  TransitMapGraphic,
  WaveformScrubber,
} from '../components/EditorialGraphics.jsx';
import { EmptyState, LibrarySkeleton } from '../components/EmptyState.jsx';
import { HardwareSwitch } from '../components/HardwareSwitch.jsx';
import { SeekSurface } from '../components/SeekSurface.jsx';
import { Tooltip } from '../components/Tooltip.jsx';
import { TrackTable } from '../components/TrackTable.jsx';
import { SPRING_SNAPPY, SPRING_SMOOTH, STAGGER_CONTAINER, STAGGER_ITEM } from '../lib/motion.js';
import { Stats } from '../lib/stats.js';
import { classNames, dayKey, formatDecibels, formatHundredths, formatMinutes } from '../lib/utils.js';

const RHYTHM_PALETTE = ['#F4D026', '#18B848', '#F25C2A', '#E892C4'];
const STASH_SURFACES = ['surface-green', 'surface-sand', 'surface-paper', 'surface-ink'];

const DECK_MODES = [
  { id: 'mix', badge: 'M', label: 'Mix', tone: 'yellow' },
  { id: 'reel', badge: 'R', label: 'Reel', tone: 'orange' },
  { id: 'poster', badge: 'P', label: 'Poster', tone: 'green' },
];

export function DeckView({
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  shuffle = false,
  repeat = 'off',
  loved = false,
  volume = 0.8,
  muted = false,
  queueCount = 0,
  savedFolderName,
  scanning,
  scanProgress,
  onPickFolder,
  onReconnectFolder,
  onToggle,
  onStop,
  onNext,
  onPrevious,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onLove,
  onVolume,
  onMute,
  onToggleQueue,
}) {
  const [deckMode, setDeckMode] = useState('mix');
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
        <motion.section
          className="ed-onboard"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SMOOTH}
        >
          <div className="ed-onboard-art">
            <div className="ed-onboard-head">
              <div className="ed-onboard-kicker mono">MUZIK // LOCAL ARCHIVE</div>
              <h1 className="ed-onboard-headline">
                Sound Made
                <span>Visible</span>
              </h1>
            </div>
            <div className="ed-onboard-transit">
              <TransitMapGraphic />
            </div>
            <div className="ed-onboard-dots mono">
              <SignalBadge label="M" tone="paper" size="sm" />
              <SignalBadge label="U" tone="yellow" size="sm" />
              <SignalBadge label="Z" tone="green" size="sm" />
              <SignalBadge label="I" tone="pink" size="sm" />
              <SignalBadge label="K" tone="orange" size="sm" />
              <span className="ed-onboard-tag">LOSSLESS · LOCAL-FIRST</span>
            </div>
          </div>

          <div className="ed-onboard-sheet">
            <div className="ed-sheet-top">
              <span className="ed-sheet-eyebrow mono">EDITION 01 · DESKTOP DECK</span>
              <span className="ed-sheet-num">00</span>
            </div>
            <h2 className="ed-sheet-title">Drop in a folder to listen.</h2>
            <p className="ed-sheet-desc">
              Index FLAC, WAV, MP3, M4A, AAC, OGG, or OPUS tracks directly from your machine with embedded cover art, live DSP crossfeed, and editorial playback decks.
            </p>
            <div className="ed-sheet-actions">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className="hw-btn ed-btn-ink"
                disabled={scanning}
                onClick={onPickFolder}
              >
                <FolderOpen size={15} strokeWidth={2} />
                Mount Local Folder
              </motion.button>
              {savedFolderName && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  className="hw-btn ed-btn-outline"
                  onClick={onReconnectFolder}
                >
                  <RefreshCw size={14} strokeWidth={1.9} />
                  Reconnect &ldquo;{savedFolderName}&rdquo;
                </motion.button>
              )}
            </div>
            <div className="ed-sheet-foot mono">
              <span>ZERO CLOUD UPLOAD</span>
              <span>24-BIT / DSD READY</span>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }

  const effectiveDuration = duration || current.duration || 0;
  const progress = effectiveDuration ? currentTime / effectiveDuration : 0;
  const trackIdx = Math.max(0, songs.findIndex((item) => item.id === current.id));
  const trackNum = String(trackIdx + 1).padStart(2, '0');
  const totalNum = String(songs.length).padStart(2, '0');

  const modeSwitcher = (
    <div className="ed-deck-topbar">
      <div className="ed-deck-modes" role="tablist" aria-label="Deck presentation mode">
        {DECK_MODES.map((mode) => {
          const active = deckMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={classNames('ed-mode-pill', active && 'active')}
              onClick={() => setDeckMode(mode.id)}
            >
              <SignalBadge label={mode.badge} tone={mode.tone} size="sm" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ed-deck-meta-bar mono">
        <span className="ed-spec-pill">{current.spec}</span>
        <button
          type="button"
          className={classNames('ed-top-icon-btn', loved && 'loved')}
          aria-label={loved ? 'Remove from loved' : 'Love track'}
          aria-pressed={loved}
          onClick={onLove}
        >
          <Heart size={13} strokeWidth={2} fill={loved ? 'currentColor' : 'none'} />
          <span>{loved ? 'LOVED' : 'LOVE'}</span>
        </button>
        <button
          type="button"
          className="ed-top-icon-btn"
          aria-label="Toggle queue"
          onClick={onToggleQueue}
        >
          <ListMusic size={13} strokeWidth={2} />
          <span>QUEUE ({queueCount})</span>
        </button>
      </div>
    </div>
  );

  const sharedUtilityControls = (variant = 'paper') => (
    <div className={classNames('ed-util-row', `variant-${variant}`)}>
      <div className="ed-signal-controls">
        <SignalBadge
          label="S"
          tone="yellow"
          size="sm"
          active={shuffle}
          pressed={shuffle}
          title={shuffle ? 'Shuffle on' : 'Shuffle off'}
          ariaLabel="Toggle shuffle"
          onClick={onToggleShuffle}
        />
        <SignalBadge
          label={repeat === 'one' ? '1' : 'R'}
          tone="orange"
          size="sm"
          active={repeat !== 'off'}
          pressed={repeat !== 'off'}
          title={`Repeat: ${repeat}`}
          ariaLabel={`Repeat mode: ${repeat}`}
          onClick={onCycleRepeat}
        />
        <SignalBadge
          label="♥"
          tone="pink"
          size="sm"
          active={loved}
          pressed={loved}
          title={loved ? 'Remove from loved' : 'Love track'}
          ariaLabel={loved ? 'Remove from loved' : 'Love track'}
          onClick={onLove}
        />
      </div>

      <div className="ed-vol-inline">
        <button
          type="button"
          className="ed-vol-mute"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={onMute}
        >
          {muted || volume === 0 ? <VolumeX size={14} strokeWidth={2} /> : <Volume2 size={14} strokeWidth={2} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          aria-label="Volume"
          className="ed-vol-slider"
          onChange={(event) => onVolume(Number(event.target.value) / 100)}
        />
        <span className="mono ed-vol-db">{formatDecibels(volume)}</span>
      </div>
    </div>
  );

  if (deckMode === 'reel') {
    return (
      <div className="ed-deck-wrap">
        {modeSwitcher}
        <div className="ed-deck-grid ed-deck-reel">
          <div className="ed-panel-taupe">
            <div className="ed-taupe-head">
              <div>
                <div className="ed-eyebrow mono">TAPE TRANSPORT</div>
                <h1 className="ed-reel-title">{current.title}</h1>
                <div className="ed-reel-sub">{current.artist} · {current.album}</div>
              </div>
              <div
                className="ed-mini-sleeve"
                style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
              />
            </div>

            <button
              type="button"
              className="ed-reel-stage"
              onClick={onToggle}
              aria-label={isPlaying ? 'Pause playback' : 'Play track'}
            >
              <ThreeProngReel isPlaying={isPlaying} size={236} id="platter-core" />
            </button>

            <div className="ed-taupe-scrubber">
              <div className="ed-timecodes mono">
                <span id="tc-cur">{formatHundredths(currentTime)}</span>
                <span id="tpoint" className="sr-only">T-POINT {(progress * 100).toFixed(1)}%</span>
                <span id="tc-rem">{effectiveDuration ? `-${formatHundredths(Math.max(0, effectiveDuration - currentTime))}` : '-00:00.00'}</span>
              </div>
              <DotMatrixScrubber progress={progress} onSeek={onSeek} />
            </div>
          </div>

          <div className="ed-panel-ink-reel">
            <div className="ed-reel-top-row">
              <div className="ed-big-num">{trackNum}</div>
              <div className="ed-reel-badges">
                <span className="mono ed-reel-total">OF {totalNum}</span>
                <span className="mono ed-reel-mode">{isPlaying ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>

            <div className="ed-arc-wrap">
              <RainbowArcMeter progress={progress} />
              <div className="ed-arc-caption mono">{Math.round(progress * 100)}% ELAPSED</div>
            </div>

            <div className="ed-spectrum-bars" aria-hidden="true">
              {Array.from({ length: 16 }, (_, index) => (
                <div className="ed-sp-col" key={index}>
                  <div className="ed-sp-bar" id={`sp-${index}`} style={{ height: '8%' }} />
                </div>
              ))}
            </div>

            <div className="ed-reel-controls">
              <div className="ed-transport-row dark">
                <Tooltip content="Previous" shortcut="⇧←">
                  <motion.button type="button" whileTap={{ scale: 0.93 }} className="ed-icon-circle dark" aria-label="Previous track" onClick={onPrevious}>
                    <SkipBack size={16} strokeWidth={2} />
                  </motion.button>
                </Tooltip>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  className="ed-play-pill light"
                  id="t-pp"
                  onClick={onToggle}
                >
                  {isPlaying ? <Pause size={16} strokeWidth={2.2} fill="currentColor" /> : <Play size={16} strokeWidth={2.2} fill="currentColor" />}
                  <span>{isPlaying ? 'Pause' : 'Listen'}</span>
                </motion.button>
                <Tooltip content="Stop">
                  <motion.button type="button" whileTap={{ scale: 0.93 }} className="ed-icon-circle dark" aria-label="Stop playback" onClick={onStop}>
                    <Square size={14} strokeWidth={2} fill="currentColor" />
                  </motion.button>
                </Tooltip>
                <Tooltip content="Next" shortcut="⇧→">
                  <motion.button type="button" whileTap={{ scale: 0.93 }} className="ed-icon-circle dark" aria-label="Next track" onClick={onNext}>
                    <SkipForward size={16} strokeWidth={2} />
                  </motion.button>
                </Tooltip>
              </div>
              {sharedUtilityControls('ink')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (deckMode === 'poster') {
    return (
      <div className="ed-deck-wrap">
        {modeSwitcher}
        <section className="ed-poster-green">
          <div className="ed-poster-top">
            <div className="ed-poster-arrow">
              <DiagonalArrowGraphic />
            </div>

            <div className="ed-poster-right-col">
              <div className="ed-poster-badge-row">
                <SignalBadge label={trackIdx + 1} tone="orange" size="lg" />
                <span className="mono ed-poster-of">TRACK {trackNum} / {totalNum}</span>
              </div>

              <button
                type="button"
                className={classNames('ed-poster-sleeve', isPlaying && 'playing')}
                onClick={onToggle}
                aria-label={isPlaying ? 'Pause playback' : 'Play track'}
              >
                <div
                  id="platter-core"
                  className={classNames('ed-poster-disc spool', isPlaying && 'spinning')}
                  style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                >
                  <div
                    className="ed-poster-disc-label"
                    style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
                  />
                </div>
                <div
                  className="ed-poster-art"
                  style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
                >
                  {!current.art && <Disc3 size={42} strokeWidth={1.3} />}
                </div>
              </button>
            </div>
          </div>

          <div className="ed-poster-bottom">
            <h1 className="ed-poster-title">{current.title}</h1>
            <div className="ed-poster-sub">
              <span>{current.artist}</span>
              <span className="mono">{current.album}{current.year ? ` (${current.year})` : ''}</span>
            </div>

            <div className="ed-poster-scrubber">
              <div className="ed-poster-times mono">
                <span id="tc-cur">{formatHundredths(currentTime)}</span>
                <span id="tpoint" className="sr-only">T-POINT {(progress * 100).toFixed(1)}%</span>
                <span id="tc-rem">{effectiveDuration ? `-${formatHundredths(Math.max(0, effectiveDuration - currentTime))}` : '-00:00.00'}</span>
              </div>
              <SeekSurface id="ruler" className="ed-poster-track" value={progress} onSeek={onSeek} label="Seek playback">
                <div className="ed-poster-fill" id="ruler-fill" style={{ width: `${progress * 100}%` }}>
                  <span className="ed-poster-knob" />
                </div>
              </SeekSurface>
            </div>

            <div className="ed-poster-transport">
              <button type="button" className="ed-poster-btn" aria-label="Previous track" onClick={onPrevious}>
                <SkipBack size={18} strokeWidth={2.1} />
              </button>
              <button type="button" className="ed-poster-btn main" id="t-pp" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
                {isPlaying ? <Pause size={20} strokeWidth={2.2} fill="currentColor" /> : <Play size={20} strokeWidth={2.2} fill="currentColor" />}
              </button>
              <button type="button" className="ed-poster-btn" aria-label="Stop playback" onClick={onStop}>
                <Square size={16} strokeWidth={2.2} fill="currentColor" />
              </button>
              <button type="button" className="ed-poster-btn" aria-label="Next track" onClick={onNext}>
                <SkipForward size={18} strokeWidth={2.1} />
              </button>
            </div>

            <div className="ed-poster-util">
              {sharedUtilityControls('green')}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Default: Mix Deck (Sand Vinyl Sculptural Left + Split Ink/Paper Right)
  return (
    <div className="ed-deck-wrap">
      {modeSwitcher}
      <div className="ed-deck-grid ed-deck-mix">
        <div className="ed-mix-sand">
          <div className="ed-mix-sand-head mono">
            <span>TURNTABLE MIX</span>
            <span>{trackNum} / {totalNum}</span>
          </div>

          <button
            type="button"
            className="ed-dual-vinyl-stage"
            onClick={onToggle}
            aria-label={isPlaying ? 'Pause playback' : 'Play track'}
          >
            <div className={classNames('ed-vinyl-secondary', isPlaying && 'spinning')} aria-hidden="true">
              <div className="ed-vinyl-grooves" />
              <div className="ed-vinyl-hub" />
            </div>

            <div
              id="platter-core"
              className={classNames('ed-vinyl-primary spool', isPlaying && 'spinning')}
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
              aria-hidden="true"
            >
              <div className="ed-vinyl-grooves" />
              <div className="ed-vinyl-sheen" />
              <div
                className="ed-vinyl-cover-label"
                style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
              />
              <div className="ed-vinyl-spindle" />
            </div>
          </button>

          <div className="ed-mix-sand-foot">
            <div className="ed-mix-big-idx">{trackNum}</div>
            <div className="ed-mix-status mono">
              <span className={classNames('ed-live-dot', isPlaying && 'on')} />
              <span>{isPlaying ? 'SPINNING · 33⅓ RPM' : 'DECK STANDBY'}</span>
            </div>
          </div>
        </div>

        <div className="ed-mix-split-col">
          <div className="ed-mix-ink-top">
            <div className="ed-mix-art-row">
              <div
                className="ed-mix-cover"
                style={current.art ? { backgroundImage: `url('${current.art}')` } : undefined}
              >
                {!current.art && <Disc3 size={34} strokeWidth={1.3} />}
              </div>
              <div className="ed-mix-badges">
                <SignalBadge label={current.genre?.slice(0, 1).toUpperCase() || 'M'} tone="yellow" size="sm" />
                <SignalBadge label={current.hires ? 'HI' : 'CD'} tone={current.hires ? 'green' : 'paper'} size="sm" />
                <span className="mono ed-mix-dr">{current.dr}</span>
              </div>
            </div>

            <div className="ed-mix-titles">
              <h1 className="ed-mix-title">{current.title}</h1>
              <p className="ed-mix-sub">
                <span>{current.artist}</span>
                <span className="ed-sep">·</span>
                <span>{current.album}{current.year ? ` (${current.year})` : ''}</span>
              </p>
            </div>
          </div>

          <div className="ed-mix-paper-bottom">
            <div className="ed-mix-wave-wrap">
              <WaveformScrubber
                songId={current.id}
                progress={progress}
                onSeek={onSeek}
                variant="paper"
                id="ruler"
                fillId="ruler-fill"
              />
              <div className="ed-timecodes paper mono">
                <span id="tc-cur">{formatHundredths(currentTime)}</span>
                <span id="tpoint" className="sr-only">T-POINT {(progress * 100).toFixed(1)}%</span>
                <span id="tc-rem">{effectiveDuration ? `-${formatHundredths(Math.max(0, effectiveDuration - currentTime))}` : '-00:00.00'}</span>
              </div>
            </div>

            <div className="ed-transport-row paper">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                className="ed-play-pill ink"
                id="t-pp"
                onClick={onToggle}
              >
                <span id="t-pp-icon">
                  {isPlaying ? <Pause size={16} strokeWidth={2.2} fill="currentColor" /> : <Play size={16} strokeWidth={2.2} fill="currentColor" />}
                </span>
                <span id="t-pp-label">{isPlaying ? 'Pause' : 'Listen'}</span>
              </motion.button>

              <Tooltip content="Previous track" shortcut="⇧←">
                <motion.button type="button" whileTap={{ scale: 0.94 }} className="ed-icon-circle paper" id="t-prev" aria-label="Previous track" onClick={onPrevious}>
                  <SkipBack size={16} strokeWidth={2} />
                </motion.button>
              </Tooltip>

              <Tooltip content="Stop">
                <motion.button type="button" whileTap={{ scale: 0.94 }} className="ed-icon-circle paper" id="t-stop" aria-label="Stop playback" onClick={onStop}>
                  <Square size={14} strokeWidth={2.2} fill="currentColor" />
                </motion.button>
              </Tooltip>

              <Tooltip content="Next track" shortcut="⇧→">
                <motion.button type="button" whileTap={{ scale: 0.94 }} className="ed-icon-circle paper" id="t-next" aria-label="Next track" onClick={onNext}>
                  <SkipForward size={16} strokeWidth={2} />
                </motion.button>
              </Tooltip>
            </div>

            {sharedUtilityControls('paper')}
          </div>
        </div>
      </div>
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
  scanProgress,
  tab,
  genre,
  sort,
  onTab,
  onGenre,
  onSort,
  onPickFolder,
  onPlay,
  onContextMenu,
  onPlayAlbum,
  onPlayArtist,
}) {
  if (scanning && !songs.length) {
    return (
      <>
        <div className="ed-split-head">
          <div className="ed-head-ink">
            <h1 className="page-title">Library</h1>
            <div className="page-sub mono">Indexing local archive...</div>
          </div>
          <div className="ed-head-paper">
            <div className="ed-head-num">--</div>
            <div className="ed-head-cap mono">TRACKS</div>
          </div>
        </div>
        <LibrarySkeleton rows={7} progress={scanProgress} label="Scanning audio tags" />
      </>
    );
  }

  if (!songs.length) {
    return (
      <>
        <div className="ed-split-head">
          <div className="ed-head-ink">
            <h1 className="page-title">Library</h1>
            <div className="page-sub mono">No archive mounted</div>
          </div>
          <div className="ed-head-paper">
            <div className="ed-head-num">00</div>
            <div className="ed-head-cap mono">TRACKS</div>
          </div>
        </div>
        <EmptyState
          variant="folder"
          eyebrow="MASTER ARCHIVE"
          title="Your library is empty"
          description="Mount a local music folder to browse tracks, albums, and artists."
          actions={(
            <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
              <FolderOpen size={14} strokeWidth={1.9} /> Mount Local Folder
            </button>
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
        {filteredAlbums.map((album, index) => (
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
            <div className="album-card-foot">
              <div>
                <div className="album-name">{album.name}</div>
                <div className="album-meta mono">
                  {album.artist} · {album.year}
                  {album.songIds.every((id) => songs.find((song) => song.id === id)?.hires) && (
                    <span className="amber"> · HI-RES</span>
                  )}
                </div>
              </div>
              <SignalBadge label={String(index + 1)} tone={['yellow', 'orange', 'green', 'pink'][index % 4]} size="sm" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  } else {
    body = (
      <motion.div className="artist-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        {artists.map((artist, index) => (
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
            <div className="artist-foot">
              <span className="album-meta mono">{artist.songIds.length} tracks</span>
              <SignalBadge label={artist.name.slice(0, 1).toUpperCase()} tone={['paper', 'yellow', 'green', 'pink'][index % 4]} size="sm" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <>
      <div className="ed-split-head">
        <div className="ed-head-ink">
          <div>
            <div className="ed-eyebrow mono">MASTER ARCHIVE</div>
            <h1 className="page-title">Library</h1>
            <div className="page-sub mono">
              {folderName ? `${folderName} · ` : ''}{albums.length} albums · {formatMinutes(songs.reduce((total, song) => total + song.duration, 0) * 1000)}
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

        <div className="ed-head-paper">
          <div className="ed-head-num">{String(songs.length).padStart(2, '0')}</div>
          <div className="ed-head-cap mono">INDEXED TRACKS</div>
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

export function StashView({ songs, playlists, loved, currentSong, onNewPlaylist, onOpenPlaylist, onShuffleLoved, onPlay, onContextMenu }) {
  const lovedSongs = songs.filter((song) => loved.has(song.id));
  return (
    <>
      <div className="page-head">
        <div>
          <div className="ed-eyebrow mono">CURATED REELS</div>
          <h1 className="page-title">Tape Stash</h1>
          <div className="page-sub mono">{playlists.length} reels · {lovedSongs.length} loved tracks</div>
        </div>
        <button type="button" className="hw-btn primary" onClick={onNewPlaylist}>
          <Plus size={14} strokeWidth={2} /> New Reel
        </button>
      </div>

      {playlists.length > 0 ? (
        <motion.div className="pl-grid" variants={STAGGER_CONTAINER} initial="hidden" animate="show">
          {playlists.map((playlist, index) => {
            const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
            const cover = playlistSongs[0]?.art || '';
            const surface = STASH_SURFACES[index % STASH_SURFACES.length];
            const badgeTone = ['orange', 'ink', 'green', 'yellow'][index % 4];
            return (
              <motion.div
                variants={STAGGER_ITEM}
                whileHover={{ y: -4 }}
                transition={SPRING_SMOOTH}
                className={classNames('pl-card ed-pl-poster', surface)}
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
                <div className="ed-pl-top">
                  <span className="mono ed-pl-idx">REEL {String(index + 1).padStart(2, '0')}</span>
                  <SignalBadge label={playlistSongs.length} tone={badgeTone} size="sm" />
                </div>

                <div className="ed-pl-art-box">
                  <div className="pl-cover" style={cover ? { backgroundImage: `url('${cover}')` } : undefined}>
                    {!cover && <Disc3 size={28} strokeWidth={1.3} />}
                  </div>
                </div>

                <div className="ed-pl-foot">
                  <div className="album-name">{playlist.name}</div>
                  <div className="album-meta mono">{playlistSongs.length} {playlistSongs.length === 1 ? 'track' : 'tracks'}</div>
                </div>
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
      <div className="ed-split-head">
        <div className="ed-head-ink">
          <div>
            <div className="ed-eyebrow mono">TAPE REEL</div>
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
        <div className="ed-head-paper">
          <div className="ed-head-num">{String(playlistSongs.length).padStart(2, '0')}</div>
          <div className="ed-head-cap mono">TRACKS</div>
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

function StatBox({ value, caption, tone = 'ink' }) {
  return (
    <motion.div className={classNames('stat-box hw-card', `tone-${tone}`)} variants={STAGGER_ITEM}>
      <div className="num">{value}</div>
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
          <StatBox value={formatMinutes(Stats.totalMs(history))} caption="Time listened" tone="paper" />
          <StatBox value={Stats.totalPlays(history)} caption="Songs played" tone="ink" />
          <StatBox value={formatMinutes(Stats.avgDayMs(history))} caption="Daily average" tone="sand" />
          <StatBox value={streak} caption="Current streak · days" tone="green" />
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
    body = dayGroups.length ? (
      <div className="ed-history-list">
        {dayGroups.map((day) => {
          const d = new Date(day.ts);
          const dayNum = String(d.getDate()).padStart(2, '0');
          const monthLabel = d.toLocaleDateString('en-US', { month: 'short', weekday: 'short' }).toUpperCase();
          return (
            <div className="history-day ed-history-block" key={dayKey(day.ts)}>
              <div className="ed-history-date-col">
                <div className="ed-history-month mono">{monthLabel}</div>
                <div className="ed-history-daynum">{dayNum}</div>
                <div className="ed-history-sum mono">
                  {day.plays.length} plays · {formatMinutes(day.plays.reduce((sum, play) => sum + (play.ms || 0), 0))}
                </div>
              </div>
              <div className="ed-history-rows">
                {day.plays.slice(0, 6).map((play, idx) => {
                  const song = songs.find((item) => item.id === play.songId);
                  if (!song) return null;
                  return (
                    <div className="hist-row" key={play.id || `${play.songId}-${play.ts}`}>
                      <SignalBadge label={String(idx + 1)} tone={['pink', 'paper', 'yellow', 'orange', 'green'][idx % 5]} size="sm" />
                      <div className="hist-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
                      <div className="hist-t"><div className="t1">{song.title}</div><div className="t2 mono">{song.artist}</div></div>
                      <span className="hist-time mono">{new Date(play.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      <span className="hist-ms mono">{formatMinutes(play.ms || 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
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
          <StatBox value={streak} caption="Current streak · days" tone="green" />
          <StatBox value={bestStreak} caption="Best streak · days" tone="paper" />
          <StatBox value={formatMinutes(Stats.todayMs(history))} caption={`Today vs ${goalMin}m goal`} tone="sand" />
          <StatBox value={Math.round(Stats.avgDayMs(history) / 60000)} caption="Avg day · min" tone="ink" />
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
          <div className="ed-eyebrow mono">LISTENING TELEMETRY</div>
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
  folderPath = '',
  songCount,
  canRescan,
  isElectron = false,
  scanning,
  onToggleSwitch,
  onPickFolder,
  onUseDefaultFolder,
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
          <div className="ed-eyebrow mono">ENGINE &amp; ARCHIVE</div>
          <h1 className="page-title">System</h1>
          <div className="page-sub mono">Audio DSP &amp; local archive configuration</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel hw-card ed-paper-panel">
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
              {scanning ? 'Scanning...' : folderName ? 'Change Folder' : 'Mount Local Folder'}
            </button>
            {isElectron && (
              <button type="button" className="hw-btn" disabled={scanning} onClick={onUseDefaultFolder}>
                <FolderOpen size={13} strokeWidth={1.9} /> Default Music Folder
              </button>
            )}
            {canRescan && (
              <button type="button" className="hw-btn" disabled={scanning} onClick={onRescan}>
                <RefreshCw size={13} strokeWidth={1.9} /> Rescan Folder
              </button>
            )}
            {folderName && (
              <button type="button" className="hw-btn danger" disabled={scanning} onClick={onDisconnect}>
                Disconnect
              </button>
            )}
            <button type="button" className="hw-btn danger" onClick={onClearHistory}>
              <Trash2 size={13} strokeWidth={1.9} /> Erase History
            </button>
          </div>
          <p className="settings-note mono">
            {folderName
              ? `Mounted folder: "${folderPath || folderName}" · ${songCount} tracks indexed locally.`
              : 'No local folder mounted. Pick a folder to index your music.'}
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
          <div className="ed-eyebrow mono">KEYMAP</div>
          <h1 className="page-title">Shortcuts</h1>
          <div className="page-sub mono">Keyboard controls &amp; transport bindings</div>
        </div>
      </div>
      <div className="panel hw-card ed-paper-panel" style={{ maxWidth: 640 }}>
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
