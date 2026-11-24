import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChassisHeader, PlayerBar, Sidebar } from './components/Shell.jsx';
import { BootScreen, ContextMenu, ImmersionOverlay, QueuePanel, SearchOverlay, Toasts } from './components/Overlays.jsx';
import { buildLibrary, DEMO_LOVED, DEMO_PLAYLISTS, seedHistory } from './data/demoData.js';
import { useAudioFX } from './hooks/useAudioFX.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { usePlayer } from './hooks/usePlayer.js';
import { DeckView, HelpView, HiresView, LibraryView, PlaylistView, SettingsView, StashView, StatsView } from './views/Views.jsx';

export default function App() {
  const library = useMemo(() => buildLibrary(), []);
  const { songs, albums, artists, genres } = library;
  const route = useHashRoute();
  const [loved, setLoved] = useState(() => new Set(DEMO_LOVED));
  const [playlists, setPlaylists] = useState(() => DEMO_PLAYLISTS.map((playlist) => ({ ...playlist, songIds: [...playlist.songIds] })));
  const [history, setHistory] = useState(seedHistory);
  const [goalMin, setGoalMin] = useState(30);
  const [switches, setSwitches] = useState({ glyphSync: true, crossfeed: false, mono: false });
  const [logFilter, setLogFilter] = useState('all');
  const [libTab, setLibTab] = useState('songs');
  const [libGenre, setLibGenre] = useState('All');
  const [libSort, setLibSort] = useState('newest');
  const [statsTab, setStatsTab] = useState('overview');
  const [chartMode, setChartMode] = useState('7d');
  const [queueOpen, setQueueOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [immersionOpen, setImmersionOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const playIdRef = useRef(0);
  const toastTimersRef = useRef(new Set());

  const toast = useCallback((message) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
      toastTimersRef.current.delete(timer);
    }, 2400);
    toastTimersRef.current.add(timer);
  }, []);

  useEffect(() => () => {
    toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const recordPlay = useCallback((song) => {
    const id = `play-${Date.now()}-${++playIdRef.current}`;
    setHistory((current) => [...current, { id, songId: song.id, ts: Date.now(), ms: 0 }]);
    return id;
  }, []);

  const recordListen = useCallback((id, milliseconds) => {
    setHistory((current) => current.map((entry) => (
      entry.id === id ? { ...entry, ms: (entry.ms || 0) + milliseconds } : entry
    )));
  }, []);

  const player = usePlayer({ songs, onTrackStart: recordPlay, onListen: recordListen });
  useAudioFX({
    audio: player.audio,
    isPlaying: player.isPlaying,
    glyphSync: switches.glyphSync,
    mono: switches.mono,
    crossfeed: switches.crossfeed,
    immersionOpen,
  });

  const playSong = useCallback((song) => {
    const queueIndex = player.queue.findIndex((item) => item.id === song.id);
    if (queueIndex >= 0) player.jumpTo(queueIndex);
    else player.playQueue(songs, songs.findIndex((item) => item.id === song.id));
  }, [player.queue, player.jumpTo, player.playQueue, songs]);

  const playAlbum = useCallback((album) => {
    player.playQueue(songs.filter((song) => album.songIds.includes(song.id)), 0);
  }, [player.playQueue, songs]);

  const playArtist = useCallback((artist) => {
    player.playQueue(songs.filter((song) => artist.songIds.includes(song.id)), 0);
  }, [player.playQueue, songs]);

  const playPlaylist = useCallback((playlist) => {
    player.playQueue(playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean), 0);
  }, [player.playQueue, songs]);

  const playHires = useCallback(() => {
    const hiresSongs = songs.filter((song) => song.hires);
    if (hiresSongs.length) player.playQueue(hiresSongs, 0);
  }, [player.playQueue, songs]);

  const shuffleLoved = useCallback(() => {
    const lovedSongs = songs.filter((song) => loved.has(song.id));
    if (!lovedSongs.length) {
      toast('NO LOVED SONGS YET');
      return;
    }
    player.playQueue(lovedSongs, Math.floor(Math.random() * lovedSongs.length));
    if (!player.shuffle) player.toggleShuffle(toast);
  }, [loved, player.playQueue, player.shuffle, player.toggleShuffle, songs, toast]);

  const toggleLove = useCallback((id) => {
    const willLove = !loved.has(id);
    setLoved((current) => {
      const next = new Set(current);
      if (willLove) next.add(id);
      else next.delete(id);
      return next;
    });
    toast(willLove ? 'ADDED TO LOVED' : 'REMOVED FROM LOVED');
  }, [loved, toast]);

  const updateSwitch = useCallback((key, value) => {
    setSwitches((current) => ({ ...current, [key]: value }));
    if (key === 'glyphSync') toast(value ? 'GLYPH SOUNDWIRE: 1:1 SYNC' : 'GLYPH SOUNDWIRE BYPASSED');
    if (key === 'crossfeed') toast(value ? 'CROSSFEED DSP ENGAGED' : 'CROSSFEED DSP BYPASSED');
    if (key === 'mono') toast(value ? 'MONO DOWNMIX ENGAGED' : 'STEREO OUTPUT RESTORED');
  }, [toast]);

  const openSearch = useCallback(() => {
    setSearchQuery('');
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);
  const closeQueue = useCallback(() => setQueueOpen(false), []);
  const closeImmersion = useCallback(() => setImmersionOpen(false), []);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextMenu = useCallback((song, event) => {
    event.preventDefault();
    setContextMenu({ song, x: event.clientX, y: event.clientY });
  }, []);

  const newPlaylist = useCallback(() => {
    const name = window.prompt('Reel name');
    if (!name?.trim()) return;
    const playlist = { id: `p${Date.now()}`, name: name.trim(), songIds: [] };
    setPlaylists((current) => [...current, playlist]);
    toast(`REEL "${playlist.name.toUpperCase()}" CREATED`);
  }, [toast]);

  const newPlaylistWith = useCallback((song) => {
    const name = window.prompt('Reel name');
    if (!name?.trim()) return;
    const playlist = { id: `p${Date.now()}`, name: name.trim(), songIds: song ? [song.id] : [] };
    setPlaylists((current) => [...current, playlist]);
    toast(`REEL "${playlist.name.toUpperCase()}" CREATED`);
  }, [toast]);

  const renamePlaylist = useCallback((playlist) => {
    const name = window.prompt('New name', playlist.name);
    if (!name?.trim()) return;
    setPlaylists((current) => current.map((item) => item.id === playlist.id ? { ...item, name: name.trim() } : item));
  }, []);

  const deletePlaylist = useCallback((playlist) => {
    setPlaylists((current) => current.filter((item) => item.id !== playlist.id));
    if (route.startsWith('playlist/')) window.location.hash = '#/stash';
    toast('REEL ERASED');
  }, [route, toast]);

  const addToPlaylist = useCallback((playlist, song) => {
    if (playlist.songIds.includes(song.id)) return;
    setPlaylists((current) => current.map((item) => item.id === playlist.id ? { ...item, songIds: [...item.songIds, song.id] } : item));
    toast(`ADDED TO ${playlist.name.toUpperCase()}`);
  }, [toast]);

  const openPlaylist = useCallback((id) => {
    window.location.hash = `#/playlist/${id}`;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast('PLAY HISTORY ERASED');
  }, [toast]);

  const searchArtist = useCallback((artist) => {
    closeSearch();
    setLibTab('artists');
    window.location.hash = '#/library';
    toast(`${artist.name.toUpperCase()} // PERFORMER ARCHIVE`);
  }, [closeSearch, toast]);

  const searchAlbum = useCallback((album) => {
    closeSearch();
    playAlbum(album);
  }, [closeSearch, playAlbum]);

  const playSongFromSearch = useCallback((song) => {
    closeSearch();
    playSong(song);
  }, [closeSearch, playSong]);

  const handleStop = useCallback(() => {
    player.stop();
    toast('TRANSPORT: STOP');
  }, [player.stop, toast]);

  const handleToggleShuffle = useCallback(() => player.toggleShuffle(toast), [player.toggleShuffle, toast]);
  const handleCycleRepeat = useCallback(() => player.cycleRepeat(toast), [player.cycleRepeat, toast]);
  const handleLove = useCallback(() => {
    if (player.current) toggleLove(player.current.id);
  }, [player.current, toggleLove]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
        return;
      }

      const target = event.target;
      const isTyping = target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]');
      if (isTyping) return;
      const isInteractive = target instanceof HTMLElement && target.closest('button, a, [role="button"], [role="slider"]');

      if (event.code === 'Space' && !isInteractive) {
        event.preventDefault();
        player.toggle();
      } else if (event.code === 'ArrowRight') {
        if (event.shiftKey) player.next();
        else player.seekBy(5);
      } else if (event.code === 'ArrowLeft') {
        if (event.shiftKey) player.previous();
        else player.seekBy(-5);
      } else if (event.code === 'KeyQ') {
        setQueueOpen((current) => !current);
      } else if (event.key === 'Escape') {
        setImmersionOpen(false);
        closeSearch();
        closeContextMenu();
        closeQueue();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeContextMenu, closeQueue, closeSearch, openSearch, player.next, player.previous, player.seekBy, player.toggle]);

  const routeSection = route.split('/')[0];
  const activeView = routeSection === 'playlist' ? 'stash' : routeSection;
  const currentPlaylist = routeSection === 'playlist' ? playlists.find((playlist) => playlist.id === route.split('/')[1]) : null;
  const currentLoved = Boolean(player.current && loved.has(player.current.id));

  let view;
  if (routeSection === 'deck') {
    view = (
      <DeckView
        songs={songs}
        currentSong={player.current}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        queueCount={player.queue.length}
        logFilter={logFilter}
        mono={switches.mono}
        onFilter={setLogFilter}
        onPlay={playSong}
        onContextMenu={handleContextMenu}
        onToggle={player.toggle}
        onStop={handleStop}
        onNext={() => player.next()}
        onPrevious={player.previous}
        onToggleQueue={() => setQueueOpen(true)}
        onOpenImmersion={() => setImmersionOpen(true)}
        onSeek={player.seekTo}
      />
    );
  } else if (routeSection === 'library') {
    view = (
      <LibraryView
        songs={songs}
        albums={albums}
        artists={artists}
        genres={genres}
        currentSong={player.current}
        tab={libTab}
        genre={libGenre}
        sort={libSort}
        onTab={setLibTab}
        onGenre={setLibGenre}
        onSort={() => setLibSort((current) => current === 'az' ? 'newest' : 'az')}
        onPlay={playSong}
        onContextMenu={handleContextMenu}
        onPlayAlbum={playAlbum}
        onPlayArtist={playArtist}
      />
    );
  } else if (routeSection === 'hires') {
    view = <HiresView songs={songs} currentSong={player.current} onPlayHires={playHires} onPlay={playSong} onContextMenu={handleContextMenu} />;
  } else if (routeSection === 'stash') {
    view = (
      <StashView
        songs={songs}
        playlists={playlists}
        loved={loved}
        currentSong={player.current}
        onNewPlaylist={newPlaylist}
        onOpenPlaylist={openPlaylist}
        onShuffleLoved={shuffleLoved}
        onPlay={playSong}
        onContextMenu={handleContextMenu}
      />
    );
  } else if (routeSection === 'playlist') {
    view = (
      <PlaylistView
        playlist={currentPlaylist}
        songs={songs}
        currentSong={player.current}
        onPlayPlaylist={playPlaylist}
        onRename={renamePlaylist}
        onDelete={deletePlaylist}
        onPlay={playSong}
        onContextMenu={handleContextMenu}
      />
    );
  } else if (routeSection === 'stats') {
    view = (
      <StatsView
        history={history}
        songs={songs}
        lovedCount={loved.size}
        playlistCount={playlists.length}
        goalMin={goalMin}
        tab={statsTab}
        chartMode={chartMode}
        onTab={setStatsTab}
        onChartMode={setChartMode}
        onGoalChange={setGoalMin}
      />
    );
  } else if (routeSection === 'settings') {
    view = <SettingsView switches={switches} onToggleSwitch={updateSwitch} onResetDemo={() => window.location.reload()} onClearHistory={clearHistory} />;
  } else if (routeSection === 'help') {
    view = <HelpView />;
  } else {
    view = <div className="empty">MODULE OFFLINE</div>;
  }

  return (
    <>
      <ChassisHeader outputName="NOTHING EAR (2) [LHDC 5.0]" />
      <div className="body">
        <Sidebar
          activeView={activeView}
          songCount={songs.length}
          playlistCount={playlists.length}
          lovedCount={loved.size}
          hiresCount={songs.filter((song) => song.hires).length}
          deckStatus={player.isPlaying ? 'PLAYING' : 'IDLE'}
          switches={switches}
          onToggleSwitch={updateSwitch}
          onOpenSearch={openSearch}
        />
        <main id="main"><div id="view">{view}</div></main>
      </div>
      <PlayerBar
        current={player.current}
        isPlaying={player.isPlaying}
        shuffle={player.shuffle}
        repeat={player.repeat}
        loved={currentLoved}
        muted={player.muted}
        mono={switches.mono}
        volume={player.volume}
        currentTime={player.currentTime}
        duration={player.duration}
        onToggle={player.toggle}
        onNext={() => player.next()}
        onPrevious={player.previous}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeat={handleCycleRepeat}
        onLove={handleLove}
        onVolume={player.setVolume}
        onMute={player.toggleMute}
        onMono={(value) => updateSwitch('mono', value)}
        onQueue={() => setQueueOpen((current) => !current)}
        onSeek={player.seekTo}
      />
      <QueuePanel
        open={queueOpen}
        queue={player.queue}
        qIndex={player.qIndex}
        currentSong={player.current}
        isPlaying={player.isPlaying}
        onClose={closeQueue}
        onJump={player.jumpTo}
        onRemove={player.removeFromQueue}
      />
      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        songs={songs}
        artists={artists}
        albums={albums}
        onQuery={setSearchQuery}
        onClose={closeSearch}
        onPlaySong={playSongFromSearch}
        onSearchArtist={searchArtist}
        onSearchAlbum={searchAlbum}
      />
      <ImmersionOverlay
        open={immersionOpen}
        songs={songs}
        currentSong={player.current}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        shuffle={player.shuffle}
        repeat={player.repeat}
        glyphSync={switches.glyphSync}
        onClose={closeImmersion}
        onToggle={player.toggle}
        onNext={() => player.next()}
        onPrevious={player.previous}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeat={handleCycleRepeat}
        onToggleGlyph={() => updateSwitch('glyphSync', !switches.glyphSync)}
        onSeek={player.seekTo}
      />
      <ContextMenu
        menu={contextMenu}
        playlists={playlists}
        loved={loved}
        onClose={closeContextMenu}
        onPlay={playSong}
        onPlayNext={(song) => player.playNext(song, toast)}
        onQueue={(song) => player.addToQueue(song, toast)}
        onToggleLove={toggleLove}
        onAddToPlaylist={addToPlaylist}
        onNewPlaylistWith={newPlaylistWith}
      />
      <Toasts messages={toasts} />
      <BootScreen />
    </>
  );
}
