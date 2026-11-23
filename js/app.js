// App state + boot + wiring — NOTHING AUDIO OS
const App = {
  songs: [], albums: [], artists: [], genres: [],
  loved: new Set(),
  playlists: [],
  history: [],
  goalMin: 30,
  pendingSong: null,
  routeMode: 'bit',
  switches: { glyphSync: true, crossfeed: false, mono: false },

  init() {
    const lib = buildLibrary();
    this.songs = lib.songs;
    this.albums = lib.albums;
    this.artists = lib.artists;
    this.genres = lib.genres;
    this.loved = new Set(DEMO_LOVED);
    this.playlists = DEMO_PLAYLISTS.map(p => ({ ...p, songIds: [...p.songIds] }));
    this.history = seedHistory();

    Player.init();

    this.wirePlayerBar();
    this.wireChassis();
    this.wireKeyboard();
    this.wireViewEvents();

    Player.on('change', () => { UI.updatePlayerBar(); UI.renderQueue(); UI.reRenderCurrentView(); FX.onTrackChange(Player.current()); });
    Player.on('state', () => { UI.updatePlayerBar(); UI.updateSidebar(); if (UI.currentView === 'deck') UI.reRenderCurrentView(); });
    Player.on('time', () => UI.updateTime());
    Player.on('queue', () => UI.renderQueue());

    UI.updatePlayerBar();
    UI.updateSidebar();
    UI.render();
    UI.renderQueue();

    route();
    FX.init();
    FX.onTrackChange(Player.current());
  },

  /* ---------- footer player chassis ---------- */
  wirePlayerBar() {
    const $ = id => document.getElementById(id);
    $('pb-play').onclick = () => Player.toggle();
    $('pb-next').onclick = () => Player.next();
    $('pb-prev').onclick = () => Player.prev();
    $('pb-shuffle').onclick = () => Player.toggleShuffle();
    $('pb-repeat').onclick = () => Player.cycleRepeat();
    $('pb-love').onclick = () => { const c = Player.current(); if (c) toggleLove(c.id); };
    $('pb-vol').oninput = e => this.setAttenuation(e.target.value);
    $('pb-mute').onclick = () => { Player.toggleMute(); UI.updatePlayerBar(); };
    $('btn-stereo').onclick = () => this.setMono(false);
    $('btn-mono').onclick = () => this.setMono(true);
  },

  setAttenuation(v100) {
    Player.setVolume(v100 / 100);
    const db = v100 == 0 ? '-∞ dB' : (20 * Math.log10(v100 / 100)).toFixed(1) + ' dB';
    document.getElementById('pb-att').textContent = db;
    const mute = document.getElementById('pb-mute');
    mute.classList.toggle('muted', v100 == 0);
  },

  setMono(on) {
    FX.setMono(on);
    document.getElementById('btn-stereo').classList.toggle('active', !on);
    document.getElementById('btn-mono').classList.toggle('active', on);
    toast(on ? 'MONO DOWNMIX ENGAGED' : 'STEREO OUTPUT RESTORED');
    UI.reRenderCurrentView();
  },

  /* ---------- top chassis + sidebar ---------- */
  wireChassis() {
    document.querySelectorAll('#route-toggle button').forEach(b => {
      b.onclick = () => {
        App.routeMode = b.dataset.route;
        document.querySelectorAll('#route-toggle button').forEach(x => x.classList.toggle('active', x === b));
        const dac = document.getElementById('dac-text');
        dac.textContent = { bit: 'DIRECT DSD / BIT-PERFECT 192K', os: 'OVERSAMPLED 4X / 768K', dsd: 'DSD 5.6MHZ NATIVE' }[App.routeMode];
        document.getElementById('out-name').textContent = { bit: 'NOTHING EAR (2) [LHDC 5.0]', os: 'MONITOR OUT [XLR BALANCED]', dsd: 'DSD DIRECT [S/PDIF]' }[App.routeMode];
        toast('ROUTE: ' + b.textContent.trim());
      };
    });

    document.getElementById('sw-glyph').onclick = () => this.toggleSwitch('glyphSync');
    document.getElementById('sw-crossfeed').onclick = () => this.toggleSwitch('crossfeed');
    document.getElementById('sb-search').onclick = () => openSearch();
    document.getElementById('btn-queue').onclick = () => document.getElementById('queue-panel').classList.toggle('open');
    document.getElementById('queue-close').onclick = () => document.getElementById('queue-panel').classList.remove('open');
    document.getElementById('search-close').onclick = () => closeSearch();
    document.getElementById('menu-overlay').onclick = () => closeMenu();
    document.getElementById('search-overlay').onclick = e => { if (e.target.id === 'search-overlay') closeSearch(); };

    const si = document.getElementById('search-input');
    si.addEventListener('input', () => UI.renderSearch(si.value));
    si.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#search-results .sr-row[data-song]');
        if (first) { playSongById(first.dataset.song); closeSearch(); }
      }
      if (e.key === 'Escape') closeSearch();
    });

    // immersion controls
    document.getElementById('imm-exit').onclick = () => FX.closeImmersion();
    document.getElementById('imm-play').onclick = () => Player.toggle();
    document.getElementById('imm-prev').onclick = () => Player.prev();
    document.getElementById('imm-next').onclick = () => Player.next();
    document.getElementById('imm-shuffle').onclick = () => Player.toggleShuffle();
    document.getElementById('imm-repeat').onclick = () => Player.cycleRepeat();
    document.getElementById('imm-mode').onclick = () => this.toggleSwitch('glyphSync');
  },

  toggleSwitch(key) {
    const sw = App.switches;
    sw[key] = !sw[key];
    const btn = document.getElementById('sw-' + key);
    if (btn) { btn.classList.toggle('on', sw[key]); btn.dataset.on = sw[key]; }
    if (key === 'glyphSync') {
      document.getElementById('sw-glyph-status').innerHTML = sw.glyphSync
        ? '<i class="ping-dot"></i>ACTIVE' : '<i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#444"></i>BYPASSED';
      toast(sw.glyphSync ? 'GLYPH SOUNDWIRE: 1:1 SYNC' : 'GLYPH SOUNDWIRE BYPASSED');
    }
    if (key === 'crossfeed') { FX.setCrossfeed(sw.crossfeed); toast(sw.crossfeed ? 'CROSSFEED DSP ENGAGED' : 'CROSSFEED DSP BYPASSED'); }
    UI.reRenderCurrentView();
  },

  /* ---------- keyboard ---------- */
  wireKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
      switch (e.code) {
        case 'Space': e.preventDefault(); Player.toggle(); break;
        case 'ArrowRight':
          if (e.shiftKey) Player.next();
          else Player.audio.currentTime = Math.min(Player.audio.duration || 0, Player.audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey) Player.prev();
          else Player.audio.currentTime = Math.max(0, Player.audio.currentTime - 5);
          break;
        case 'KeyQ': document.getElementById('queue-panel').classList.toggle('open'); break;
        case 'Escape':
          if (FX.immersionOpen) FX.closeImmersion();
          closeSearch(); closeMenu();
          document.getElementById('queue-panel').classList.remove('open');
          break;
      }
    });
  },

  /* ---------- view event delegation ---------- */
  wireViewEvents() {
    const view = document.getElementById('view');

    view.addEventListener('click', e => {
      const actionEl = e.target.closest('[data-action]');
      const songRow = e.target.closest('tr[data-song]');
      const albumCard = e.target.closest('.album-card[data-album]');
      const artistCard = e.target.closest('.artist-card[data-artist]');

      // deck transport buttons
      const tmap = { 't-prev': () => Player.prev(), 't-next': () => Player.next(), 't-pp': () => Player.toggle() };
      const tid = e.target.closest('#t-prev, #t-next, #t-pp')?.id;
      if (tid) { tmap[tid](); return; }
      if (e.target.closest('#t-stop')) {
        Player.audio.pause();
        Player.audio.currentTime = 0;
        toast('TRANSPORT: STOP');
        return;
      }

      if (actionEl) { handleAction(actionEl, e); return; }
      if (albumCard) {
        const a = App.albums.find(x => x.key === albumCard.dataset.album);
        if (a && !e.target.closest('.play-fab')) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
        return;
      }
      if (artistCard) {
        const a = App.artists.find(x => x.name === artistCard.dataset.artist);
        if (a) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
        return;
      }
      if (songRow && !e.target.closest('[data-action]')) playSongById(songRow.dataset.song);
    });

    view.addEventListener('contextmenu', e => {
      const row = e.target.closest('tr[data-song]');
      if (row) {
        e.preventDefault();
        App.pendingSong = App.songs.find(s => s.id === row.dataset.song);
        UI.songMenu(App.pendingSong, e.clientX, e.clientY);
      }
    });

    view.addEventListener('change', e => {
      if (e.target.id === 'goal-input') {
        App.goalMin = Math.max(5, Math.min(480, +e.target.value || 30));
        toast(`Daily goal set to ${App.goalMin} min`);
      }
    });
  },
};

