import { HardwareSwitch } from '../components/HardwareSwitch.jsx';
import { SeekSurface } from '../components/SeekSurface.jsx';
import { TrackTable } from '../components/TrackTable.jsx';
import { Stats } from '../lib/stats.js';
import { classNames, dayKey, formatDay, formatHundredths, formatMinutes, formatTime } from '../lib/utils.js';

export function DeckView({
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  queueCount,
  logFilter,
  mono,
  onFilter,
  onPlay,
  onContextMenu,
  onToggle,
  onStop,
  onNext,
  onPrevious,
  onToggleQueue,
  onOpenImmersion,
  onSeek,
}) {
  const current = currentSong || songs[0];
  if (!current) return <div className="empty">NO TRANSMISSIONS</div>;

  const filteredSongs = songs.filter((song) => (
    logFilter === 'all'
    || (logFilter === 'flac' && song.spec.includes('kHz'))
    || (logFilter === 'dsd' && song.spec.includes('DSD'))
  ));
  const progress = duration ? currentTime / duration : 0;

  return (
    <>
      <div className="deck-grid">
        <section className="deck-card hw-card">
          <div className="deck-head">
            <div>
              <div className="deck-eyebrow">
                <span className="red-tally" />
                STUDIO REEL MASTER DECK // CH-A
                <span className="hi-res-tag">HI-RES AUDIO</span>
              </div>
              <h1 className="deck-title">{current.artist}</h1>
              <p className="deck-trackline">
                TRACK: <b>{current.title.toUpperCase()}</b> · ALBUM: <b>{current.album}</b> (<span className="lossless">{current.hires ? `LOSSLESS ${current.hz}` : current.spec}</span>)
              </p>
            </div>
            <div className="deck-specs">
              <div className="deck-spec"><span className="k">SAMPLING FREQ</span><span className="v amber" id="spec-hz">{current.hz}</span></div>
              <div className="deck-spec"><span className="k">QUANTIZATION</span><span className="v cyan" id="spec-quant">{current.quant}</span></div>
              <div className="deck-spec"><span className="k">DYNAMIC RANGE</span><span className="v red" id="spec-dr">{current.dr} (HI-RES)</span></div>
            </div>
          </div>

          <div className="deck-center">
            <div className="platter" id="platter">
              <div className="glyph-ring">
                {['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'].map((position) => <span className={classNames('gl-seg', position)} key={position} />)}
              </div>
              <div className="strobe-ring" />
              <div className="platter-core spool" id="platter-core" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                <i className="spoke h1" /><i className="spoke v1" /><i className="spoke d1" /><i className="spoke d2" />
                <div className="platter-hub"><i /></div>
              </div>
              <div className="tacho"><span className="td" /><b>GLYPH TACHO</b><span className="font-dot">33⅓</span></div>
            </div>

            <div className="deck-right">
              <div className="counter-box">
                <div>
                  <div className="k">TIME INDEX / COUNTER <span className="bit-exact">BIT-EXACT</span></div>
                  <span className="counter-cur" id="tc-cur">{formatHundredths(currentTime)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="counter-rem-k">REMAINING / RUNTIME</span>
                  <span className="counter-rem" id="tc-rem">{duration ? `-${formatHundredths(Math.max(0, duration - currentTime))}` : '-00:00.00'}</span>
                </div>
              </div>

              <div className="ruler-wrap">
                <SeekSurface id="ruler" className="ruler" value={progress} onSeek={onSeek} label="Seek master deck">
                  <div className="ticks ruler-tape" />
                  <div className="ticks-major ruler-tape-major" />
                  <div className="ruler-fill" id="ruler-fill" style={{ width: `${progress * 100}%` }}>
                    <span className="tpoint" id="tpoint">T-POINT {(progress * 100).toFixed(1)}%</span>
                  </div>
                </SeekSurface>
                <div className="ruler-scale">
                  <span>00:00.00</span>
                  <span className="mid">SEC {formatTime(current.duration / 2)}.00</span>
                  <span className="end">TOTAL {formatTime(current.duration)}.00</span>
                </div>
              </div>

              <div className="transport-row">
                <button type="button" className="milled-button hw-press" id="t-prev" onClick={onPrevious}>⏮ PREV</button>
                <button type="button" className="milled-button hw-press t-stop" id="t-stop" onClick={onStop}><span className="redbit" />STOP</button>
                <button type="button" className="milled-button hw-press t-playpause" id="t-pp" onClick={onToggle}>
                  <span className="pp" id="t-pp-icon">{isPlaying ? '❚❚' : '▶'}</span><span id="t-pp-label">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>
                <button type="button" className="milled-button hw-press" id="t-next" onClick={onNext}>NEXT ⏭</button>
              </div>
            </div>
          </div>

          <div className="deck-telemetry">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>BURST RATE: <b>2.82 Mbps</b></span>
              <span className="ch">CH: <b>STEREO {mono ? '1.0 MONO' : '2.0'}</b></span>
              <span className="nf">NOISE FLOOR: <b>-118 dB</b></span>
            </div>
            <div className="lock-line">
              <span className="lock-dot" />
              DIRECT MEMORY STREAMING
              <span className="font-dot">[LOCKED]</span>
              <button type="button" className="hw-tab" style={{ marginLeft: 8 }} onClick={onOpenImmersion}>GLYPH FULLSCREEN ⛶</button>
            </div>
          </div>
        </section>
      </div>

      <div className="bottom-grid">
        <section className="spectrum-card hw-card">
          <div className="spec-head">
            <div className="t"><span className="pd cyan" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)' }} />16-BAND RTA ANALYZER</div>
            <span className="weight-tag">WEIGHT: A-CURVE</span>
          </div>
          <div className="spectrum" id="spectrum">
            {Array.from({ length: 16 }, (_, index) => (
              <div className={classNames('sp-col', (index === 4 || index === 8) && 'anchor')} key={index}>
                <div className="sp-bar" id={`sp-${index}`} />
              </div>
            ))}
          </div>
          <div className="spec-scale"><span>20Hz</span><span>125Hz</span><b>1kHz</b><b>4kHz</b><span>16kHz</span></div>
          <div className="spec-foot"><span>PEAK RES: <b>104 Hz</b></span><span className="flat">RESPONSE: FLAT</span></div>
        </section>

        <section className="log-card hw-card">
          <div className="log-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="t">TRANSMISSION LOG // MASTER RELEASES</span>
              <span className="sub" id="log-count">SHOWING {filteredSongs.length} OF {songs.length} TRACKS</span>
            </div>
            <div className="log-filters">
              {[['all', 'ALL FORMATS'], ['flac', 'FLAC 24'], ['dsd', 'DSD / DSF']].map(([filter, label]) => (
                <button type="button" className={classNames('log-chip', logFilter === filter && 'active')} key={filter} onClick={() => onFilter(filter)}>{label}</button>
              ))}
              <button type="button" className="log-chip" onClick={onToggleQueue}>QUEUE ({queueCount})</button>
            </div>
          </div>
          <TrackTable songs={filteredSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} />
          <div className="log-foot"><span>INDEX ARCHIVE: ~/AUDIO_FLAC_DIR</span><span className="ok">CHECK INTEGRITY: ALL MD5 VERIFIED</span></div>
        </section>
      </div>
    </>
  );
}

