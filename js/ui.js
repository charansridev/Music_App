// All view renderers. Pure HTML-string builders + a few interactive helpers.
const UI = {
  currentView: 'home',
  libTab: 'albums',
  libGenre: 'All',
  libSort: 'newest',
  chartMode: '7d',
  statsTab: 'overview',

  render() {
    const v = this.currentView;
    const html = this[`v_${v}`] ? this[`v_${v}`]() : `<div class="empty">Coming soon</div>`;
    const el = document.getElementById('view');
    el.innerHTML = html;
    this.updateBreadcrumb(v);
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === v.split('/')[0] || (v.startsWith('playlist/') && a.dataset.view === 'playlists')));
    if (v === 'home' || v === 'stats') this.renderChart(v);
  },

  updateBreadcrumb(v) {
    const bc = document.getElementById('breadcrumb');
    const crumb = (path) => `<span>◉ NOTHING</span> &nbsp;›&nbsp; <b>${path}</b>`;
    if (v === 'home') bc.innerHTML = crumb('Home');
    else if (v === 'library') bc.innerHTML = crumb('Library › ' + { songs: 'Songs', albums: 'Albums', artists: 'Artists' }[this.libTab]);
    else if (v === 'loved') bc.innerHTML = crumb('Loved');
    else if (v === 'playlists') bc.innerHTML = crumb('Playlists');
    else if (v.startsWith('playlist/')) {
      const pl = App.playlists.find(p => p.id === v.split('/')[1]);
      bc.innerHTML = crumb(pl ? `Playlists › ${esc(pl.name)}` : 'Playlists');
    }
    else if (v === 'stats') bc.innerHTML = crumb('Stats');
    else if (v === 'settings') bc.innerHTML = crumb('Settings');
    else if (v === 'help') bc.innerHTML = crumb('Help');
    else if (v === 'podcasts') bc.innerHTML = crumb('Podcasts');
  },

  /* ---------- shared fragments ---------- */
  songRow(song, i, opts = {}) {
    const cur = Player.current();
    const isCur = cur && cur.id === song.id;
    const loved = App.loved.has(song.id);
    return `<div class="song-row ${isCur ? 'playing' : ''}" data-song="${song.id}" data-i="${i}">
      ${opts.number !== false ? `<div class="idx">${isCur && Player.isPlaying() ? '<span class="q-eq"><i></i><i></i><i></i></span>' : dotNumber(i + 1)}</div>` : '<div></div>'}
      <div class="thumb" style="background-image:url('${song.art}')"></div>
      <div style="min-width:0"><div class="s-title">${esc(song.title)}</div><div class="s-sub">${esc(song.artist)}</div></div>
      <div class="s-sub" style="min-width:0">${esc(song.album)}</div>
      <div class="row-actions">
        <button class="icon-btn heart-btn ${loved ? 'on' : ''}" data-action="love" data-song="${song.id}" title="Love">${ico('heart')}</button>
        <button class="icon-btn" data-action="menu" data-song="${song.id}">${ico('dots')}</button>
      </div>
      <div class="s-dur">${fmtTime(song.duration)}</div>
    </div>`;
  },

  songList(songs, opts = {}) {
    if (!songs.length) return `<div class="empty">${opts.empty || 'Nothing here yet'}</div>`;
    return `<div class="song-list">${songs.map((s, i) => this.songRow(s, i, opts)).join('')}</div>`;
  },

  /* ---------- Home ---------- */
  v_home() {
    const now = Player.current();
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const lovedCount = App.loved.size;
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    const streak = Stats.streak();
    const totalMin = Stats.todayMs();
    const heroTag = now && Player.isPlaying() ? 'Now playing' : 'Up next';
    const heroSong = now || App.songs[0];

    return `
    <div style="padding:6px 4px 16px">
      <div class="page-title">${greet}, Noor</div>
      <div class="page-sub">${dateStr} &nbsp;·&nbsp; ${lovedCount} loved songs &nbsp;·&nbsp; ${App.playlists.length} playlists</div>
    </div>
    <div class="hero-grid">
      <div class="hero">
        <canvas id="hero-dots"></canvas>
        <div class="hero-info">
          <div class="hero-tag"><span class="dot"></span>${heroTag}</div>
          <div class="hero-title">${esc(heroSong.title)}</div>
          <div class="hero-sub">${esc(heroSong.artist)} &nbsp;·&nbsp; ${esc(heroSong.album)}</div>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="play-something">${ico('play')} Play something</button>
            <button class="btn btn-ghost" data-action="shuffle-loved">${ico('shuffle')} Shuffle loved</button>
          </div>
        </div>
        <div class="hero-art-wrap">
          <div class="bpm-ring ${Player.isPlaying() ? 'beat' : ''}"></div>
          <div class="hero-art scanlines" style="background-image:url('${heroSong.art}');--art-glow:${(GENRE_COLORS[heroSong.genre] || '#FF2D2D') + '55'}"></div>
          <div class="hero-eq ${Player.isPlaying() ? 'live' : 'idle'}"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></div>
        </div>
        <div class="hero-today"><span class="badge">${fmtMin(totalMin)}</span> today · goal met — nice</div>
      </div>
      <div class="tiles">
        <div class="tile-row">
          <div class="tile red"><div class="tile-ico">${ico('note')}</div><div class="tile-label">Songs played</div><div class="tile-value">${Stats.totalPlays()}</div><div class="tile-delta">all-time</div></div>
          <div class="tile amber"><div class="tile-ico">${ico('heart')}</div><div class="tile-label">Loved songs</div><div class="tile-value">${lovedCount}</div><div class="tile-delta">in your library</div></div>
        </div>
        <div class="tile-row">
          <div class="tile cyan"><div class="tile-ico">${ico('clock')}</div><div class="tile-label">Hours listened</div><div class="tile-value">${fmtHours(Stats.totalMs())}</div><div class="tile-delta">all-time</div></div>
          <div class="tile green"><div class="tile-ico">${ico('fire')}</div><div class="tile-label">Current streak</div><div class="tile-value">${streak}</div><div class="tile-delta">days in a row · best ${Math.max(streak, 11)}</div></div>
        </div>
      </div>
    </div>
    <div class="home-bottom">
      <div class="card panel">
        <div class="panel-head">
          <div class="section-title">Your listening</div>
          <div class="seg">
            <button data-action="chart-mode" data-mode="7d" class="${this.chartMode === '7d' ? 'active' : ''}">7 days</button>
            <button data-action="chart-mode" data-mode="8w" class="${this.chartMode === '8w' ? 'active' : ''}">8 weeks</button>
          </div>
        </div>
        <div id="listen-chart"></div>
        <div style="margin-top:12px;font-size:11px;color:var(--muted);font-weight:600">30 min in the last 7 days · avg ${fmtMin(Stats.avgDayMs() * 7)} a day · 30-min goal</div>
      </div>
      <div class="card panel">
        <div class="panel-head"><div class="section-title">Your genre mix</div><span style="font-size:11px;color:var(--muted);font-weight:700">Stats ›</span></div>
        <div id="genre-mix">${this.genreMix()}</div>
      </div>
    </div>`;
  },

  genreMix() {
    const rows = Stats.topGenres();
    if (!rows.length) return '<div class="empty">Play something to build your mix</div>';
    return rows.map(r => `
      <div class="genre-row">
        <div class="g-head"><span>${esc(r.genre)}</span><span>${r.pct}%</span></div>
        <div class="genre-track"><div class="genre-fill" style="width:${r.pct}%;background:${GENRE_COLORS[r.genre] || 'var(--accent)'}"></div></div>
      </div>`).join('');
  },

  renderChart(view) {
    const data = this.chartMode === '7d' ? Stats.last7Days() : Stats.last8Weeks();
    const max = Math.max(...data.map(d => d.ms), 1);
    const goal = view === 'home' ? 30 * 60000 * (this.chartMode === '7d' ? 1 : 7) : 0;
    const goalPct = goal && goal < max ? Math.round((1 - goal / max) * 100) : null;
    const chartId = view === 'home' ? 'listen-chart' : 'stats-chart';
    const el = document.getElementById(chartId);
    if (!el) return;
    el.innerHTML = `
      <div class="chart">
        ${goalPct !== null ? `<div class="goal-line" style="bottom:${100 - goalPct}%"><span class="goal-label">30-min goal</span></div>` : ''}
        ${data.map((d, i) => `
          <div class="bar">
            <div class="fill ${i === data.length - 1 && this.chartMode === '7d' ? '' : 'dim'}" style="height:${Math.max(2, d.ms / max * 88)}%" title="${fmtMin(d.ms)}"></div>
            <div class="lbl">${d.label}</div>
          </div>`).join('')}
      </div>`;
    if (view === 'home') {
      const gm = document.getElementById('genre-mix');
      if (gm) gm.innerHTML = this.genreMix();
    }
  },

  /* ---------- Library ---------- */
  v_library() {
    const genres = ['All', ...App.genres];
    let songs = App.songs.filter(s => this.libGenre === 'All' || s.genre === this.libGenre);
    if (this.libSort === 'az') songs = songs.slice().sort((a, b) => a.title.localeCompare(b.title));
    else songs = songs.slice().sort((a, b) => b.year - a.year || a.album.localeCompare(b.album) || a.track - b.track);

    let body = '';
    if (this.libTab === 'songs') {
      body = this.songList(songs);
    } else if (this.libTab === 'albums') {
      let albums = App.albums.filter(a => this.libGenre === 'All' || a.genre === this.libGenre);
      if (this.libSort === 'az') albums = albums.slice().sort((a, b) => a.name.localeCompare(b.name));
      else albums = albums.slice().sort((a, b) => b.year - a.year);
      body = `<div class="album-grid">${albums.map(a => `
        <div class="album-card" data-album="${esc(a.key)}">
          <div class="album-art" style="background-image:url('${a.art}')"></div>
          <button class="play-fab" data-action="play-album" data-album="${esc(a.key)}">${ico('play')}</button>
          <div class="album-name">${esc(a.name)}</div>
          <div class="album-meta">${esc(a.artist)} · ${a.year}</div>
        </div>`).join('')}</div>`;
    } else {
      body = `<div class="artist-grid">${App.artists.map(a => `
        <div class="artist-card" data-artist="${esc(a.name)}" data-action="play-artist">
          <div class="artist-pic" style="background-image:url('${a.art}')"></div>
          <div class="album-name">${esc(a.name)}</div>
          <div class="album-meta">${a.songIds.length} songs</div>
        </div>`).join('')}</div>`;
    }

    return `
    <div style="padding:6px 4px 0">
      <div class="page-title">Library</div>
      <div class="page-sub">${App.songs.length} songs · ${App.albums.length} albums · ${fmtMin(App.songs.reduce((a, s) => a + s.duration, 0) * 1000)} of music</div>
    </div>
    <div class="tabs">
      ${['songs', 'albums', 'artists'].map(t => `<button data-action="lib-tab" data-tab="${t}" class="${this.libTab === t ? 'active' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
    </div>
    <div class="toolbar-row">
      <div class="chips">
        ${genres.map(g => `<button class="chip ${this.libGenre === g ? 'active' : ''}" data-action="lib-genre" data-genre="${esc(g)}">${esc(g)} <span class="n">${g === 'All' ? App.songs.length : App.songs.filter(s => s.genre === g).length}</span></button>`).join('')}
      </div>
      <button class="chip" data-action="lib-sort">${ico('shuffle')} ${this.libSort === 'az' ? 'A–Z' : 'Newest'}</button>
    </div>
    ${body}`;
  },

  /* ---------- Loved ---------- */
  v_loved() {
    const songs = App.songs.filter(s => App.loved.has(s.id));
    return `
    <div style="padding:6px 4px 0">
      <div class="page-title">Loved</div>
      <div class="page-sub">${songs.length} songs you can't stop playing</div>
    </div>
    <div style="margin:16px 0"><button class="btn btn-primary" data-action="shuffle-loved">${ico('shuffle')} Shuffle loved</button></div>
    ${this.songList(songs, { empty: 'Tap the heart on any song to add it here' })}`;
  },

  /* ---------- Playlists ---------- */
  v_playlists() {
    return `
    <div style="padding:6px 4px 0">
      <div class="page-title">Playlists</div>
      <div class="page-sub">${App.playlists.length} playlists · made by you</div>
    </div>
    <div class="pl-grid">
      ${App.playlists.map(p => {
        const songs = p.songIds.map(id => App.songs.find(s => s.id === id)).filter(Boolean);
        const cover = songs[0] ? songs[0].art : '';
        return `<div class="pl-card" data-action="open-playlist" data-pl="${p.id}">
          <div class="pl-cover" style="background-image:url('${cover}')">${cover ? '' : ico('playlist')}</div>
          <div class="album-name">${esc(p.name)}</div>
          <div class="album-meta">${songs.length} songs</div>
        </div>`;
      }).join('')}
      <div class="pl-add" data-action="new-playlist">${ico('plus')} New playlist</div>
    </div>`;
  },

  v_playlist(id) {
    const pl = App.playlists.find(p => p.id === id);
    if (!pl) return '<div class="empty">Playlist not found</div>';
    const songs = pl.songIds.map(sid => App.songs.find(s => s.id === sid)).filter(Boolean);
    return `
    <div style="padding:6px 4px 8px">
      <div class="page-title">${esc(pl.name)}</div>
      <div class="page-sub">${songs.length} songs · ${fmtMin(songs.reduce((a, s) => a + s.duration, 0) * 1000)} of music</div>
    </div>
    <div style="display:flex;gap:10px;margin:8px 0 16px">
      <button class="btn btn-primary" data-action="play-pl" data-pl="${pl.id}">${ico('play')} Play</button>
      <button class="btn btn-ghost" data-action="rename-pl" data-pl="${pl.id}">${ico('edit')} Rename</button>
      <button class="btn btn-danger" data-action="delete-pl" data-pl="${pl.id}">${ico('trash')} Delete</button>
    </div>
    ${this.songList(songs)}`;
  },

  /* ---------- Stats ---------- */
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
      <div class="stats-grid">
        <div class="card stat-box"><div class="num">${fmtMin(Stats.totalMs())}</div><div class="cap">Minutes listened</div></div>
        <div class="card stat-box"><div class="num">${Stats.totalPlays()}</div><div class="cap">Songs played</div></div>
        <div class="card stat-box"><div class="num">${fmtMin(Stats.avgDayMs())}</div><div class="cap">A day, on average</div></div>
        <div class="card stat-box"><div class="num">${streak}</div><div class="cap">Current streak · days</div></div>
      </div>
      <div class="stats-cols">
        <div class="card panel">
          <div class="panel-head"><div class="section-title">Minutes listened</div>
          <div class="seg">
            <button data-action="chart-mode" data-mode="7d" class="${this.chartMode === '7d' ? 'active' : ''}">7 days</button>
            <button data-action="chart-mode" data-mode="8w" class="${this.chartMode === '8w' ? 'active' : ''}">8 weeks</button>
          </div></div>
          <div id="stats-chart"></div>
        </div>
        <div class="card panel">
          <div class="panel-head"><div class="section-title">When you listen</div></div>
          <div class="donut-wrap">
            <div class="donut" style="background:conic-gradient(${stops})">
              <div class="donut-center"><div><b>${fmtMin(Stats.totalMs() / Math.max(1, Stats.totalPlays()))}</b><span>avg session</span></div></div>
            </div>
            <div class="legend">
              ${buckets.map(b => `<div class="l-row"><span class="l-row" style="gap:8px"><span class="l-dot" style="background:${b.color}"></span>${b.name}</span><span>${Math.round(b.n / total * 100)}%</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    } else if (this.statsTab === 'history') {
      const days = Stats.historyByDay().slice(0, 14);
      body = days.map(d => `
        <div class="history-day">
          <div class="hd-date">${fmtDay(d.ts)} · ${d.plays.length} plays · ${fmtMin(d.plays.reduce((a, p) => a + (p.ms || 0), 0))}</div>
          ${d.plays.slice(0, 6).map(p => {
            const s = App.songs.find(x => x.id === p.songId);
            if (!s) return '';
            return `<div class="song-row" data-song="${s.id}" style="cursor:default">
              <div class="idx">${new Date(p.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
              <div class="thumb" style="background-image:url('${s.art}')"></div>
              <div style="min-width:0"><div class="s-title">${esc(s.title)}</div><div class="s-sub">${esc(s.artist)}</div></div>
              <div></div><div></div><div class="s-dur">${fmtMin(p.ms || 0)}</div>
            </div>`;
          }).join('')}
        </div>`).join('') || '<div class="empty">No history yet</div>';
    } else {
      const streak = Stats.streak();
      const days = new Set(App.history.map(h => dayKey(h.ts)));
      const dots = [];
      const d = new Date();
      for (let i = 0; i < 35; i++) { dots.unshift(days.has(dayKey(d.getTime()))); d.setDate(d.getDate() - 1); }
      body = `
      <div class="stats-grid">
        <div class="card stat-box"><div class="num">${streak}</div><div class="cap">Current streak · days</div></div>
        <div class="card stat-box"><div class="num">${Math.max(11, streak)}</div><div class="cap">Best streak · days</div></div>
        <div class="card stat-box"><div class="num">${fmtMin(Stats.todayMs())}</div><div class="cap">Today vs ${App.goalMin} min goal</div></div>
        <div class="card stat-box"><div class="num">${Math.round(Stats.avgDayMs() / 60000)}</div><div class="cap">Avg day · min</div></div>
      </div>
      <div class="card panel">
        <div class="panel-head"><div class="section-title">Last 5 weeks</div><span style="font-size:11px;color:var(--muted);font-weight:700">a dot a day</span></div>
        <div class="streak-dots">${dots.map(h => `<div class="streak-dot ${h ? 'hit' : ''}"></div>`).join('')}</div>
        <div style="margin-top:16px;display:flex;align-items:center;gap:10px">
          <span style="font-weight:700;font-size:12.5px">Daily goal</span>
          <input type="number" id="goal-input" value="${App.goalMin}" min="5" max="480" style="width:70px;padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--ink);font-weight:700">
          <span style="color:var(--muted);font-size:12px;font-weight:600">min / day</span>
        </div>
      </div>`;
    }
    return `
    <div style="padding:6px 4px 0">
      <div class="page-title">Stats</div>
      <div class="page-sub">${App.songs.length} songs in the last 60 days · ${App.loved.size} loved songs · ${App.playlists.length} playlists</div>
    </div>
    <div class="tabs">
      ${tabs.map(t => `<button data-action="stats-tab" data-tab="${t}" class="${this.statsTab === t ? 'active' : ''}">${t[0].toUpperCase() + t.slice(1)}${t === 'streak' ? ' & goal' : ''}</button>`).join('')}
    </div>
    ${body}`;
  },

  /* ---------- Settings / stubs ---------- */
  v_settings() {
    return `
    <div style="padding:6px 4px 0"><div class="page-title">Settings</div><div class="page-sub">Tune your listening room</div></div>
    <div class="card panel" style="max-width:520px;margin-top:16px">
      <div class="panel-head"><div class="section-title">Appearance</div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0">
        <span style="font-weight:500">Light mode</span>
        <span class="mono" style="font-size:10px;color:var(--neon-red);letter-spacing:.12em">◉ LOCKED — NO LIGHT MODE. EVER.</span>
      </div>
      <div class="panel-head" style="margin-top:18px"><div class="section-title">Demo data</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-action="reset-demo">${ico('shuffle')} Reset demo library</button>
        <button class="btn btn-danger btn-sm" data-action="clear-history">${ico('trash')} Clear play history</button>
      </div>
      <p style="margin-top:14px;font-size:12px;color:var(--muted);font-weight:600;line-height:1.5">Demo mode: 13 sample songs are generated locally. Folder scanning + real music files arrive in the next milestone.</p>
    </div>`;
  },

  v_podcasts() {
    return `<div class="empty">${ico('mic')}<div>Podcasts are coming once local folder support lands.</div></div>`;
  },

  v_help() {
    return `
    <div style="padding:6px 4px 0"><div class="page-title">Help</div><div class="page-sub">Shortcuts & tips</div></div>
    <div class="card panel" style="max-width:520px;margin-top:16px">
      ${[['Space', 'Play / pause'], ['← / →', 'Seek ±5 s'], ['Shift + ← / →', 'Previous / next track'], ['Ctrl K', 'Search'], ['Double-click', 'Play a song row']].map(([k, d]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:600">
          <span class="kbd" style="font-size:12px;padding:6px 12px">${k}</span><span style="color:var(--muted)">${d}</span>
        </div>`).join('')}
    </div>`;
  },

  /* ---------- Queue ---------- */
  renderQueue() {
    const list = document.getElementById('queue-list');
    list.innerHTML = Player.queue.map((s, i) => `
      <div class="q-row ${i === Player.qIndex ? 'current' : ''}" data-action="q-jump" data-i="${i}">
        <div class="q-thumb" style="background-image:url('${s.art}')"></div>
        <div style="min-width:0;flex:1"><div class="s-title">${esc(s.title)}</div><div class="s-sub">${esc(s.artist)}</div></div>
        ${i === Player.qIndex && Player.isPlaying() ? '<span class="q-eq"><i></i><i></i><i></i></span>' : `<button class="icon-btn" data-action="q-remove" data-i="${i}" style="width:26px;height:26px">${ico('x')}</button>`}
      </div>`).join('') || '<div class="empty">Queue is empty</div>';
  },

  /* ---------- Search ---------- */
  renderSearch(q) {
    const box = document.getElementById('search-results');
    q = q.trim().toLowerCase();
    if (!q) { box.innerHTML = '<div class="empty" style="padding:30px">Type to search songs, artists, albums</div>'; return; }
    const songs = App.songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q)).slice(0, 8);
    const artists = App.artists.filter(a => a.name.toLowerCase().includes(q)).slice(0, 4);
    const albums = App.albums.filter(a => a.name.toLowerCase().includes(q)).slice(0, 4);
    let html = '';
    if (artists.length) html += `<div class="sr-label">Artists</div>` + artists.map(a => `
      <div class="song-row" data-action="search-artist" data-artist="${esc(a.name)}" style="cursor:default">
        <div class="idx"></div><div class="artist-pic" style="width:42px;height:42px;background-image:url('${a.art}')"></div>
        <div><div class="s-title">${esc(a.name)}</div><div class="s-sub">${a.songIds.length} songs</div></div>
      </div>`).join('');
    if (albums.length) html += `<div class="sr-label">Albums</div>` + albums.map(a => `
      <div class="song-row" data-action="search-album" data-album="${esc(a.key)}" style="cursor:default">
        <div class="idx"></div><div class="thumb" style="background-image:url('${a.art}')"></div>
        <div><div class="s-title">${esc(a.name)}</div><div class="s-sub">${esc(a.artist)} · ${a.year}</div></div>
      </div>`).join('');
    if (songs.length) html += `<div class="sr-label">Songs</div>` + songs.map(s => this.songRow(s, 0, { number: false })).join('');
    box.innerHTML = html || '<div class="empty" style="padding:30px">No results</div>';
  },

  /* ---------- context menu ---------- */
  songMenu(song, x, y) {
    closeMenu();
    const loved = App.loved.has(song.id);
    const pls = App.playlists.map(p => `<button class="ctx-item" data-action="add-to-pl" data-pl="${p.id}" data-song="${song.id}">${ico('playlist')} Add to ${esc(p.name)}</button>`).join('');
    const el = document.createElement('div');
    el.className = 'ctx-menu';
    el.id = 'ctx-menu';
    el.style.left = Math.min(x, innerWidth - 210) + 'px';
    el.style.top = Math.min(y, innerHeight - 260) + 'px';
    el.innerHTML = `
      <button class="ctx-item" data-action="ctx-play" data-song="${song.id}">${ico('play')} Play now</button>
      <button class="ctx-item" data-action="ctx-next" data-song="${song.id}">${ico('skip')} Play next</button>
      <button class="ctx-item" data-action="ctx-queue" data-song="${song.id}">${ico('queue')} Add to queue</button>
      <button class="ctx-item" data-action="love" data-song="${song.id}">${ico('heart')} ${loved ? 'Unlove' : 'Love'}</button>
      ${pls}
      <button class="ctx-item" data-action="new-playlist-with" data-song="${song.id}">${ico('plus')} New playlist from song</button>`;
    document.body.appendChild(el);
    document.getElementById('menu-overlay').classList.add('open');
  },

  renderIfCurrent(song) {
    const cur = Player.current();
    if (cur && cur.id === song.id) this.updatePlayerBar();
  },

  updatePlayerBar() {
    const cur = Player.current();
    const art = document.getElementById('pb-art');
    const title = document.getElementById('pb-title');
    const artist = document.getElementById('pb-artist');
    if (cur) {
      art.style.backgroundImage = `url('${cur.art}')`;
      title.textContent = cur.title;
      artist.textContent = `${cur.artist} · ${cur.album}`;
    }
    document.getElementById('pb-play-ico').innerHTML = ico(Player.isPlaying() ? 'pause' : 'play');
    document.getElementById('pb-play').classList.toggle('playing', Player.isPlaying());
    document.getElementById('pb-shuffle').classList.toggle('active', Player.shuffle);
    const rbtn = document.getElementById('pb-repeat');
    rbtn.classList.toggle('active', Player.repeat !== 'off');
    rbtn.innerHTML = ico(Player.repeat === 'one' ? 'repeat1' : 'repeat');
    document.getElementById('pb-love').classList.toggle('on', cur && App.loved.has(cur.id));
    const eq = document.getElementById('pb-eq');
    if (eq) eq.className = `pb-eq ${Player.isPlaying() ? 'live' : 'idle'}`;
    const vol = document.getElementById('pb-mute');
    vol.innerHTML = ico(Player.audio && (Player.audio.muted || Player.audio.volume === 0) ? 'mute' : 'volume');
  },

  updateTime() {
    const a = Player.audio;
    document.getElementById('pb-cur').textContent = fmtTime(a.currentTime);
    document.getElementById('pb-dur').textContent = fmtTime(a.duration);
    const cur = Player.current();
    const nowRow = document.querySelector(`.song-row[data-song="${cur ? cur.id : ''}"] .idx`);
    document.querySelectorAll('.song-row').forEach(r => {
      const isCur = cur && r.dataset.song === cur.id;
      r.classList.toggle('playing', isCur);
      const idx = r.querySelector('.idx');
      if (idx && isCur && !idx.querySelector('.q-eq')) {
        const i = r.dataset.i;
        idx.innerHTML = '<span class="q-eq"><i></i><i></i><i></i></span>';
      }
    });
  },

  reRenderCurrentView() {
    this.render();
  },
};

function closeMenu() {
  document.getElementById('ctx-menu')?.remove();
  document.getElementById('menu-overlay').classList.remove('open');
}
