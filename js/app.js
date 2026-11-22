// App state + boot + wiring
const App = {
  songs: [], albums: [], artists: [], genres: [],
  loved: new Set(),
  playlists: [],
  history: [],
  goalMin: 30,
  pendingSong: null, // song behind a menu action

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

    document.getElementById('lib-count-label').textContent = 'Demo library';
    document.getElementById('lib-count-sub').textContent = `${this.songs.length} songs · ${this.albums.length} albums`;

    this.wirePlayerBar();
    this.wireGlobalUI();
    this.wireKeyboard();
    this.wireViewEvents();

    Player.on('change', () => { UI.updatePlayerBar(); UI.renderQueue(); UI.reRenderCurrentView(); });
    Player.on('state', () => { UI.updatePlayerBar(); UI.reRenderCurrentView(); });
    Player.on('time', () => UI.updateTime());
    Player.on('queue', () => UI.renderQueue());

    UI.updatePlayerBar();
    UI.render();
    UI.renderQueue();

    route();
    FX.init();
  },

  /* ---------- player bar ---------- */
  wirePlayerBar() {
    const $ = id => document.getElementById(id);
    $('pb-play').onclick = () => Player.toggle();
    $('pb-next').onclick = () => Player.next();
    $('pb-prev').onclick = () => Player.prev();
    $('pb-shuffle').onclick = () => Player.toggleShuffle();
    $('pb-repeat').onclick = () => Player.cycleRepeat();
    $('pb-love').onclick = () => {
      const c = Player.current();
      if (!c) return;
      toggleLove(c.id);
      if (App.loved.has(c.id)) {
        const r = $('pb-love').getBoundingClientRect();
        FX.sparks(r.left + r.width / 2, r.top);
      }
    };
    $('pb-vol').oninput = e => Player.setVolume(e.target.value / 100);
    $('pb-mute').onclick = () => Player.toggleMute();
  },

  /* ---------- topbar / overlays ---------- */
  wireGlobalUI() {
    document.getElementById('btn-queue').onclick = () => {
      document.getElementById('queue-panel').classList.toggle('open');
    };
    document.getElementById('queue-close').onclick = () => {
      document.getElementById('queue-panel').classList.remove('open');
    };
    document.getElementById('search-open').onclick = () => openSearch();
    document.getElementById('menu-overlay').onclick = () => closeMenu();
    document.getElementById('search-overlay').onclick = e => {
      if (e.target.id === 'search-overlay') closeSearch();
    };
    const si = document.getElementById('search-input');
    si.addEventListener('input', () => UI.renderSearch(si.value));
    si.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#search-results .song-row[data-song]');
        if (first) { playSongById(first.dataset.song); closeSearch(); }
      }
      if (e.key === 'Escape') closeSearch();
    });
    document.getElementById('btn-pick-folder').onclick = () =>
      toast('Demo mode — folder scanning arrives in the next milestone');
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
        case 'Escape': closeSearch(); closeMenu(); break;
      }
    });
  },

  /* ---------- view event delegation ---------- */
  wireViewEvents() {
    const view = document.getElementById('view');

    view.addEventListener('click', e => {
      const loveBtn = e.target.closest('[data-action="love"]');
      const menuBtn = e.target.closest('[data-action="menu"]');
      const actionEl = e.target.closest('[data-action]');
      const songRow = e.target.closest('.song-row[data-song]');
      const albumCard = e.target.closest('.album-card[data-album]');
      const artistCard = e.target.closest('.artist-card[data-artist]');

      // dedicated buttons first
      if (menuBtn) {
        e.stopPropagation();
        App.pendingSong = App.songs.find(s => s.id === menuBtn.dataset.song);
        UI.songMenu(App.pendingSong, e.clientX, e.clientY);
        return;
      }
      if (loveBtn) {
        e.stopPropagation();
        toggleLove(loveBtn.dataset.song);
        if (App.loved.has(loveBtn.dataset.song)) FX.sparks(e.clientX, e.clientY);
        return;
      }
      if (actionEl) { handleAction(actionEl, e); return; }

      // rows / cards
      if (albumCard) {
        const a = App.albums.find(x => x.key === albumCard.dataset.album);
        if (a) { Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0); }
        return;
      }
      if (artistCard) {
        const a = App.artists.find(x => x.name === artistCard.dataset.artist);
        if (a) Player.playQueue(App.songs.filter(s => a.songIds.includes(s.id)), 0);
        return;
      }
      if (songRow) {
        playSongById(songRow.dataset.song);
        return;
      }
    });

    view.addEventListener('dblclick', e => {
      const row = e.target.closest('.song-row[data-song]');
      if (row && !e.target.closest('[data-action]')) playSongById(row.dataset.song);
    });

    // context menu on right click for songs
    view.addEventListener('contextmenu', e => {
      const row = e.target.closest('.song-row[data-song]');
      if (row) {
        e.preventDefault();
        UI.songMenu(App.songs.find(s => s.id === row.dataset.song), e.clientX, e.clientY);
      }
    });

    // goal input
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
  // if this song is already in the queue, jump; else start a fresh queue from the whole list
  const qi = Player.queue.findIndex(s => s.id === id);
  if (qi >= 0) Player.jumpTo(qi);
  else Player.playQueue(App.songs, i);
}

