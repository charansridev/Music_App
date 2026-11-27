import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { ChassisHeader, PlayerBar, Sidebar } from './components/Shell.jsx';
import { AddSongsModal, BootScreen, ContextMenu, QueuePanel, ReelModal, SearchOverlay, Toasts } from './components/Overlays.jsx';
import { buildDemoSongs, DEMO_LOVED, DEMO_PLAYLISTS, revokeDemoAudioUrls, seedDemoHistory } from './lib/demoLibrary.js';
import {
  clearSavedFolderHandle,
  indexLibrary,
  loadSavedFolderHandle,
  pickDirectoryHandle,
  revokeAllObjectUrls,
  saveFolderHandle,
  scanDirectoryHandle,
  scanFileList,
  supportsDirectoryPicker,
  verifyHandlePermission,
} from './lib/localLibrary.js';
import { SPRING_SMOOTH } from './lib/motion.js';
import { classNames } from './lib/utils.js';
import { useAudioFX } from './hooks/useAudioFX.js';
import { useAudioOutput } from './hooks/useAudioOutput.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { usePlayer } from './hooks/usePlayer.js';
import { DeckView, HelpView, LibraryView, PlaylistView, SettingsView, StashView, StatsView } from './views/Views.jsx';

const STORAGE_KEYS = {
  loved: 'nothing-audio:loved',
  playlists: 'nothing-audio:playlists',
  history: 'nothing-audio:history',
  goalMin: 'nothing-audio:goalMin',
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private-mode errors.
  }
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [savedHandle, setSavedHandle] = useState(null);
  const [reelModal, setReelModal] = useState(null);
  const [addSongsPlaylistId, setAddSongsPlaylistId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeHandleRef = useRef(null);
  const fallbackInputRef = useRef(null);

  const library = useMemo(() => indexLibrary(songs), [songs]);
  const { albums, artists, genres } = library;
  const route = useHashRoute();
  const [loved, setLoved] = useState(() => new Set(readStorage(STORAGE_KEYS.loved, [])));
  const [playlists, setPlaylists] = useState(() => readStorage(STORAGE_KEYS.playlists, []));
  const [history, setHistory] = useState(() => readStorage(STORAGE_KEYS.history, []));
  const [goalMin, setGoalMin] = useState(() => readStorage(STORAGE_KEYS.goalMin, 30));
  const [switches, setSwitches] = useState({ glyphSync: true, crossfeed: false, mono: false });
  const [libTab, setLibTab] = useState('songs');
  const [libGenre, setLibGenre] = useState('All');
  const [libSort, setLibSort] = useState('newest');
  const [statsTab, setStatsTab] = useState('overview');
  const [chartMode, setChartMode] = useState('7d');
  const [queueOpen, setQueueOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => { setMobileNavOpen(false); }, [route]);

  useEffect(() => { if (!isDemoMode) writeStorage(STORAGE_KEYS.loved, [...loved]); }, [isDemoMode, loved]);
  useEffect(() => { if (!isDemoMode) writeStorage(STORAGE_KEYS.playlists, playlists); }, [isDemoMode, playlists]);
  useEffect(() => { if (!isDemoMode) writeStorage(STORAGE_KEYS.history, history); }, [isDemoMode, history]);
  useEffect(() => { writeStorage(STORAGE_KEYS.goalMin, goalMin); }, [goalMin]);

  useEffect(() => {
    let cancelled = false;
    loadSavedFolderHandle().then((handle) => {
      if (!cancelled && handle) setSavedHandle(handle);
    });
    return () => {
      cancelled = true;
      revokeAllObjectUrls();
      revokeDemoAudioUrls();
    };
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

  const setContextSinkIdRef = useRef(null);
  const player = usePlayer({ songs, onTrackStart: recordPlay, onListen: recordListen });
  const output = useAudioOutput({ audio: player.audio, setContextSinkIdRef, onToast: toast });
  const audioFx = useAudioFX({
    audio: player.audio,
    isPlaying: player.isPlaying,
    glyphSync: switches.glyphSync,
    mono: switches.mono,
    crossfeed: switches.crossfeed,
    sinkId: output.selectedId,
  });
  setContextSinkIdRef.current = audioFx.setSinkId;

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
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextMenu = useCallback((song, event) => {
    event.preventDefault();
    setContextMenu({ song, x: event.clientX, y: event.clientY });
  }, []);

  const newPlaylist = useCallback(() => {
    setReelModal({ mode: 'create' });
  }, []);

  const newPlaylistWith = useCallback((song) => {
    setReelModal({ mode: 'create', song });
  }, []);

  const renamePlaylist = useCallback((playlist) => {
    setReelModal({ mode: 'rename', playlist });
  }, []);

  const handleReelModalSubmit = useCallback((trimmedName) => {
    if (!reelModal) return;
    if (reelModal.mode === 'rename' && reelModal.playlist) {
      setPlaylists((current) => current.map((item) => (
        item.id === reelModal.playlist.id ? { ...item, name: trimmedName } : item
      )));
      toast(`REEL RENAMED TO "${trimmedName.toUpperCase()}"`);
      setReelModal(null);
      return;
    }

    const playlist = {
      id: `p${Date.now()}`,
      name: trimmedName,
      songIds: reelModal.song ? [reelModal.song.id] : [],
    };
    setPlaylists((current) => [...current, playlist]);
    toast(`REEL "${playlist.name.toUpperCase()}" CREATED`);
    const shouldOpen = !reelModal.song;
    setReelModal(null);
    if (shouldOpen) window.location.hash = `#/playlist/${playlist.id}`;
  }, [reelModal, toast]);

  const deletePlaylist = useCallback((playlist) => {
    setPlaylists((current) => current.filter((item) => item.id !== playlist.id));
    if (addSongsPlaylistId === playlist.id) setAddSongsPlaylistId(null);
    if (route.startsWith('playlist/')) window.location.hash = '#/stash';
    toast('REEL ERASED');
  }, [addSongsPlaylistId, route, toast]);

  const addToPlaylist = useCallback((playlist, song) => {
    if (playlist.songIds.includes(song.id)) return;
    setPlaylists((current) => current.map((item) => item.id === playlist.id ? { ...item, songIds: [...item.songIds, song.id] } : item));
    toast(`ADDED TO ${playlist.name.toUpperCase()}`);
  }, [toast]);

  const toggleSongInPlaylist = useCallback((playlistId, song) => {
    setPlaylists((current) => current.map((item) => {
      if (item.id !== playlistId) return item;
      const exists = item.songIds.includes(song.id);
      return {
        ...item,
        songIds: exists ? item.songIds.filter((id) => id !== song.id) : [...item.songIds, song.id],
      };
    }));
  }, []);

  const openPlaylist = useCallback((id) => {
    window.location.hash = `#/playlist/${id}`;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast('PLAY HISTORY ERASED');
  }, [toast]);

  const exitDemoState = useCallback(() => {
    if (!isDemoMode) return;
    setIsDemoMode(false);
    setLoved(new Set(readStorage(STORAGE_KEYS.loved, [])));
    setPlaylists(readStorage(STORAGE_KEYS.playlists, []));
    setHistory(readStorage(STORAGE_KEYS.history, []));
  }, [isDemoMode]);

  const startDemoMode = useCallback(() => {
    if (scanning) return;
    player.clearQueue();
    revokeAllObjectUrls();
    revokeDemoAudioUrls();
    activeHandleRef.current = null;
    setIsDemoMode(true);
    setFolderName('DEMO MODE');
    setSongs(buildDemoSongs());
    setLibGenre('All');
    setLoved(new Set(DEMO_LOVED));
    setPlaylists(DEMO_PLAYLISTS.map((playlist) => ({ ...playlist, songIds: [...playlist.songIds] })));
    setHistory(seedDemoHistory());
    toast('DEMO MODE ACTIVE · 13 SAMPLE TRACKS');
  }, [player.clearQueue, scanning, toast]);

  const mountFromHandle = useCallback(async (handle) => {
    setScanning(true);
    setScanProgress({ done: 0, total: 0 });
    try {
      const granted = await verifyHandlePermission(handle);
      if (!granted) {
        toast('FOLDER PERMISSION DENIED');
        return;
      }
      player.clearQueue();
      revokeAllObjectUrls();
      revokeDemoAudioUrls();
      const scannedSongs = await scanDirectoryHandle(handle, setScanProgress);
      exitDemoState();
      activeHandleRef.current = handle;
      setSavedHandle(handle);
      await saveFolderHandle(handle);
      setSongs(scannedSongs);
      setFolderName(handle.name);
      setLibGenre('All');
      toast(
        scannedSongs.length
          ? `MOUNTED "${handle.name.toUpperCase()}" · ${scannedSongs.length} TRACKS`
          : `NO AUDIO FILES IN "${handle.name.toUpperCase()}"`,
      );
    } catch (error) {
      if (error?.name !== 'AbortError') toast('FAILED TO READ LOCAL FOLDER');
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  }, [exitDemoState, player.clearQueue, toast]);

  const pickFolder = useCallback(async () => {
    if (scanning) return;
    if (supportsDirectoryPicker()) {
      try {
        const handle = await pickDirectoryHandle();
        await mountFromHandle(handle);
      } catch (error) {
        if (error?.name !== 'AbortError') toast('COULD NOT OPEN FOLDER PICKER');
      }
      return;
    }
    fallbackInputRef.current?.click();
  }, [mountFromHandle, scanning, toast]);

  const handleFallbackFiles = useCallback(async (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    setScanning(true);
    setScanProgress({ done: 0, total: fileList.length });
    try {
      player.clearQueue();
      revokeAllObjectUrls();
      revokeDemoAudioUrls();
      const { folderName: nextFolder, songs: scannedSongs } = await scanFileList(fileList, setScanProgress);
      exitDemoState();
      activeHandleRef.current = null;
      setSongs(scannedSongs);
      setFolderName(nextFolder);
      setLibGenre('All');
      toast(
        scannedSongs.length
          ? `MOUNTED "${nextFolder.toUpperCase()}" · ${scannedSongs.length} TRACKS`
          : 'NO AUDIO FILES FOUND',
      );
    } catch {
      toast('FAILED TO SCAN LOCAL FILES');
    } finally {
      event.target.value = '';
      setScanning(false);
      setScanProgress(null);
    }
  }, [exitDemoState, player.clearQueue, toast]);

  const reconnectSavedFolder = useCallback(async () => {
    if (!savedHandle || scanning) return;
    await mountFromHandle(savedHandle);
  }, [mountFromHandle, savedHandle, scanning]);

  const rescanFolder = useCallback(async () => {
    if (!activeHandleRef.current || scanning) return;
    await mountFromHandle(activeHandleRef.current);
  }, [mountFromHandle, scanning]);

  const disconnectFolder = useCallback(async () => {
    const wasDemo = isDemoMode;
    player.clearQueue();
    revokeAllObjectUrls();
    revokeDemoAudioUrls();
    activeHandleRef.current = null;
    setSongs([]);
    setFolderName('');
    setLibGenre('All');
    if (wasDemo) {
      exitDemoState();
      toast('EXITED DEMO MODE');
      return;
    }
    setSavedHandle(null);
    await clearSavedFolderHandle();
    toast('LOCAL ARCHIVE DISCONNECTED');
  }, [exitDemoState, isDemoMode, player.clearQueue, toast]);

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
        setReelModal(null);
        setAddSongsPlaylistId(null);
        setMobileNavOpen(false);
        closeSearch();
        closeContextMenu();
        closeQueue();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeContextMenu, closeQueue, closeSearch, openSearch, player.next, player.previous, player.seekBy, player.toggle]);

  const routeSection = route.split('/')[0];
  const activeView = routeSection === 'playlist' ? 'stash' : routeSection === 'hires' ? 'library' : routeSection;
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
        shuffle={player.shuffle}
        repeat={player.repeat}
        loved={currentLoved}
        volume={player.volume}
        muted={player.muted}
        queueCount={player.queue.length}
        savedFolderName={savedHandle?.name || ''}
        scanning={scanning}
        scanProgress={scanProgress}
        onPickFolder={pickFolder}
        onReconnectFolder={reconnectSavedFolder}
        onStartDemo={startDemoMode}
        onToggle={player.toggle}
        onStop={handleStop}
        onNext={() => player.next()}
        onPrevious={player.previous}
        onSeek={player.seekTo}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeat={handleCycleRepeat}
        onLove={handleLove}
        onVolume={player.setVolume}
        onMute={player.toggleMute}
        onToggleQueue={() => setQueueOpen((current) => !current)}
      />
    );
  } else if (routeSection === 'library' || routeSection === 'hires') {
    view = (
      <LibraryView
        songs={songs}
        albums={albums}
        artists={artists}
        genres={genres}
        currentSong={player.current}
        folderName={folderName}
        scanning={scanning}
        scanProgress={scanProgress}
        tab={libTab}
        genre={libGenre}
        sort={libSort}
        onTab={setLibTab}
        onGenre={setLibGenre}
        onSort={() => setLibSort((current) => current === 'az' ? 'newest' : 'az')}
        onPickFolder={pickFolder}
        onStartDemo={startDemoMode}
        onPlay={playSong}
        onContextMenu={handleContextMenu}
        onPlayAlbum={playAlbum}
        onPlayArtist={playArtist}
      />
    );
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
        onAddSongs={(playlist) => setAddSongsPlaylistId(playlist.id)}
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
    view = (
      <SettingsView
        switches={switches}
        folderName={folderName}
        songCount={songs.length}
        canRescan={Boolean(activeHandleRef.current)}
        isDemoMode={isDemoMode}
        scanning={scanning}
        onToggleSwitch={updateSwitch}
        onPickFolder={pickFolder}
        onStartDemo={startDemoMode}
        onRescan={rescanFolder}
        onDisconnect={disconnectFolder}
        onClearHistory={clearHistory}
      />
    );
  } else if (routeSection === 'help') {
    view = <HelpView />;
  } else {
    view = <div className="empty">MODULE OFFLINE</div>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <canvas
        id="glyph-matrix-bg"
        className={classNames('glyph-matrix-bg', player.isPlaying && switches.glyphSync && 'active')}
        aria-hidden="true"
      />
      <ChassisHeader
        activeView={activeView}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((current) => !current)}
        songCount={songs.length}
        playlistCount={playlists.length}
        lovedCount={loved.size}
        folderName={folderName}
        scanning={scanning}
        queueCount={player.queue.length}
        queueOpen={queueOpen}
        onToggleQueue={() => setQueueOpen((current) => !current)}
        onPickFolder={pickFolder}
        onOpenSearch={openSearch}
        outputName={output.selectedLabel.toUpperCase()}
        devices={output.devices}
        selectedId={output.selectedId}
        supported={output.supported}
        needsUnlock={output.needsUnlock}
        canSelectOutput={output.canSelectOutput}
        onSelectOutput={output.selectDevice}
        onRefreshOutputs={output.refreshDevices}
        onPromptPicker={output.promptDevicePicker}
      />
      <div className="body">
        <Sidebar
          activeView={activeView}
          songCount={songs.length}
          playlistCount={playlists.length}
          lovedCount={loved.size}
          deckStatus={player.isPlaying ? 'PLAY' : 'IDLE'}
          folderName={folderName}
          scanning={scanning}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          onPickFolder={pickFolder}
          onOpenSearch={openSearch}
        />
        <main id="main">
          <div id="view" className={classNames(routeSection === 'deck' && 'on-deck')}>
            <motion.div
              key={routeSection}
              className="view-frame"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_SMOOTH}
            >
              {view}
            </motion.div>
          </div>
        </main>
      </div>
      {routeSection !== 'deck' && (
        <PlayerBar
          current={player.current}
          hasSongs={songs.length > 0}
          isPlaying={player.isPlaying}
          shuffle={player.shuffle}
          repeat={player.repeat}
          loved={currentLoved}
          muted={player.muted}
          mono={switches.mono}
          volume={player.volume}
          currentTime={player.currentTime}
          duration={player.duration}
          queueCount={player.queue.length}
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
      )}
      <QueuePanel
        open={queueOpen}
        queue={player.queue}
        qIndex={player.qIndex}
        currentSong={player.current}
        isPlaying={player.isPlaying}
        onClose={closeQueue}
        onJump={player.jumpTo}
        onRemove={player.removeFromQueue}
        onMove={player.moveQueueItem}
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
      <ReelModal
        modal={reelModal}
        onClose={() => setReelModal(null)}
        onSubmit={handleReelModalSubmit}
      />
      <AddSongsModal
        playlist={addSongsPlaylistId ? playlists.find((item) => item.id === addSongsPlaylistId) : null}
        songs={songs}
        onClose={() => setAddSongsPlaylistId(null)}
        onToggleSong={toggleSongInPlaylist}
        onPickFolder={pickFolder}
        onStartDemo={startDemoMode}
      />
      <Toasts messages={toasts} />
      <BootScreen />
      <input
        ref={fallbackInputRef}
        type="file"
        webkitdirectory=""
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFallbackFiles}
      />
    </MotionConfig>
  );
}
