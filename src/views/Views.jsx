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
  onOpenImmersion,
  onSeek,
}) {
  const current = currentSong || songs[0];
  if (!current) {
    const total = scanProgress?.total || 0;
    const done = scanProgress?.done || 0;
    const scanPct = total ? Math.round((done / total) * 100) : 0;

    return (
      <div className="mount-wrap">
        <section className="mount-card hw-card">
          <div className="deck-eyebrow">
            <span className="red-tally" />
            LOCAL ARCHIVE // {scanning ? 'INDEXING' : 'STANDBY'}
          </div>
          <h1 className="mount-title">{scanning ? 'SCANNING LOCAL FOLDER' : 'NO LOCAL FOLDER MOUNTED'}</h1>
          <p className="mount-desc">
            Mount a folder from your computer to index MP3, FLAC, WAV, M4A, AAC, OGG, or OPUS tracks with embedded album art and metadata. Everything stays local on your device.
          </p>
          {scanning && (
            <div className="mount-progress">
              <div className="mount-progress-meta mono">
                <span>INDEXING AUDIO TAGS</span>
                <span>{total ? `${done} / ${total} (${scanPct}%)` : 'READING DIRECTORY...'}</span>
              </div>
              <div className="mount-progress-track">
                <div className="mount-progress-fill" style={{ width: `${total ? scanPct : 18}%` }} />
              </div>
            </div>
          )}
          <div className="mount-actions">
            <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
              {scanning ? 'SCANNING...' : '+ MOUNT LOCAL FOLDER'}
            </button>
            {savedFolderName && !scanning && (
              <button type="button" className="hw-btn" onClick={onReconnectFolder}>
                RECONNECT &ldquo;{savedFolderName.toUpperCase()}&rdquo;
              </button>
            )}
            <button type="button" className="hw-btn" disabled={scanning} onClick={onStartDemo}>
              ▶ DEMO MODE
            </button>
          </div>
        </section>
      </div>
    );
  }

  const progress = duration ? currentTime / duration : 0;

  return (
    <>
      <div className="deck-grid">
        <section className="deck-card hw-card">
          <div className="deck-head">
            <div>
              <h1 className="deck-title">{current.artist}</h1>
              <p className="deck-trackline">
                TRACK: <b>{current.title.toUpperCase()}</b> · ALBUM: <b>{current.album}</b>
              </p>
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
                  <span className="mid">SEC {current.duration ? formatTime(current.duration / 2) : '0:00'}.00</span>
                  <span className="end">TOTAL {current.duration ? formatTime(current.duration) : '0:00'}.00</span>
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

          <div className="deck-telemetry" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="hw-tab" onClick={onOpenImmersion}>GLYPH FULLSCREEN ⛶</button>
          </div>
        </section>
      </div>
    </>
  );
}