/* ---------- shared actions ---------- */
function playSongById(id) {
  const i = App.songs.findIndex(s => s.id === id);
  if (i < 0) return;
  const qi = Player.queue.findIndex(s => s.id === id);
  if (qi >= 0) Player.jumpTo(qi);
  else Player.playQueue(App.songs, i);
}

function toggleLove(id) {
  if (App.loved.has(id)) { App.loved.delete(id); toast('REMOVED FROM LOVED'); }
  else { App.loved.add(id); toast('ADDED TO LOVED'); }
  UI.updatePlayerBar();
  UI.reRenderCurrentView();
}

function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  UI.renderSearch('');
  setTimeout(() => document.getElementById('search-input').focus(), 30);
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-input').value = '';
}

function handleAction(el, e) {
  const action = el.dataset.action;
  const song = el.dataset.song ? App.songs.find(s => s.id === el.dataset.song) : null;
  const plId = el.dataset.pl;
  const pl = plId ? App.playlists.find(p => p.id === plId) : null;

  switch (action) {
    case 'open-search': openSearch(); break;
    case 'open-immersion': FX.openImmersion(); break;
    case 'toggle-queue': document.getElementById('queue-panel').classList.toggle('open'); break;
    case 'log-filter': UI.logFilter = el.dataset.f; UI.reRenderCurrentView(); break;
    case 'chart-mode': UI.chartMode = el.dataset.mode; UI.reRenderCurrentView(); break;
    case 'lib-tab': UI.libTab = el.dataset.tab; UI.reRenderCurrentView(); break;
    case 'lib-genre': UI.libGenre = el.dataset.genre; UI.reRenderCurrentView(); break;
    case 'lib-sort': UI.libSort = UI.libSort === 'az' ? 'newest' : 'az'; UI.reRenderCurrentView(); break;
    case 'stats-tab': UI.statsTab = el.dataset.tab; UI.reRenderCurrentView(); break;
    case 'sw': App.toggleSwitch(el.dataset.sw); break;
    case 'shuffle-loved': {
      const loved = App.songs.filter(s => App.loved.has(s.id));
      if (!loved.length) return toast('NO LOVED SONGS YET');
      Player.playQueue(loved, Math.floor(Math.random() * loved.length));
      if (!Player.shuffle) Player.toggleShuffle();
      break;
    }
    case 'play-hires': {
      const hires = App.songs.filter(s => s.hires);
      if (hires.length) Player.playQueue(hires, 0);
      break;
    }
    case 'play-album': {
      const a = App.albums.find(x => x.key === el.dataset.album);
      if (a) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
      break;
    }
    case 'play-artist': {
      const a = App.artists.find(x => x.name === el.dataset.artist);
      if (a) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
      break;
    }
    case 'open-playlist': location.hash = `#/playlist/${plId}`; break;
    case 'play-pl': if (pl) Player.playQueue(pl.songIds.map(id => App.songs.find(s => s.id === id)).filter(Boolean), 0); break;
    case 'new-playlist': {
      const name = prompt('Reel name');
      if (name && name.trim()) {
        App.playlists.push({ id: 'p' + Date.now(), name: name.trim(), songIds: [] });
        UI.reRenderCurrentView();
        toast(`REEL "${name.trim().toUpperCase()}" CREATED`);
      }
      break;
    }
    case 'rename-pl': {
      const name = prompt('New name', pl.name);
      if (name && name.trim()) { pl.name = name.trim(); UI.reRenderCurrentView(); }
      break;
    }
    case 'delete-pl': {
      App.playlists = App.playlists.filter(p => p.id !== plId);
      if (UI.currentView.startsWith('playlist/')) location.hash = '#/stash';
      UI.reRenderCurrentView();
      toast('REEL ERASED');
      break;
    }
    case 'add-to-pl': {
      if (pl && song && !pl.songIds.includes(song.id)) {
        pl.songIds.push(song.id);
        toast(`ADDED TO ${pl.name.toUpperCase()}`);
        UI.updateSidebar();
        if (UI.currentView.startsWith('playlist/')) UI.reRenderCurrentView();
      }
      closeMenu();
      break;
    }
    case 'new-playlist-with': {
      const name = prompt('Reel name');
      if (name && name.trim()) {
        App.playlists.push({ id: 'p' + Date.now(), name: name.trim(), songIds: song ? [song.id] : [] });
        UI.reRenderCurrentView();
        UI.updateSidebar();
        toast(`REEL "${name.trim().toUpperCase()}" CREATED`);
      }
      closeMenu();
      break;
    }
    case 'ctx-play': if (song) playSongById(song.id); closeMenu(); break;
    case 'ctx-next': if (song) Player.playNext(song); closeMenu(); break;
    case 'ctx-queue': if (song) Player.addToQueue(song); closeMenu(); break;
    case 'love': if (song) { toggleLove(song.id); closeMenu(); } break;
    case 'reset-demo': location.reload(); break;
    case 'clear-history': App.history = []; UI.reRenderCurrentView(); toast('PLAY HISTORY ERASED'); break;
    case 'search-artist': {
      closeSearch();
      UI.libTab = 'artists'; UI.currentView = 'library';
      UI.reRenderCurrentView();
      break;
    }
    case 'search-album': {
      closeSearch();
      const a = App.albums.find(x => x.key === el.dataset.album);
      if (a) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
      break;
    }
  }
}

/* ---------- routing ---------- */
function route() {
  const h = location.hash.replace(/^#\//, '') || 'deck';
  UI.currentView = h;
  if (h.startsWith('playlist/')) {
    const id = h.split('/')[1];
    document.getElementById('view').innerHTML = UI.v_playlist(id);
    UI.updateBreadcrumb(h);
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === 'stash'));
    FX.onTrackChange(Player.current());
  } else {
    UI.render();
  }
}
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
App.init();
