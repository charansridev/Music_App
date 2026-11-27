import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Disc3,
  FolderOpen,
  Heart,
  HelpCircle,
  ListMusic,
  Menu,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SeekSurface } from './SeekSurface.jsx';
import { Tooltip } from './Tooltip.jsx';
import { OVERLAY_BACKDROP, SPRING_SNAPPY, SPRING_SMOOTH } from '../lib/motion.js';
import { classNames, formatDecibels, formatTime } from '../lib/utils.js';

export function ChassisHeader({
  activeView = 'deck',
  mobileNavOpen = false,
  onToggleMobileNav,
  songCount = 0,
  playlistCount = 0,
  lovedCount = 0,
  folderName = '',
  scanning = false,
  queueCount = 0,
  queueOpen = false,
  onToggleQueue,
  onPickFolder,
  onOpenSearch,
  outputName,
  devices = [],
  selectedId = '',
  supported = true,
  needsUnlock = false,
  canSelectOutput = false,
  onSelectOutput,
  onRefreshOutputs,
  onPromptPicker,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleMenu = () => {
    const next = !open;
    setOpen(next);
    if (next) onRefreshOutputs?.();
  };

  const navItems = [
    { num: '01', view: 'deck', label: 'Deck' },
    { num: '02', view: 'library', label: 'Library', count: songCount || null },
    { num: '03', view: 'stash', label: 'Stash', count: playlistCount + lovedCount || null },
    { num: '04', view: 'stats', label: 'Stats' },
    { num: '05', view: 'settings', label: 'System' },
  ];

  return (
    <header id="chassis">
      <div className="ch-left">
        <button
          type="button"
          className="ch-menu-btn"
          aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileNavOpen}
          onClick={onToggleMobileNav}
        >
          {mobileNavOpen ? <X size={16} strokeWidth={1.8} /> : <Menu size={16} strokeWidth={1.8} />}
        </button>

        <a href="#/deck" className="brand" aria-label="MUZIK Home">
          <img src="./icon.png" alt="" className="brand-icon" />
          <span className="brand-name">MUZIK</span>
        </a>
      </div>

      <nav className="top-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <a
              key={item.view}
              href={`#/${item.view}`}
              className={classNames('top-nav-link', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="top-nav-pill"
                  className="top-nav-pill"
                  transition={SPRING_SNAPPY}
                />
              )}
              <span className="top-nav-num mono">{item.num}</span>
              <span className="top-nav-label">{item.label}</span>
              {item.count ? <span className="top-nav-count mono">{item.count}</span> : null}
            </a>
          );
        })}
      </nav>

      <div className="ch-right">
        <Tooltip content="Search archive" shortcut="⌘K" side="bottom">
          <button
            type="button"
            className="ch-pill-btn ch-search-btn"
            id="sb-search"
            onClick={onOpenSearch}
          >
            <Search size={13} strokeWidth={1.9} />
            <span className="ch-pill-label">Search</span>
            <kbd className="ch-kbd">⌘K</kbd>
          </button>
        </Tooltip>

        <Tooltip content={folderName ? `Source: ${folderName}` : 'Mount local folder'} side="bottom">
          <button
            type="button"
            className={classNames('ch-pill-btn', folderName && 'mounted')}
            id="sb-folder"
            disabled={scanning}
            onClick={onPickFolder}
          >
            <FolderOpen size={13} strokeWidth={1.85} />
            <span className="ch-folder-label">{scanning ? 'Scanning...' : folderName || 'Mount'}</span>
          </button>
        </Tooltip>

        <div className="out-wrap" ref={wrapRef}>
          <Tooltip content="Audio output device" side="bottom">
            <button
              type="button"
              className={classNames('out-box', open && 'open')}
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={toggleMenu}
            >
              <Volume2 size={13} strokeWidth={1.85} className="out-ico" />
              <span className="out-label">{outputName}</span>
              <ChevronDown
                size={12}
                strokeWidth={2}
                className={classNames('out-caret', open && 'rotated')}
                aria-hidden="true"
              />
            </button>
          </Tooltip>

          <AnimatePresence>
            {open && (
              <motion.div
                className="out-menu hw-card"
                role="listbox"
                aria-label="Audio output devices"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="out-menu-head mono">
                  <span>OUTPUT DEVICE</span>
                  <button
                    type="button"
                    title="Refresh output devices"
                    aria-label="Refresh output devices"
                    onClick={() => onRefreshOutputs?.()}
                  >
                    <RefreshCw size={12} strokeWidth={1.8} />
                  </button>
                </div>
                <div className="out-list">
                  {devices.map((device) => {
                    const isActive = (device.deviceId || '') === (selectedId || '');
                    return (
                      <button
                        type="button"
                        key={device.deviceId || 'default'}
                        role="option"
                        aria-selected={isActive}
                        className={classNames('out-item', isActive && 'active')}
                        onClick={() => {
                          onSelectOutput?.(device.deviceId, device.label);
                          setOpen(false);
                        }}
                      >
                        <span className="out-item-name">{device.label}</span>
                        {isActive && (
                          <span className="out-item-tag mono">
                            <Check size={11} strokeWidth={2.2} />
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {supported && (canSelectOutput || needsUnlock) && (
                  <button
                    type="button"
                    className="out-detect mono"
                    onClick={async () => {
                      setOpen(false);
                      await onPromptPicker?.();
                    }}
                  >
                    + {canSelectOutput ? 'Pick system output device' : 'Detect output devices'}
                  </button>
                )}
                {!supported && (
                  <div className="out-note mono">Browser uses system default output</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Tooltip content="Queue" shortcut="Q" side="bottom">
          <button
            type="button"
            className={classNames('ch-icon-btn ch-queue-btn', queueOpen && 'active')}
            aria-label="Toggle queue"
            aria-pressed={queueOpen}
            onClick={onToggleQueue}
          >
            <ListMusic size={15} strokeWidth={1.8} />
            {queueCount > 0 && <span className="pf-q-badge mono">{queueCount}</span>}
          </button>
        </Tooltip>

        <Tooltip content="Shortcuts" side="bottom">
          <a
            href="#/help"
            className={classNames('ch-icon-btn', activeView === 'help' && 'active')}
            aria-label="Help & keyboard shortcuts"
          >
            <HelpCircle size={15} strokeWidth={1.8} />
          </a>
        </Tooltip>
      </div>
    </header>
  );
}

export function Sidebar({
  activeView,
  songCount,
  playlistCount,
  lovedCount,
  deckStatus,
  folderName,
  scanning,
  mobileOpen = false,
  onCloseMobile,
  onPickFolder,
  onOpenSearch,
}) {
  const navigation = [
    { num: '01', view: 'deck', label: 'Active Deck', count: deckStatus },
    { num: '02', view: 'library', label: 'Master Library', count: songCount },
    { num: '03', view: 'stash', label: 'Tape Stash', count: playlistCount + lovedCount },
    { num: '04', view: 'stats', label: 'Telemetry', count: '60D' },
    { num: '05', view: 'settings', label: 'System', count: 'DSP' },
  ];

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            className="sidebar-scrim"
            variants={OVERLAY_BACKDROP}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onCloseMobile}
          />
          <motion.aside
            id="sidebar-mobile"
            className="sidebar-mobile"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={SPRING_SMOOTH}
            aria-label="Mobile navigation"
          >
            <div className="sb-top">
              <div className="sb-mobile-head">
                <span className="brand">
                  <img src="./icon.png" alt="" className="brand-icon" />
                  <span className="brand-name">MUZIK</span>
                </span>
                <button type="button" className="ch-icon-btn" aria-label="Close menu" onClick={onCloseMobile}>
                  <X size={15} strokeWidth={1.8} />
                </button>
              </div>

              <button
                type="button"
                className="sb-action-row"
                onClick={() => {
                  onCloseMobile?.();
                  onOpenSearch();
                }}
              >
                <Search size={14} strokeWidth={1.8} />
                <span>Search Archive</span>
                <kbd className="ch-kbd">⌘K</kbd>
              </button>

              <button
                type="button"
                className="sb-action-row"
                disabled={scanning}
                onClick={() => {
                  onCloseMobile?.();
                  onPickFolder();
                }}
              >
                <FolderOpen size={14} strokeWidth={1.8} />
                <span>{scanning ? 'Scanning...' : folderName || 'Mount Local Folder'}</span>
              </button>

              <nav className="sb-mobile-nav" aria-label="Mobile links">
                {navigation.map((item) => (
                  <a
                    key={item.view}
                    href={`#/${item.view}`}
                    className={classNames(activeView === item.view && 'active')}
                    aria-current={activeView === item.view ? 'page' : undefined}
                    onClick={() => onCloseMobile?.()}
                  >
                    <span className="sb-nav-left">
                      <span className="mono sb-nav-num">{item.num}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="mono">{item.count}</span>
                  </a>
                ))}
                <a
                  href="#/help"
                  className={classNames(activeView === 'help' && 'active')}
                  onClick={() => onCloseMobile?.()}
                >
                  <span className="sb-nav-left">
                    <span className="mono sb-nav-num">06</span>
                    <span>Shortcuts</span>
                  </span>
                  <span className="mono">?</span>
                </a>
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function PlayerBar({
  current,
  hasSongs,
  isPlaying,
  shuffle,
  repeat,
  loved,
  muted,
  mono,
  volume,
  currentTime,
  duration,
  queueCount = 0,
  onToggle,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onLove,
  onVolume,
  onMute,
  onMono,
  onQueue,
  onSeek,
}) {
  const repeatLabel = repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one';
  const progress = duration ? currentTime / duration : 0;

  return (
    <div className="dock-shell">
      <footer id="chassis-footer" className="floating-dock paper-dock">
        <a href="#/deck" className="pf-left" title="Open active deck">
          <div
            className={classNames('pf-art', isPlaying && 'spinning')}
            id="pb-art"
            style={current ? { backgroundImage: `url('${current.art}')` } : undefined}
          >
            {!current && <Disc3 size={18} strokeWidth={1.6} className="pf-art-fallback" />}
          </div>
          <div className="pf-info">
            <div className="pf-title-row">
              <span className="pf-title" id="pb-title">{current?.title || 'No track loaded'}</span>
            </div>
            <div className="pf-artist" id="pb-artist">
              {current
                ? current.artist
                : hasSongs
                  ? 'Select a track'
                  : 'Mount a local folder'}
            </div>
            <span className="sr-only" id="pb-engine">{isPlaying ? 'PLAYING' : 'STANDBY'}</span>
          </div>
        </a>

        <div className="pf-center">
          <div className="pf-transport">
            <Tooltip content={shuffle ? 'Shuffle on' : 'Shuffle off'}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className={classNames('pf-toggle', shuffle && 'active')}
                id="pb-shuffle"
                aria-label="Toggle shuffle"
                aria-pressed={shuffle}
                onClick={onToggleShuffle}
              >
                <Shuffle size={13} strokeWidth={1.9} />
              </motion.button>
            </Tooltip>

            <Tooltip content="Previous" shortcut="⇧←">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className="pf-sm"
                id="pb-prev"
                aria-label="Previous track"
                onClick={onPrevious}
              >
                <SkipBack size={15} strokeWidth={2} />
              </motion.button>
            </Tooltip>

            <Tooltip content={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                className={classNames('pf-play', isPlaying && 'playing')}
                id="pb-play"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={onToggle}
              >
                {isPlaying
                  ? <Pause size={15} strokeWidth={2.2} fill="currentColor" />
                  : <Play size={15} strokeWidth={2.2} fill="currentColor" style={{ marginLeft: 1 }} />}
              </motion.button>
            </Tooltip>

            <Tooltip content="Next" shortcut="⇧→">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className="pf-sm"
                id="pb-next"
                aria-label="Next track"
                onClick={onNext}
              >
                <SkipForward size={15} strokeWidth={2} />
              </motion.button>
            </Tooltip>

            <Tooltip content={repeatLabel}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className={classNames('pf-toggle', repeat !== 'off' && 'active')}
                id="pb-repeat"
                aria-label={`Repeat mode: ${repeat}`}
                onClick={onCycleRepeat}
              >
                {repeat === 'one' ? <Repeat1 size={13} strokeWidth={1.9} /> : <Repeat size={13} strokeWidth={1.9} />}
              </motion.button>
            </Tooltip>
          </div>

          <div className="pf-progress">
            <span className="mono pb-time" id="pb-cur">{formatTime(currentTime)}</span>
            <SeekSurface id="led-strip" className="led-strip" value={progress} onSeek={onSeek} label="Seek playback">
              {Array.from({ length: 24 }, (_, index) => <div className="led" key={index} />)}
            </SeekSurface>
            <span className="mono pb-time end" id="pb-dur">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="pf-right">
          <div className="chan-toggle" id="chan-toggle" role="group" aria-label="Output channel mode">
            <button type="button" id="btn-stereo" className={classNames(!mono && 'active')} aria-pressed={!mono} onClick={() => onMono(false)}>
              {!mono && <motion.span layoutId="chan-mode" className="chan-pill" transition={SPRING_SNAPPY} />}
              <span className="chan-label">ST</span>
            </button>
            <button type="button" id="btn-mono" className={classNames(mono && 'active')} aria-pressed={mono} onClick={() => onMono(true)}>
              {mono && <motion.span layoutId="chan-mode" className="chan-pill" transition={SPRING_SNAPPY} />}
              <span className="chan-label">MO</span>
            </button>
          </div>

          <div className="pf-att">
            <input
              type="range"
              id="pb-vol"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              aria-label="Volume"
              onChange={(event) => onVolume(Number(event.target.value) / 100)}
            />
            <span className="mono pf-db" id="pb-att">{formatDecibels(volume)}</span>
          </div>

          <Tooltip content={loved ? 'Remove from loved' : 'Love track'}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              animate={loved ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={SPRING_SNAPPY}
              className={classNames('pf-mini', loved && 'loved')}
              id="pb-love"
              aria-label={loved ? 'Remove from loved' : 'Love track'}
              aria-pressed={loved}
              disabled={!current}
              onClick={onLove}
            >
              <Heart size={14} strokeWidth={1.9} fill={loved ? 'currentColor' : 'none'} />
            </motion.button>
          </Tooltip>

          <Tooltip content={muted || volume === 0 ? 'Unmute' : 'Mute'}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className={classNames('pf-mini', (muted || volume === 0) && 'muted')}
              id="pb-mute"
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={muted || volume === 0}
              onClick={onMute}
            >
              {muted || volume === 0 ? <VolumeX size={14} strokeWidth={1.9} /> : <Volume2 size={14} strokeWidth={1.9} />}
            </motion.button>
          </Tooltip>

          <Tooltip content="Queue" shortcut="Q">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className="pf-mini pf-queue-btn"
              id="btn-queue"
              aria-label="Open queue"
              onClick={onQueue}
            >
              <ListMusic size={14} strokeWidth={1.9} />
              {queueCount > 0 && <span className="pf-q-badge mono">{queueCount}</span>}
            </motion.button>
          </Tooltip>
        </div>
      </footer>
    </div>
  );
}