export function LibraryView({ songs, albums, artists, genres, currentSong, folderName, scanning, tab, genre, sort, onTab, onGenre, onSort, onPickFolder, onStartDemo, onPlay, onContextMenu, onPlayAlbum, onPlayArtist }) {
  if (!songs.length) {
    return (
      <>
        <div className="page-head">
          <div>
            <div className="page-title">Master Library</div>
            <div className="page-sub">NO LOCAL FOLDER MOUNTED</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
              {scanning ? 'SCANNING...' : '+ MOUNT LOCAL FOLDER'}
            </button>
            <button type="button" className="hw-btn" disabled={scanning} onClick={onStartDemo}>
              ▶ DEMO MODE
            </button>
          </div>
        </div>
        <div className="empty">MOUNT A LOCAL MUSIC FOLDER OR START DEMO MODE TO BROWSE SONGS, ALBUMS, AND ARTISTS</div>
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
          <div className="page-sub">{folderName ? `${folderName.toUpperCase()} · ` : ''}{songs.length} SONGS · {albums.length} RELEASES · {formatMinutes(songs.reduce((total, song) => total + song.duration, 0) * 1000)} OF MUSIC</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="hw-tab" disabled={scanning} onClick={onPickFolder}>{scanning ? 'SCANNING...' : 'CHANGE FOLDER'}</button>
          <button type="button" className="hw-tab" onClick={onSort}>{sort === 'az' ? 'SORT: A–Z' : 'SORT: NEWEST'}</button>
        </div>
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
        <button type="button" className="hw-tab" disabled={!hiresSongs.length} onClick={onPlayHires}>▶ PLAY VAULT</button>
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
        <TrackTable songs={lovedSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} options={{ empty: 'MARK TRANSMISSIONS AS LOVED FROM THE DECK' }} />
      </div>
    </>
  );
}

export function PlaylistView({ playlist, songs, currentSong, onPlayPlaylist, onAddSongs, onRename, onDelete, onPlay, onContextMenu }) {
  if (!playlist) return <div className="empty">REEL NOT FOUND</div>;
  const playlistSongs = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">{playlist.name}</div>
          <div className="page-sub">{playlistSongs.length} SONGS · {formatMinutes(playlistSongs.reduce((total, song) => total + song.duration, 0) * 1000)} OF MUSIC</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="hw-btn primary" disabled={!playlistSongs.length} onClick={() => onPlayPlaylist(playlist)}>▶ PLAY REEL</button>
          <button type="button" className="hw-btn" onClick={() => onAddSongs(playlist)}>+ ADD SONGS</button>
          <button type="button" className="hw-btn" onClick={() => onRename(playlist)}>RENAME</button>
          <button type="button" className="hw-btn danger" onClick={() => onDelete(playlist)}>ERASE</button>
        </div>
      </div>
      {playlistSongs.length ? (
        <TrackTable songs={playlistSongs} currentSong={currentSong} onPlay={onPlay} onContextMenu={onContextMenu} />
      ) : (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 28 }}>
          <div className="page-sub">THIS REEL HAS NO SONGS YET</div>
          <button type="button" className="hw-btn primary" onClick={() => onAddSongs(playlist)}>+ ADD SONGS TO REEL</button>
        </div>
      )}
    </>
  );
}

function StatBox({ value, caption }) {
  return <div className="stat-box"><div className="num">{value}</div><div className="cap">{caption}</div></div>;
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
              <div className="donut" style={{ width: 130, height: 130, borderRadius: '50%', background: history.length ? `conic-gradient(${stops})` : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    const dayGroups = Stats.historyByDay(history).slice(0, 14);
    body = dayGroups.length ? dayGroups.map((day) => (
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
    )) : <div className="empty">NO HISTORY YET</div>;
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
        <div className="stat-grid">
          <StatBox value={streak} caption="Current streak · days" />
          <StatBox value={bestStreak} caption="Best streak · days" />
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
        <div className="panel-head"><div className="panel-title"><span className="pd amber" />LOCAL ARCHIVE</div></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="hw-btn primary" disabled={scanning} onClick={onPickFolder}>
            {scanning ? 'SCANNING...' : folderName && !isDemoMode ? 'CHANGE FOLDER' : 'MOUNT LOCAL FOLDER'}
          </button>
          {!isDemoMode && (
            <button type="button" className="hw-btn" disabled={scanning} onClick={onStartDemo}>▶ DEMO MODE</button>
          )}
          {canRescan && (
            <button type="button" className="hw-btn" disabled={scanning} onClick={onRescan}>⟲ RESCAN FOLDER</button>
          )}
          {folderName && (
            <button type="button" className="hw-btn danger" disabled={scanning} onClick={onDisconnect}>
              {isDemoMode ? 'EXIT DEMO MODE' : 'DISCONNECT'}
            </button>
          )}
          <button type="button" className="hw-btn danger" onClick={onClearHistory}>ERASE PLAY HISTORY</button>
        </div>
        <p style={{ marginTop: 14, fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          {isDemoMode
            ? `DEMO MODE ACTIVE · ${songCount} SYNTHESIZED SAMPLE TRACKS LOADED.`
            : folderName
              ? `MOUNTED FOLDER: "${folderName.toUpperCase()}" · ${songCount} TRACKS INDEXED LOCALLY.`
              : 'NO LOCAL FOLDER MOUNTED. PICK A MUSIC FOLDER OR USE DEMO MODE TO TEST THE RIG.'}
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