function toggleLove(id) {
  if (App.loved.has(id)) { App.loved.delete(id); toast('Removed from Loved'); }
  else { App.loved.add(id); toast('Added to Loved'); }
  UI.updatePlayerBar();
  UI.reRenderCurrentView();
}

function toggleTheme() {
  toast('No light mode. Ever.');
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
    case 'chart-mode': UI.chartMode = el.dataset.mode; UI.reRenderCurrentView(); break;
    case 'lib-tab': UI.libTab = el.dataset.tab; UI.reRenderCurrentView(); break;
    case 'lib-genre': UI.libGenre = el.dataset.genre; UI.reRenderCurrentView(); break;
    case 'lib-sort': UI.libSort = UI.libSort === 'az' ? 'newest' : 'az'; UI.reRenderCurrentView(); break;
    case 'stats-tab': UI.statsTab = el.dataset.tab; UI.reRenderCurrentView(); break;
    case 'play-something': {
      const start = Math.floor(Math.random() * App.songs.length);
      Player.playQueue(App.songs, start);
      break;
    }
    case 'shuffle-loved': {
      const loved = App.songs.filter(s => App.loved.has(s.id));
      if (!loved.length) return toast('No loved songs yet');
      Player.playQueue(loved, Math.floor(Math.random() * loved.length));
      if (!Player.shuffle) Player.toggleShuffle();
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
      const name = prompt('Playlist name');
      if (name && name.trim()) {
        App.playlists.push({ id: 'p' + Date.now(), name: name.trim(), songIds: [] });
        UI.reRenderCurrentView();
        toast(`Playlist "${name.trim()}" created`);
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
      if (UI.currentView.startsWith('playlist/')) location.hash = '#/playlists';
      UI.reRenderCurrentView();
      toast('Playlist deleted');
      break;
    }
    case 'add-to-pl': {
      if (pl && song && !pl.songIds.includes(song.id)) {
        pl.songIds.push(song.id);
        toast(`Added to ${pl.name}`);
        if (UI.currentView.startsWith('playlist/')) UI.reRenderCurrentView();
      }
      closeMenu();
      break;
    }
    case 'new-playlist-with': {
      const name = prompt('Playlist name');
      if (name && name.trim()) {
        App.playlists.push({ id: 'p' + Date.now(), name: name.trim(), songIds: song ? [song.id] : [] });
        UI.reRenderCurrentView();
        toast(`Playlist "${name.trim()}" created`);
      }
      closeMenu();
      break;
    }
    case 'ctx-play': if (song) playSongById(song.id); closeMenu(); break;
    case 'ctx-next': if (song) { Player.playNext(song); } closeMenu(); break;
    case 'ctx-queue': if (song) { Player.addToQueue(song); } closeMenu(); break;
    case 'q-jump': Player.jumpTo(+el.dataset.i); break;
    case 'q-remove': Player.removeFromQueue(+el.dataset.i); break;
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
    case 'toggle-theme': toggleTheme(); break;
    case 'reset-demo': location.reload(); break;
    case 'clear-history': App.history = []; UI.reRenderCurrentView(); toast('History cleared'); break;
  }
}

/* ---------- routing ---------- */
function route() {
  const h = location.hash.replace(/^#\//, '') || 'home';
  UI.currentView = h;
  if (h.startsWith('playlist/')) UI.renderPlaylistRoute(h);
  else UI.render();
}
UI.renderPlaylistRoute = function (h) {
  const id = h.split('/')[1];
  const el = document.getElementById('view');
  el.innerHTML = this.v_playlist(id);
  this.updateBreadcrumb(h);
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === 'playlists'));
};
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
App.init();