export function LibraryView({ songs, albums, artists, genres, currentSong, tab, genre, sort, onTab, onGenre, onSort, onPlay, onContextMenu, onPlayAlbum, onPlayArtist }) {
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
      <div className="album-grid">
        {filteredAlbums.map((album) => (
          <div
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
            <div className="album-art" style={{ backgroundImage: `url('${album.art}')` }} />
            <button type="button" className="play-fab" title="Play album" aria-label={`Play ${album.name}`} onClick={(event) => { event.stopPropagation(); onPlayAlbum(album); }}>▶</button>
            <div className="album-name">{album.name}</div>
            <div className="album-meta">{album.artist} · {album.year} · <span className="amber">{album.songIds.every((id) => songs.find((song) => song.id === id)?.hires) ? 'HI-RES' : 'STANDARD'}</span></div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="artist-grid">
        {artists.map((artist) => (
          <div
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
            <div className="album-meta">{artist.songIds.length} TRANSMISSIONS</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Master Library</div>
          <div className="page-sub">{songs.length} SONGS · {albums.length} RELEASES · {formatMinutes(songs.reduce((total, song) => total + song.duration, 0) * 1000)} OF MUSIC</div>
        </div>
        <button type="button" className="hw-tab" onClick={onSort}>{sort === 'az' ? 'SORT: A–Z' : 'SORT: NEWEST'}</button>
      </div>
      <div className="hw-tabs" role="tablist" aria-label="Library type">
        {['songs', 'albums', 'artists'].map((item) => (
          <button type="button" className={classNames('hw-tab', tab === item && 'active')} role="tab" aria-selected={tab === item} key={item} onClick={() => onTab(item)}>{item}</button>
        ))}
      </div>
      {tab === 'songs' && (
        <div className="hw-chips">
          {['All', ...genres].map((item) => (
            <button type="button" className={classNames('hw-chip', genre === item && 'active')} key={item} onClick={() => onGenre(item)}>
              {item.toUpperCase()} <span className="n">{item === 'All' ? songs.length : songs.filter((song) => song.genre === item).length}</span>
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
          <div className="page-title">Hi-Res Vault</div>
          <div className="page-sub">{hiresSongs.length} MASTER FILES · {dsdCount} DSD · BIT-PERFECT PLAYBACK GUARANTEED</div>
        </div>
        <button type="button" className="hw-tab" onClick={onPlayHires}>▶ PLAY VAULT</button>
      </div>
      <TrackTable songs={hiresSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} options={{ master: true, empty: 'NO HI-RES MASTERS FOUND' }} />
    </>
  );
}

export function StashView({ songs, playlists, loved, currentSong, onNewPlaylist, onOpenPlaylist, onShuffleLoved, onPlay, onContextMenu }) {
  const lovedSongs = songs.filter((song) => loved.has(song.id));
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Tape Stash</div>
          <div className="page-sub">{playlists.length} REELS · {lovedSongs.length} LOVED TRANSMISSIONS</div>
        </div>
        <button type="button" className="hw-tab" onClick={onNewPlaylist}>+ NEW REEL</button>
      </div>
      <div className="pl-grid">
        {playlists.map((playlist) => {
          const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
          const cover = playlistSongs[0]?.art || '';
          return (
            <div
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
              <div className="pl-cover" style={cover ? { backgroundImage: `url('${cover}')` } : undefined}>{cover ? '' : '◉'}</div>
              <div className="album-name">{playlist.name}</div>
              <div className="album-meta">{playlistSongs.length} SONGS · REEL {playlist.id.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title"><span className="pd red" />LOVED TRANSMISSIONS</div>
          <button type="button" className="hw-tab" onClick={onShuffleLoved}>⇄ SHUFFLE LOVED</button>
        </div>
        <TrackTable songs={lovedSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} empty="MARK TRANSMISSIONS AS LOVED FROM THE DECK" />
      </div>
    </>
  );
}

export function PlaylistView({ playlist, songs, currentSong, onPlayPlaylist, onRename, onDelete, onPlay, onContextMenu }) {
  if (!playlist) return <div className="empty">REEL NOT FOUND</div>;
  const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{playlist.name}</div>
          <div className="page-sub">{playlistSongs.length} SONGS · {formatMinutes(playlistSongs.reduce((total, song) => total + song.duration, 0) * 1000)} OF MUSIC</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hw-btn primary" onClick={() => onPlayPlaylist(playlist)}>▶ PLAY REEL</button>
          <button type="button" className="hw-btn" onClick={() => onRename(playlist)}>RENAME</button>
          <button type="button" className="hw-btn danger" onClick={() => onDelete(playlist)}>ERASE</button>
        </div>
      </div>
      <TrackTable songs={playlistSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} />
    </>
  );
}

function StatBox({ value, caption }) {
  return <div className="stat-box"><div className="num">{value}</div><div className="cap">{caption}</div></div>;
}

export function StatsView({ history, songs, lovedCount, playlistCount, goalMin, tab, chartMode, onTab, onChartMode, onGoalChange }) {
  let body;
  if (tab === 'overview') {
    const buckets = Stats.whenYouListen(history);
    const total = buckets.reduce((sum, bucket) => sum + bucket.n, 0) || 1;
    let accumulated = 0;
    const stops = buckets.map((bucket) => {
      const from = accumulated / total * 100;
      accumulated += bucket.n;
      return `${bucket.color} ${from}% ${accumulated / total * 100}%`;
    }).join(', ');
    const streak = Stats.streak(history);
    const chartData = chartMode === '7d' ? Stats.last7Days(history) : Stats.last8Weeks(history);
    const maximum = Math.max(...chartData.map((entry) => entry.ms), 1);

    body = (
      <>
        <div className="stat-grid">
          <StatBox value={formatMinutes(Stats.totalMs(history))} caption="Minutes listened" />
          <StatBox value={Stats.totalPlays(history)} caption="Songs played" />
          <StatBox value={formatMinutes(Stats.avgDayMs(history))} caption="A day, on average" />
          <StatBox value={streak} caption="Current streak · days" />
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title"><span className="pd cyan" />MINUTES LISTENED</div>
              <div className="hw-tabs">
                <button type="button" className={classNames('hw-tab', chartMode === '7d' && 'active')} onClick={() => onChartMode('7d')}>7 DAYS</button>
                <button type="button" className={classNames('hw-tab', chartMode === '8w' && 'active')} onClick={() => onChartMode('8w')}>8 WEEKS</button>
              </div>
            </div>
            <div id="stats-chart">
              <div className="chart">
                {chartData.map((entry, index) => (
                  <div className="bar" key={entry.ts}>
                    <div
                      className={classNames('fill', index === chartData.length - 1 && chartMode === '7d' ? 'today' : 'dim')}
                      style={{ height: `${Math.max(2, entry.ms / maximum * 88)}%` }}
                      title={formatMinutes(entry.ms)}
                    />
                    <div className="lbl">{entry.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div className="panel-title"><span className="pd amber" />WHEN YOU LISTEN</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div className="donut" style={{ width: 130, height: 130, borderRadius: '50%', background: `conic-gradient(${stops})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div>
                    <b className="font-dot" style={{ fontSize: 14, color: '#fff' }}>{formatMinutes(Stats.totalMs(history) / Math.max(1, Stats.totalPlays(history)))}</b>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: 'var(--ink-4)', letterSpacing: '.1em' }}>AVG SESSION</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                {buckets.map((bucket) => (
                  <div className="genre-row" key={bucket.name}>
                    <div className="g-head"><span>{bucket.name.toUpperCase()}</span><span>{Math.round(bucket.n / total * 100)}%</span></div>
                    <div className="genre-track"><div className="genre-fill" style={{ width: `${Math.round(bucket.n / total * 100)}%`, background: bucket.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } else if (tab === 'history') {
    body = Stats.historyByDay(history).slice(0, 14).map((day) => (
      <div className="history-day hw-card" key={dayKey(day.ts)}>
        <div className="hd-date">{formatDay(day.ts)} · {day.plays.length} PLAYS · {formatMinutes(day.plays.reduce((sum, play) => sum + (play.ms || 0), 0))}</div>
        {day.plays.slice(0, 6).map((play) => {
          const song = songs.find((item) => item.id === play.songId);
          if (!song) return null;
          return (
            <div className="hist-row" key={play.id || `${play.songId}-${play.ts}`}>
              <span className="hist-time">{new Date(play.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              <div className="hist-thumb" style={{ backgroundImage: `url('${song.art}')` }} />
              <div className="hist-t"><div className="t1">{song.title}</div><div className="t2">{song.artist}</div></div>
              <span className="hist-ms">{formatMinutes(play.ms || 0)}</span>
            </div>
          );
        })}
      </div>
    )) || <div className="empty">NO HISTORY YET</div>;
  } else {
    const streak = Stats.streak(history);
    const activeDays = new Set(history.map((entry) => dayKey(entry.ts)));
    const dots = [];
    const date = new Date();
    for (let index = 0; index < 35; index++) {
      dots.unshift(activeDays.has(dayKey(date.getTime())));
      date.setDate(date.getDate() - 1);
    }
    body = (
      <>
        <div className="stat-grid">
          <StatBox value={streak} caption="Current streak · days" />
          <StatBox value={Math.max(11, streak)} caption="Best streak · days" />
          <StatBox value={formatMinutes(Stats.todayMs(history))} caption={`Today vs ${goalMin} min goal`} />
          <StatBox value={Math.round(Stats.avgDayMs(history) / 60000)} caption="Avg day · min" />
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title"><span className="pd green" />LAST 5 WEEKS</div><span className="page-sub">A DOT A DAY</span></div>
          <div className="streak-dots">{dots.map((active, index) => <div className={classNames('streak-dot', active && 'hit')} key={index} />)}</div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="page-sub" htmlFor="goal-input">DAILY GOAL</label>
            <input
              type="number"
              id="goal-input"
              value={goalMin}
              min="5"
              max="480"
              aria-label="Daily listening goal in minutes"
              style={{ width: 70, background: '#121212', border: '1px solid #262626', color: '#fff', padding: '6px 8px', fontSize: 11 }}
              onChange={(event) => onGoalChange(Math.max(5, Math.min(480, Number(event.target.value) || 30)))}
            />
            <span className="page-sub">MIN / DAY</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Telemetry</div>
          <div className="page-sub">{songs.length} SONGS · 60-DAY WINDOW · {lovedCount} LOVED · {playlistCount} REELS</div>
        </div>
        <div className="hw-tabs" role="tablist" aria-label="Telemetry section">
          {['overview', 'history', 'streak'].map((item) => (
            <button type="button" className={classNames('hw-tab', tab === item && 'active')} role="tab" aria-selected={tab === item} key={item} onClick={() => onTab(item)}>{item.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {body}
    </>
  );
}

export function SettingsView({ switches, onToggleSwitch, onResetDemo, onClearHistory }) {
  const settingRow = (label, description, key) => (
    <div className="setting-row" key={key}>
      <div><div>{label}</div><div className="desc">{description}</div></div>
      <HardwareSwitch checked={switches[key]} onChange={(value) => onToggleSwitch(key, value)} label={label} className="cyan" />
    </div>
  );

  return (
    <>
      <div className="page-head"><div><div className="page-title">System</div><div className="page-sub">AUDIO OS · TP-01 · TUNE YOUR RIG</div></div></div>
      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-head"><div className="panel-title"><span className="pd red" />DSP CHANNELS</div></div>
        {settingRow('Glyph Soundwire', 'Reel lights react 1:1 to the audio signal', 'glyphSync')}
        {settingRow('Crossfeed DSP', 'Analogue-style speaker crossfeed between channels', 'crossfeed')}
        {settingRow('Mono downmix', 'Sum stereo output to a single channel', 'mono')}
      </div>
      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-head"><div className="panel-title"><span className="pd amber" />DEMO DATA</div></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="hw-btn" onClick={onResetDemo}>⟲ RESET DEMO LIBRARY</button>
          <button type="button" className="hw-btn danger" onClick={onClearHistory}>ERASE PLAY HISTORY</button>
        </div>
        <p style={{ marginTop: 14, fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          DEMO MODE: 13 SAMPLE TRACKS GENERATED LOCALLY. FOLDER SCANNING + REAL MUSIC FILES ARRIVE IN THE NEXT MILESTONE.
        </p>
      </div>
    </>
  );
}

export function HelpView() {
  const shortcuts = [
    ['SPACE', 'Play / pause'],
    ['← / →', 'Seek ±5 s'],
    ['SHIFT + ← / →', 'Previous / next track'],
    ['CTRL K', 'Archive search'],
    ['ESC', 'Exit immersion / close overlays'],
    ['Q', 'Toggle transmission queue'],
  ];
  return (
    <>
      <div className="page-head"><div><div className="page-title">Help</div><div className="page-sub">SHORTCUTS & FIELD MANUAL</div></div></div>
      <div className="panel" style={{ maxWidth: 560 }}>
        {shortcuts.map(([shortcut, description]) => (
          <div className="help-row" key={shortcut}><kbd>{shortcut}</kbd><span className="d">{description}</span></div>
        ))}
      </div>
    </>
  );
}
