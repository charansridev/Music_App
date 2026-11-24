import { HardwareSwitch } from './HardwareSwitch.jsx';
import { SeekSurface } from './SeekSurface.jsx';
import { classNames, formatDecibels, formatTime } from '../lib/utils.js';

export function ChassisHeader({ outputName }) {
  return (
    <header id="chassis">
      <div className="ch-right" style={{ width: '100%', justifyContent: 'flex-end' }}>
        <div className="out-box">
          <span className="dim">OUT:</span>
          <span>{outputName}</span>
          <span className="out-tally" />
        </div>
      </div>
    </header>
  );
}

export function Sidebar({
  activeView,
  songCount,
  playlistCount,
  lovedCount,
  hiresCount,
  deckStatus,
  switches,
  onToggleSwitch,
  onOpenSearch,
}) {
  const navigation = [
    { view: 'deck', label: 'Active Deck', dot: 'red', count: deckStatus, countClass: 'font-dot' },
    { view: 'library', label: 'Master Library', count: songCount, countClass: 'mono' },
    { view: 'stash', label: 'Tape Stash', count: playlistCount + lovedCount, countClass: 'mono' },
    { view: 'hires', label: 'Hi-Res FLAC & DSD', dot: 'amber', count: hiresCount, countClass: 'mono amber' },
    { view: 'stats', label: 'Telemetry', count: '60D', countClass: 'mono' },
    { view: 'settings', label: 'System', count: 'OS-1', countClass: 'mono' },
  ];

  return (
    <aside id="sidebar">
      <div className="sb-top">
        <button type="button" className="sb-search" id="sb-search" onClick={onOpenSearch}>
          <span className="sb-search-hint">SEARCH ARCHIVE (CMD+K)</span>
          <span className="sb-search-ico">⌕</span>
        </button>

        <div className="sb-sector">
          <div className="sb-sector-head">
            <span>SOURCE SECTOR</span>
            <span className="font-dot">01</span>
          </div>
          <nav id="nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <a
                key={item.view}
                href={`#/${item.view}`}
                className={classNames(activeView === item.view && 'active')}
                aria-current={activeView === item.view ? 'page' : undefined}
              >
                <span className="nav-name"><i className={classNames('nv-dot', item.dot)} />{item.label}</span>
                <span className={classNames('nav-count', item.countClass)}>{item.count}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="sb-module">
          <div className="sb-sector-head">
            <span>GLYPH SOUNDWIRE</span>
            <span className="font-dot green sw-active" id="sw-glyph-status">
              {switches.glyphSync ? <i className="ping-dot" /> : <i style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#444' }} />}
              {switches.glyphSync ? 'ACTIVE' : 'BYPASSED'}
            </span>
          </div>
          <div className="sb-panel">
            <div className="sb-panel-row">
              <div className="sb-panel-name">
                <span className="glyph-mini"><i className="gm-ring" /><i className="gm-core" /></span>
                REEL LIGHT SYNC
              </div>
              <HardwareSwitch
                id="sw-glyph"
                checked={switches.glyphSync}
                onChange={(value) => onToggleSwitch('glyphSync', value)}
                label="Reel light sync"
              />
            </div>
            <div className="sb-panel-foot">
              <span>STROBE RATE</span>
              <span className="font-dot cyan">DYNAMIC 1:1</span>
            </div>
          </div>
        </div>

        <div className="sb-module">
          <div className="sb-sector-head"><span>PHYSICAL CHANNELS</span></div>
          <div className="sb-channels">
            <div className="sb-channel">
              <span>CROSSFEED DSP</span>
              <HardwareSwitch
                id="sw-crossfeed"
                checked={switches.crossfeed}
                onChange={(value) => onToggleSwitch('crossfeed', value)}
                label="Crossfeed DSP"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function PlayerBar({
  current,
  isPlaying,
  shuffle,
  repeat,
  loved,
  muted,
  mono,
  volume,
  currentTime,
  duration,
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
  const repeatLabel = repeat === 'off' ? 'REPEAT OFF' : repeat === 'all' ? 'REPEAT ALL' : 'REPEAT 1';
  const progress = duration ? currentTime / duration : 0;

  return (
    <footer id="chassis-footer">
      <div className="pf-left">
        <div
          className={classNames('pf-art', isPlaying && 'spinning')}
          id="pb-art"
          style={current ? { backgroundImage: `url('${current.art}')` } : undefined}
        >
          <div className="pf-ring" />
          <div className="pf-hub" />
        </div>
        <div className="pf-info">
          <div className="pf-title-row">
            <span className="red-tally" />
            <span className="pf-title" id="pb-title">{current?.title || 'Nothing playing'}</span>
          </div>
          <div className="pf-artist" id="pb-artist">{current ? `${current.artist} · ${current.album}` : 'PICK A TRACK FROM THE LOG'}</div>
          <div className="pf-format font-dot">
            <span className="amber" id="pb-spec">{current?.short || '—'}</span>
            <span className="dim">·</span>
            <span className="green" id="pb-engine">{isPlaying ? 'ASIO DIRECT' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      <div className="pf-center">
        <div className="pf-transport">
          <button
            type="button"
            className={classNames('pf-toggle', shuffle && 'active')}
            id="pb-shuffle"
            aria-pressed={shuffle}
            onClick={onToggleShuffle}
          >
            SHUFFLE
          </button>
          <button type="button" className="milled-button pf-sm" id="pb-prev" title="Previous" aria-label="Previous track" onClick={onPrevious}>⏮</button>
          <button type="button" className="pf-play hw-press" id="pb-play" title="Play / Pause" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button type="button" className="milled-button pf-sm" id="pb-next" title="Next" aria-label="Next track" onClick={onNext}>⏭</button>
          <button
            type="button"
            className={classNames('pf-toggle', repeat !== 'off' && 'active')}
            id="pb-repeat"
            aria-label={`Repeat mode: ${repeat}`}
            onClick={onCycleRepeat}
          >
            {repeatLabel}
          </button>
        </div>
        <div className="pf-progress">
          <span className="font-dot" id="pb-cur">{formatTime(currentTime)}</span>
          <SeekSurface id="led-strip" className="led-strip" value={progress} onSeek={onSeek} label="Seek playback">
            {Array.from({ length: 20 }, (_, index) => <div className="led" key={index} />)}
          </SeekSurface>
          <span className="font-dot" id="pb-dur">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="pf-right">
        <div className="chan-toggle" id="chan-toggle" aria-label="Output channel mode">
          <button type="button" id="btn-stereo" className={classNames(!mono && 'active')} aria-pressed={!mono} onClick={() => onMono(false)}><i />STEREO</button>
          <button type="button" id="btn-mono" className={classNames(mono && 'active')} aria-pressed={mono} onClick={() => onMono(true)}>MONO</button>
        </div>
        <div className="pf-att">
          <span className="dim">ATT:</span>
          <input
            type="range"
            id="pb-vol"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            aria-label="Volume"
            onChange={(event) => onVolume(Number(event.target.value) / 100)}
          />
          <span className="font-dot" id="pb-att">{formatDecibels(volume)}</span>
        </div>
        <button
          type="button"
          className={classNames('pf-mini hw-press', loved && 'loved')}
          id="pb-love"
          title="Love"
          aria-label={loved ? 'Remove from loved' : 'Love track'}
          aria-pressed={loved}
          disabled={!current}
          onClick={onLove}
        >
          {loved ? '♥' : '♡'}
        </button>
        <button type="button" className={classNames('pf-mini hw-press', (muted || volume === 0) && 'muted')} id="pb-mute" title="Mute" aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted || volume === 0} onClick={onMute}>
          <i className="mute-dot" />
        </button>
        <button type="button" className="pf-mini hw-press" id="btn-queue" title="Queue" aria-label="Open queue" onClick={onQueue}>≡</button>
      </div>
    </footer>
  );
}
