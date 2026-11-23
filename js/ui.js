// All view renderers — NOTHING AUDIO OS hardware workspace.
const UI = {
  currentView: 'deck',
  libTab: 'songs',
  libGenre: 'All',
  libSort: 'newest',
  chartMode: '7d',
  statsTab: 'overview',
  logFilter: 'all',

  render() {
    const v = this.currentView;
    const html = this[`v_${v}`] ? this[`v_${v}`]() : `<div class="empty">MODULE OFFLINE</div>`;
    document.getElementById('view').innerHTML = html;
    this.updateBreadcrumb(v);
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === v.split('/')[0] || (v.startsWith('playlist/') && a.dataset.view === 'stash')));
    if (v === 'stats') this.renderChart();
    this.updateSidebar();
    FX.onTrackChange(Player.current());
  },

  updateBreadcrumb(v) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
    const crumb = path => `<span>◉ NOTHING (R)</span> &nbsp;›&nbsp; <b>${path}</b>`;
    const map = { deck: 'ACTIVE DECK', library: 'MASTER LIBRARY', stash: 'TAPE STASH', hires: 'HI-RES VAULT', stats: 'TELEMETRY', settings: 'SYSTEM', help: 'HELP' };
    if (v.startsWith('playlist/')) {
      const pl = App.playlists.find(p => p.id === v.split('/')[1]);
      bc.innerHTML = crumb(pl ? `TAPE STASH › ${esc(pl.name).toUpperCase()}` : 'TAPE STASH');
    } else bc.innerHTML = crumb(map[v] || v.toUpperCase());
  },

  updateSidebar() {
    const $ = id => document.getElementById(id);
    if (!$('nav')) return;
    $('nav-count-library').textContent = App.songs.length;
    $('nav-count-stash').textContent = App.playlists.length + App.loved.size;
    $('nav-count-hires').textContent = App.songs.filter(s => s.hires).length;
    $('nav-deck-status').textContent = Player.isPlaying() ? 'PLAYING' : 'IDLE';
  },

  /* ---------- shared fragments ---------- */
  trackRow(song, i, opts = {}) {
    const cur = Player.current();
    const isCur = cur && cur.id === song.id;
    return `<tr class="${isCur ? 'playing' : ''}" data-song="${song.id}" data-i="${i}">
      <td class="st"><span class="st-dot"></span></td>
      <td class="idx">${String(i + 1).padStart(2, '0')}</td>
      <td class="composition"><div class="t1">${esc(song.title)}</div><div class="t2">${esc(song.artist)}</div></td>
      <td class="release">${esc(song.album)} (${song.year}${opts.master ? ' Master' : ''})</td>
      <td><span class="spec-badge ${song.hires ? 'hi' : ''}">${song.spec}</span></td>
      <td class="dr">${song.dr}</td>
      <td class="dur">${fmtTime(song.duration)}</td>
    </tr>`;
  },

  trackTable(songs, opts = {}) {
    if (!songs.length) return `<div class="empty">${opts.empty || 'NO TRANSMISSIONS'}</div>`;
    return `<table class="hw-table"><thead><tr>
      <th>ST</th><th>IDX</th><th>COMPOSITION / PERFORMER</th><th>RELEASE</th><th>SPEC</th><th>DR</th><th style="text-align:right">DUR</th>
    </tr></thead><tbody>${songs.map((s, i) => this.trackRow(s, i, opts)).join('')}</tbody></table>`;
  },

  /* ---------- ACTIVE DECK ---------- */
  v_deck() {
    const cur = Player.current() || App.songs[0];
    const songs = App.songs.filter(s =>
      this.logFilter === 'all' ||
      (this.logFilter === 'flac' && s.spec.includes('kHz')) ||
      (this.logFilter === 'dsd' && s.spec.includes('DSD'))
    );
    return `
    <div class="deck-grid">
      <section class="deck-card hw-card">
        <div class="deck-head">
          <div>
            <div class="deck-eyebrow">
              <span class="red-tally"></span>
              STUDIO REEL MASTER DECK // CH-A
              <span class="hi-res-tag">HI-RES AUDIO</span>
            </div>
            <h1 class="deck-title">${esc(cur.artist)}</h1>
            <p class="deck-trackline">TRACK: <b>${esc(cur.title).toUpperCase()}</b> · ALBUM: <b>${esc(cur.album)}</b> (<span class="lossless">${cur.hires ? 'LOSSLESS ' + cur.hz : cur.spec}</span>)</p>
          </div>
          <div class="deck-specs">
            <div class="deck-spec"><span class="k">SAMPLING FREQ</span><span class="v amber" id="spec-hz">${cur.hz}</span></div>
            <div class="deck-spec"><span class="k">QUANTIZATION</span><span class="v cyan" id="spec-quant">${cur.quant}</span></div>
            <div class="deck-spec"><span class="k">DYNAMIC RANGE</span><span class="v red" id="spec-dr">${cur.dr} (HI-RES)</span></div>
          </div>
        </div>
        <div class="deck-center">
          <div class="platter" id="platter">
            <div class="glyph-ring">
              <span class="gl-seg t"></span><span class="gl-seg tr"></span><span class="gl-seg r"></span><span class="gl-seg br"></span>
              <span class="gl-seg b"></span><span class="gl-seg bl"></span><span class="gl-seg l"></span><span class="gl-seg tl"></span>
            </div>
            <div class="strobe-ring"></div>
            <div class="platter-core spool" id="platter-core">
              <i class="spoke h1"></i><i class="spoke v1"></i><i class="spoke d1"></i><i class="spoke d2"></i>
              <div class="platter-hub"><i></i></div>
            </div>
            <div class="tacho"><span class="td"></span><b>GLYPH TACHO</b><span class="font-dot">33⅓</span></div>
          </div>
          <div class="deck-right">
            <div class="counter-box">
              <div>
                <div class="k">TIME INDEX / COUNTER <span class="bit-exact">BIT-EXACT</span></div>
                <span class="counter-cur" id="tc-cur">00:00.00</span>
              </div>
              <div style="text-align:right">
                <span class="counter-rem-k">REMAINING / RUNTIME</span>
                <span class="counter-rem" id="tc-rem">-00:00.00</span>
              </div>
            </div>
            <div class="ruler-wrap">
              <div class="ruler" id="ruler">
                <div class="ticks ruler-tape"></div>
                <div class="ticks-major ruler-tape-major"></div>
                <div class="ruler-fill" id="ruler-fill"><span class="tpoint" id="tpoint">T-POINT 0.0%</span></div>
              </div>
              <div class="ruler-scale"><span>00:00.00</span><span class="mid">SEC ${fmtTime(cur.duration / 2)}.00</span><span class="end">TOTAL ${fmtTime(cur.duration)}.00</span></div>
            </div>
            <div class="transport-row">
              <button class="milled-button hw-press" id="t-prev">⏮ PREV</button>
              <button class="milled-button hw-press t-stop" id="t-stop"><span class="redbit"></span>STOP</button>
              <button class="milled-button hw-press t-playpause" id="t-pp"><span class="pp" id="t-pp-icon">❚❚</span><span id="t-pp-label">PAUSE</span></button>
              <button class="milled-button hw-press" id="t-next">NEXT ⏭</button>
            </div>
          </div>
        </div>
        <div class="deck-telemetry">
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <span>BURST RATE: <b>2.82 Mbps</b></span>
            <span class="ch">CH: <b>STEREO ${App.switches.mono ? '1.0 MONO' : '2.0'}</b></span>
            <span class="nf">NOISE FLOOR: <b>-118 dB</b></span>
          </div>
          <div class="lock-line">
            <span class="lock-dot"></span>
            DIRECT MEMORY STREAMING
            <span class="font-dot">[LOCKED]</span>
            <button class="hw-tab" data-action="open-immersion" style="margin-left:8px">GLYPH FULLSCREEN ⛶</button>
          </div>
        </div>
      </section>

    </div>

    <div class="bottom-grid">
      <section class="spectrum-card hw-card">
        <div class="spec-head">
          <div class="t"><span class="pd cyan" style="width:6px;height:6px;border-radius:50%;background:var(--cyan)"></span>16-BAND RTA ANALYZER</div>
          <span class="weight-tag">WEIGHT: A-CURVE</span>
        </div>
        <div class="spectrum" id="spectrum">
          ${Array.from({ length: 16 }, (_, i) => `<div class="sp-col ${i === 4 || i === 8 ? 'anchor' : ''}"><div class="sp-bar" id="sp-${i}"></div></div>`).join('')}
        </div>
        <div class="spec-scale"><span>20Hz</span><span>125Hz</span><b>1kHz</b><b>4kHz</b><span>16kHz</span></div>
        <div class="spec-foot">
          <span>PEAK RES: <b>104 Hz</b></span>
          <span class="flat">RESPONSE: FLAT</span>
        </div>
      </section>

      <section class="log-card hw-card">
        <div class="log-head">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span class="t">TRANSMISSION LOG // MASTER RELEASES</span>
            <span class="sub" id="log-count">SHOWING ${songs.length} OF ${App.songs.length} TRACKS</span>
          </div>
          <div class="log-filters">
            <button class="log-chip ${this.logFilter === 'all' ? 'active' : ''}" data-action="log-filter" data-f="all">ALL FORMATS</button>
            <button class="log-chip ${this.logFilter === 'flac' ? 'active' : ''}" data-action="log-filter" data-f="flac">FLAC 24</button>
            <button class="log-chip ${this.logFilter === 'dsd' ? 'active' : ''}" data-action="log-filter" data-f="dsd">DSD / DSF</button>
            <button class="log-chip" data-action="toggle-queue">QUEUE (${Player.queue.length})</button>
          </div>
        </div>
        <div style="overflow-x:auto">${this.trackTable(songs)}</div>
        <div class="log-foot">
          <span>INDEX ARCHIVE: ~/AUDIO_FLAC_DIR</span>
          <span class="ok">CHECK INTEGRITY: ALL MD5 VERIFIED</span>
        </div>
      </section>
    </div>`;
  },

  /* ---------- MASTER LIBRARY ---------- */
  v_library() {
    const genres = ['All', ...App.genres];
    let songs = App.songs.filter(s => this.libGenre === 'All' || s.genre === this.libGenre);
    if (this.libSort === 'az') songs = songs.slice().sort((a, b) => a.title.localeCompare(b.title));
    else songs = songs.slice().sort((a, b) => b.year - a.year || a.album.localeCompare(b.album) || a.track - b.track);

    let body = '';
    if (this.libTab === 'songs') {
      body = this.trackTable(songs);
    } else if (this.libTab === 'albums') {
      let albums = App.albums.filter(a => this.libGenre === 'All' || a.genre === this.libGenre);
      if (this.libSort === 'az') albums = albums.slice().sort((a, b) => a.name.localeCompare(b.name));
      else albums = albums.slice().sort((a, b) => b.year - a.year);
      body = `<div class="album-grid">${albums.map(a => `
        <div class="album-card" data-album="${esc(a.key)}">
          <div class="album-art" style="background-image:url('${a.art}')"></div>
          <button class="play-fab" data-action="play-album" data-album="${esc(a.key)}" title="Play album">▶</button>
          <div class="album-name">${esc(a.name)}</div>
          <div class="album-meta">${esc(a.artist)} · ${a.year} · <span class="amber">${a.songIds.every(id => App.songs.find(s => s.id === id)?.hires) ? 'HI-RES' : 'STANDARD'}</span></div>
        </div>`).join('')}</div>`;
    } else {
      body = `<div class="artist-grid">${App.artists.map(a => `
        <div class="artist-card" data-artist="${esc(a.name)}" data-action="play-artist">
          <div class="artist-pic" style="background-image:url('${a.art}')"></div>
          <div class="album-name">${esc(a.name)}</div>
          <div class="album-meta">${a.songIds.length} TRANSMISSIONS</div>
        </div>`).join('')}</div>`;
    }

    return `
    <div class="page-head">
      <div>
        <div class="page-title">Master Library</div>
        <div class="page-sub">${App.songs.length} SONGS · ${App.albums.length} RELEASES · ${fmtMin(App.songs.reduce((a, s) => a + s.duration, 0) * 1000)} OF MUSIC</div>
      </div>
      <button class="hw-tab" data-action="lib-sort">${this.libSort === 'az' ? 'SORT: A–Z' : 'SORT: NEWEST'}</button>
    </div>
    <div class="hw-tabs">
      ${['songs', 'albums', 'artists'].map(t => `<button class="hw-tab ${this.libTab === t ? 'active' : ''}" data-action="lib-tab" data-tab="${t}">${t}</button>`).join('')}
    </div>
    ${this.libTab === 'songs' ? `<div class="hw-chips">${genres.map(g => `<button class="hw-chip ${this.libGenre === g ? 'active' : ''}" data-action="lib-genre" data-genre="${esc(g)}">${esc(g.toUpperCase())} <span class="n">${g === 'All' ? App.songs.length : App.songs.filter(s => s.genre === g).length}</span></button>`).join('')}</div>` : ''}
    ${body}`;
  },

  /* ---------- HI-RES VAULT ---------- */
  v_hires() {
    const songs = App.songs.filter(s => s.hires);
    const dsd = songs.filter(s => s.spec.includes('DSD')).length;
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Hi-Res Vault</div>
        <div class="page-sub">${songs.length} MASTER FILES · ${dsd} DSD · BIT-PERFECT PLAYBACK GUARANTEED</div>
      </div>
      <button class="hw-tab" data-action="play-hires">▶ PLAY VAULT</button>
    </div>
    ${this.trackTable(songs, { master: true, empty: 'NO HI-RES MASTERS FOUND' })}`;
  },

  /* ---------- TAPE STASH ---------- */
  v_stash() {
    const loved = App.songs.filter(s => App.loved.has(s.id));
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Tape Stash</div>
        <div class="page-sub">${App.playlists.length} REELS · ${loved.length} LOVED TRANSMISSIONS</div>
      </div>
      <button class="hw-tab" data-action="new-playlist">+ NEW REEL</button>
    </div>
    <div class="pl-grid">
      ${App.playlists.map(p => {
        const songs = p.songIds.map(id => App.songs.find(s => s.id === id)).filter(Boolean);
        const cover = songs[0] ? songs[0].art : '';
        return `<div class="pl-card" data-action="open-playlist" data-pl="${p.id}">
          <div class="pl-cover" style="background-image:url('${cover}')">${cover ? '' : '◉'}</div>
          <div class="album-name">${esc(p.name)}</div>
          <div class="album-meta">${songs.length} SONGS · REEL ${p.id.toUpperCase()}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="panel">
      <div class="panel-head">
        <div class="panel-title"><span class="pd red"></span>LOVED TRANSMISSIONS</div>
        <button class="hw-tab" data-action="shuffle-loved">⇄ SHUFFLE LOVED</button>
      </div>
      ${this.trackTable(loved, { empty: 'MARK TRANSMISSIONS AS LOVED FROM THE DECK' })}
    </div>`;
  },

  v_playlist(id) {
    const pl = App.playlists.find(p => p.id === id);
    if (!pl) return '<div class="empty">REEL NOT FOUND</div>';
    const songs = pl.songIds.map(sid => App.songs.find(s => s.id === sid)).filter(Boolean);
    return `
    <div class="page-head">
      <div>
        <div class="page-title">${esc(pl.name)}</div>
        <div class="page-sub">${songs.length} SONGS · ${fmtMin(songs.reduce((a, s) => a + s.duration, 0) * 1000)} OF MUSIC</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="hw-btn primary" data-action="play-pl" data-pl="${pl.id}">▶ PLAY REEL</button>
        <button class="hw-btn" data-action="rename-pl" data-pl="${pl.id}">RENAME</button>
        <button class="hw-btn danger" data-action="delete-pl" data-pl="${pl.id}">ERASE</button>
      </div>
    </div>
    ${this.trackTable(songs)}`;
  },

  /* ---------- TELEMETRY (stats) ---------- */
  v_stats() {
    const tabs = ['overview', 'history', 'streak'];
    let body = '';
    if (this.statsTab === 'overview') {
      const buckets = Stats.whenYouListen();
      const total = buckets.reduce((a, b) => a + b.n, 0) || 1;
      let acc = 0;
      const stops = buckets.map(b => { const from = acc / total * 100; acc += b.n; const to = acc / total * 100; return `${b.color} ${from}% ${to}%`; }).join(', ');
      const streak = Stats.streak();
      body = `
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${fmtMin(Stats.totalMs())}</div><div class="cap">Minutes listened</div></div>
        <div class="stat-box"><div class="num">${Stats.totalPlays()}</div><div class="cap">Songs played</div></div>
        <div class="stat-box"><div class="num">${fmtMin(Stats.avgDayMs())}</div><div class="cap">A day, on average</div></div>
        <div class="stat-box"><div class="num">${streak}</div><div class="cap">Current streak · days</div></div>
      </div>
      <div class="two-col">
        <div class="panel">
          <div class="panel-head"><div class="panel-title"><span class="pd cyan"></span>MINUTES LISTENED</div>
          <div class="hw-tabs">
            <button class="hw-tab ${this.chartMode === '7d' ? 'active' : ''}" data-action="chart-mode" data-mode="7d">7 DAYS</button>
            <button class="hw-tab ${this.chartMode === '8w' ? 'active' : ''}" data-action="chart-mode" data-mode="8w">8 WEEKS</button>
          </div></div>
          <div id="stats-chart"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title"><span class="pd amber"></span>WHEN YOU LISTEN</div></div>
          <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            <div class="donut" style="width:130px;height:130px;border-radius:50%;background:conic-gradient(${stops});display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <div style="width:76px;height:76px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;text-align:center">
                <div><b class="font-dot" style="font-size:14px;color:#fff">${fmtMin(Stats.totalMs() / Math.max(1, Stats.totalPlays()))}</b><div style="font-family:'Space Mono',monospace;font-size:7px;color:var(--ink-4);letter-spacing:.1em">AVG SESSION</div></div>
              </div>
            </div>
            <div style="flex:1;min-width:180px">
              ${buckets.map(b => `<div class="genre-row"><div class="g-head"><span>${b.name.toUpperCase()}</span><span>${Math.round(b.n / total * 100)}%</span></div><div class="genre-track"><div class="genre-fill" style="width:${Math.round(b.n / total * 100)}%;background:${b.color}"></div></div></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    } else if (this.statsTab === 'history') {
      body = Stats.historyByDay().slice(0, 14).map(d => `
        <div class="history-day hw-card">
          <div class="hd-date">${fmtDay(d.ts)} · ${d.plays.length} PLAYS · ${fmtMin(d.plays.reduce((a, p) => a + (p.ms || 0), 0))}</div>
          ${d.plays.slice(0, 6).map(p => {
            const s = App.songs.find(x => x.id === p.songId);
            if (!s) return '';
            return `<div class="hist-row">
              <span class="hist-time">${new Date(p.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              <div class="hist-thumb" style="background-image:url('${s.art}')"></div>
              <div class="hist-t"><div class="t1">${esc(s.title)}</div><div class="t2">${esc(s.artist)}</div></div>
              <span class="hist-ms">${fmtMin(p.ms || 0)}</span>
            </div>`;
          }).join('')}
        </div>`).join('') || '<div class="empty">NO HISTORY YET</div>';
    } else {
      const streak = Stats.streak();
      const days = new Set(App.history.map(h => dayKey(h.ts)));
      const dots = [];
      const d = new Date();
      for (let i = 0; i < 35; i++) { dots.unshift(days.has(dayKey(d.getTime()))); d.setDate(d.getDate() - 1); }
      body = `
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${streak}</div><div class="cap">Current streak · days</div></div>
        <div class="stat-box"><div class="num">${Math.max(11, streak)}</div><div class="cap">Best streak · days</div></div>
        <div class="stat-box"><div class="num">${fmtMin(Stats.todayMs())}</div><div class="cap">Today vs ${App.goalMin} min goal</div></div>
        <div class="stat-box"><div class="num">${Math.round(Stats.avgDayMs() / 60000)}</div><div class="cap">Avg day · min</div></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title"><span class="pd green"></span>LAST 5 WEEKS</div><span class="page-sub">A DOT A DAY</span></div>
        <div class="streak-dots">${dots.map(h => `<div class="streak-dot ${h ? 'hit' : ''}"></div>`).join('')}</div>
        <div style="margin-top:16px;display:flex;align-items:center;gap:10px">
          <span class="page-sub">DAILY GOAL</span>
          <input type="number" id="goal-input" value="${App.goalMin}" min="5" max="480" style="width:70px;background:#121212;border:1px solid #262626;color:#fff;padding:6px 8px;font-size:11px;outline:none">
          <span class="page-sub">MIN / DAY</span>
        </div>
      </div>`;
    }
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Telemetry</div>
        <div class="page-sub">${App.songs.length} SONGS · 60-DAY WINDOW · ${App.loved.size} LOVED · ${App.playlists.length} REELS</div>
      </div>
      <div class="hw-tabs">
        ${tabs.map(t => `<button class="hw-tab ${this.statsTab === t ? 'active' : ''}" data-action="stats-tab" data-tab="${t}">${t.toUpperCase()}</button>`).join('')}
      </div>
    </div>
    ${body}`;
  },

  renderChart() {
    const el = document.getElementById('stats-chart');
    if (!el) return;
    const data = this.chartMode === '7d' ? Stats.last7Days() : Stats.last8Weeks();
    const max = Math.max(...data.map(d => d.ms), 1);
    el.innerHTML = `<div class="chart">${data.map((d, i) => `
      <div class="bar">
        <div class="fill ${i === data.length - 1 && this.chartMode === '7d' ? 'today' : 'dim'}" style="height:${Math.max(2, d.ms / max * 88)}%" title="${fmtMin(d.ms)}"></div>
        <div class="lbl">${d.label}</div>
      </div>`).join('')}</div>`;
  },

  /* ---------- SYSTEM ---------- */
  v_settings() {
    const sw = App.switches;
    const row = (label, desc, id, on, cls) => `
      <div class="setting-row">
        <div><div>${label}</div><div class="desc">${desc}</div></div>
        <button class="hw-switch ${cls} ${on ? 'on' : ''}" data-action="sw" data-sw="${id}" data-on="${on}"><i></i></button>
      </div>`;
    return `
    <div class="page-head"><div><div class="page-title">System</div><div class="page-sub">AUDIO OS · TP-01 · TUNE YOUR RIG</div></div></div>
    <div class="panel" style="max-width:560px">
      <div class="panel-head"><div class="panel-title"><span class="pd red"></span>DSP CHANNELS</div></div>
      ${row('Glyph Soundwire', 'Reel lights react 1:1 to the audio signal', 'glyphSync', sw.glyphSync, 'cyan')}
      ${row('Crossfeed DSP', 'Analogue-style speaker crossfeed between channels', 'crossfeed', sw.crossfeed, 'cyan')}
      ${row('Mono downmix', 'Sum stereo output to a single channel', 'mono', sw.mono, 'cyan')}
    </div>
    <div class="panel" style="max-width:560px">
      <div class="panel-head"><div class="panel-title"><span class="pd amber"></span>DEMO DATA</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="hw-btn" data-action="reset-demo">⟲ RESET DEMO LIBRARY</button>
        <button class="hw-btn danger" data-action="clear-history">ERASE PLAY HISTORY</button>
      </div>
      <p style="margin-top:14px;font-family:'Space Mono',monospace;font-size:10px;color:var(--ink-3);line-height:1.7">DEMO MODE: 13 SAMPLE TRACKS GENERATED LOCALLY. FOLDER SCANNING + REAL MUSIC FILES ARRIVE IN THE NEXT MILESTONE.</p>
    </div>`;
  },

  v_help() {
    return `
    <div class="page-head"><div><div class="page-title">Help</div><div class="page-sub">SHORTCUTS & FIELD MANUAL</div></div></div>
    <div class="panel" style="max-width:560px">
      ${[['SPACE', 'Play / pause'], ['← / →', 'Seek ±5 s'], ['SHIFT + ← / →', 'Previous / next track'], ['CTRL K', 'Archive search'], ['ESC', 'Exit immersion / close overlays'], ['Q', 'Toggle transmission queue']].map(([k, d]) => `
        <div class="help-row"><kbd>${k}</kbd><span class="d">${d}</span></div>`).join('')}
    </div>`;
  },

  /* ---------- queue ---------- */
  renderQueue() {
    const list = document.getElementById('queue-list');
    if (!list) return;
    const count = document.getElementById('q-count');
    if (count) count.textContent = Player.queue.length;
    list.innerHTML = Player.queue.map((s, i) => `
      <div class="q-row ${i === Player.qIndex ? 'current' : ''}" data-action="q-jump" data-i="${i}">
        <div class="q-thumb" style="background-image:url('${s.art}')"></div>
        <div style="min-width:0;flex:1"><div class="t1">${esc(s.title)}</div><div class="t2">${esc(s.artist)}</div></div>
        ${i === Player.qIndex && Player.isPlaying() ? '<span class="q-eq"><i></i><i></i><i></i></span>' : `<button class="q-x" data-action="q-remove" data-i="${i}">✕</button>`}
      </div>`).join('') || '<div class="empty">QUEUE IS EMPTY</div>';
    const qbtn = document.querySelector('[data-action="toggle-queue"]');
    if (qbtn) qbtn.textContent = `QUEUE (${Player.queue.length})`;
  },

  /* ---------- search ---------- */
  renderSearch(q) {
    const box = document.getElementById('search-results');
    q = q.trim().toLowerCase();
    if (!q) { box.innerHTML = '<div class="empty" style="margin:14px">TYPE TO SEARCH THE ARCHIVE</div>'; return; }
    const songs = App.songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q)).slice(0, 8);
    const artists = App.artists.filter(a => a.name.toLowerCase().includes(q)).slice(0, 3);
    const albums = App.albums.filter(a => a.name.toLowerCase().includes(q)).slice(0, 3);
    const row = (art, t1, t2, attrs) => `
      <div class="sr-row" ${attrs}>
        <div class="sr-thumb" style="background-image:url('${art}')"></div>
        <div><div class="t1">${esc(t1)}</div><div class="t2">${esc(t2)}</div></div>
        <span class="go">LOAD ▸</span>
      </div>`;
    let html = '';
    if (artists.length) html += `<div class="sr-label">PERFORMERS</div>` + artists.map(a => row(a.art, a.name, `${a.songIds.length} songs`, `data-action="search-artist" data-artist="${esc(a.name)}"`)).join('');
    if (albums.length) html += `<div class="sr-label">RELEASES</div>` + albums.map(a => row(a.art, a.name, `${esc(a.artist)} · ${a.year}`, `data-action="search-album" data-album="${esc(a.key)}"`)).join('');
    if (songs.length) html += `<div class="sr-label">TRANSMISSIONS</div>` + songs.map(s => row(s.art, s.title, `${esc(s.artist)} · ${s.spec}`, `data-song="${s.id}"`)).join('');
    box.innerHTML = html || '<div class="empty" style="margin:14px">NO RESULTS</div>';
  },

  /* ---------- context menu ---------- */
  songMenu(song, x, y) {
    closeMenu();
    const loved = App.loved.has(song.id);
    const pls = App.playlists.map(p => `<button class="ctx-item" data-action="add-to-pl" data-pl="${p.id}" data-song="${song.id}">+ Add to ${esc(p.name)}</button>`).join('');
    const el = document.createElement('div');
    el.className = 'ctx-menu';
    el.id = 'ctx-menu';
    el.style.left = Math.min(x, innerWidth - 220) + 'px';
    el.style.top = Math.min(y, innerHeight - 260) + 'px';
    el.innerHTML = `
      <button class="ctx-item" data-action="ctx-play" data-song="${song.id}">▸ Play now</button>
      <button class="ctx-item" data-action="ctx-next" data-song="${song.id}">⏭ Play next</button>
      <button class="ctx-item" data-action="ctx-queue" data-song="${song.id}">≡ Add to queue</button>
      <button class="ctx-item" data-action="love" data-song="${song.id}">${loved ? '♡ Unlove' : '♥ Love'}</button>
      ${pls}
      <button class="ctx-item" data-action="new-playlist-with" data-song="${song.id}">+ New reel from song</button>`;
    document.body.appendChild(el);
    document.getElementById('menu-overlay').classList.add('open');
  },

  /* ---------- footer player bar ---------- */
  renderIfCurrent(song) {
    const cur = Player.current();
    if (cur && cur.id === song.id) this.updatePlayerBar();
  },

  updatePlayerBar() {
    const cur = Player.current();
    const $ = id => document.getElementById(id);
    if (cur) {
      $('pb-art').style.backgroundImage = `url('${cur.art}')`;
      $('pb-title').textContent = cur.title;
      $('pb-artist').textContent = `${cur.artist} · ${cur.album}`;
      $('pb-spec').textContent = cur.short;
      $('pb-engine').textContent = Player.isPlaying() ? 'ASIO DIRECT' : 'STANDBY';
    }
    $('pb-play').textContent = Player.isPlaying() ? '❚❚' : '▶';
    $('pb-shuffle').classList.toggle('active', Player.shuffle);
    const rep = $('pb-repeat');
    rep.classList.toggle('active', Player.repeat !== 'off');
    rep.textContent = Player.repeat === 'off' ? 'REPEAT OFF' : Player.repeat === 'all' ? 'REPEAT ALL' : 'REPEAT 1';
    $('pb-love').textContent = cur && App.loved.has(cur.id) ? '♥' : '♡';
    $('pb-love').classList.toggle('loved', !!(cur && App.loved.has(cur.id)));
    $('pb-mute').classList.toggle('muted', !!(Player.audio && Player.audio.muted));
    $('pb-art').classList.toggle('spinning', Player.isPlaying());
  },

  updateTime() {
    const a = Player.audio;
    document.getElementById('pb-cur').textContent = fmtTime(a.currentTime);
    document.getElementById('pb-dur').textContent = fmtTime(a.duration || 0);
  },

  reRenderCurrentView() {
    this.render();
  },
};
