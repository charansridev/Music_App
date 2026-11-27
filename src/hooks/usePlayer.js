import { useCallback, useEffect, useRef, useState } from 'react';
import { getSongAudioUrl } from '../lib/localLibrary.js';

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function usePlayer({ songs, onTrackStart, onListen }) {
  const [audio, setAudio] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);
  const queueRef = useRef(queue);
  const qIndexRef = useRef(qIndex);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const durationRef = useRef(duration);
  const currentRef = useRef(null);
  const songsRef = useRef(songs);
  const listenedMsRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const historyIdRef = useRef(null);
  const loadIdRef = useRef(0);
  const nextRef = useRef(() => {});
  const previousRef = useRef(() => {});
  const flushListenRef = useRef(() => {});
  const onTrackStartRef = useRef(onTrackStart);
  const onListenRef = useRef(onListen);

  queueRef.current = queue;
  qIndexRef.current = qIndex;
  shuffleRef.current = shuffle;
  repeatRef.current = repeat;
  durationRef.current = duration;
  songsRef.current = songs;
  onTrackStartRef.current = onTrackStart;
  onListenRef.current = onListen;

  const current = queue[qIndex] || null;
  currentRef.current = current;

  const flushListen = useCallback(() => {
    const song = currentRef.current;
    const listenedMs = listenedMsRef.current;
    const historyId = historyIdRef.current;
    if (song && historyId && listenedMs > 3000) {
      const positionMs = (audioRef.current?.currentTime || 0) * 1000;
      onListenRef.current(historyId, Math.min(listenedMs, positionMs));
    }
    listenedMsRef.current = 0;
    lastTimestampRef.current = 0;
  }, []);
  flushListenRef.current = flushListen;

  useEffect(() => {
    const element = new Audio();
    element.preload = 'metadata';
    element.volume = 0.8;
    audioRef.current = element;
    setAudio(element);

    const updateTime = () => {
      const now = performance.now();
      if (!element.paused && lastTimestampRef.current) {
        listenedMsRef.current += now - lastTimestampRef.current;
      }
      lastTimestampRef.current = element.paused ? 0 : now;
      setCurrentTime(Number.isFinite(element.currentTime) ? element.currentTime : 0);
      if (Number.isFinite(element.duration)) {
        durationRef.current = element.duration;
        setDuration(element.duration);
      }
    };
    const handlePlay = () => {
      lastTimestampRef.current = performance.now();
      setIsPlaying(true);
    };
    const handlePause = () => {
      flushListenRef.current();
      setIsPlaying(false);
    };
    const handleEnded = () => nextRef.current(true);
    const bindMediaSession = () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', () => element.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => element.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextRef.current(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => previousRef.current());
    };

    element.addEventListener('timeupdate', updateTime);
    element.addEventListener('loadedmetadata', updateTime);
    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('ended', handleEnded);
    bindMediaSession();

    return () => {
      loadIdRef.current += 1;
      element.pause();
      element.removeEventListener('timeupdate', updateTime);
      element.removeEventListener('loadedmetadata', updateTime);
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('ended', handleEnded);
      element.removeAttribute('src');
      element.load();
      audioRef.current = null;
    };
  }, []);

  const replaceQueue = useCallback((nextQueue, nextIndex) => {
    queueRef.current = nextQueue;
    qIndexRef.current = nextIndex;
    setQueue(nextQueue);
    setQIndex(nextIndex);
  }, []);

  const loadSong = useCallback(async (song, autoplay = true) => {
    flushListenRef.current();
    const element = audioRef.current;
    if (!element) return;

    const loadId = ++loadIdRef.current;
    if (!song) {
      currentRef.current = null;
      historyIdRef.current = null;
      element.pause();
      return;
    }

    const src = getSongAudioUrl(song);
    if (!src) return;

    currentRef.current = song;
    element.src = src;
    element.load();
    setCurrentTime(0);
    durationRef.current = song.duration || 0;
    setDuration(song.duration || 0);

    if (autoplay) {
      try {
        await element.play();
      } catch {
        // Playback can require another user gesture on restrictive browsers.
      }
    }

    if (loadId !== loadIdRef.current) return;
    historyIdRef.current = onTrackStartRef.current(song);
    listenedMsRef.current = 0;
    lastTimestampRef.current = element.paused ? 0 : performance.now();

    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [{ src: song.art, sizes: '320x320', type: song.artType || 'image/svg+xml' }],
      });
    }
  }, []);

  const clearQueue = useCallback(() => {
    flushListenRef.current();
    loadIdRef.current += 1;
    const element = audioRef.current;
    if (element) {
      element.pause();
      element.removeAttribute('src');
      element.load();
    }
    currentRef.current = null;
    historyIdRef.current = null;
    replaceQueue([], -1);
    setIsPlaying(false);
    setCurrentTime(0);
    durationRef.current = 0;
    setDuration(0);
  }, [replaceQueue]);

  const playQueue = useCallback((nextSongs, startIndex = 0) => {
    const index = nextSongs.length ? clamp(startIndex, 0, nextSongs.length - 1) : -1;
    replaceQueue([...nextSongs], index);
    loadSong(nextSongs[index] ?? null, true);
  }, [loadSong, replaceQueue]);

  const jumpTo = useCallback((index) => {
    if (index < 0 || index >= queueRef.current.length) return;
    qIndexRef.current = index;
    setQIndex(index);
    loadSong(queueRef.current[index], true);
  }, [loadSong]);

  const playNext = useCallback((song, notify) => {
    const nextQueue = [...queueRef.current];
    nextQueue.splice(qIndexRef.current + 1, 0, song);
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    notify?.(`Playing next: ${song.title}`);
  }, []);

  const addToQueue = useCallback((song, notify) => {
    const nextQueue = [...queueRef.current, song];
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    notify?.(`Added to queue: ${song.title}`);
  }, []);

  const removeFromQueue = useCallback((index) => {
    if (index === qIndexRef.current || index < 0 || index >= queueRef.current.length) return;
    const nextQueue = [...queueRef.current];
    nextQueue.splice(index, 1);
    if (index < qIndexRef.current) {
      qIndexRef.current -= 1;
      setQIndex(qIndexRef.current);
    }
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }, []);

  const moveQueueItem = useCallback((fromIndex, toIndex) => {
    const length = queueRef.current.length;
    if (
      fromIndex === toIndex
      || fromIndex < 0
      || fromIndex >= length
      || toIndex < 0
      || toIndex >= length
    ) {
      return;
    }

    const nextQueue = [...queueRef.current];
    const [moved] = nextQueue.splice(fromIndex, 1);
    nextQueue.splice(toIndex, 0, moved);

    const active = qIndexRef.current;
    let nextActive = active;
    if (active === fromIndex) {
      nextActive = toIndex;
    } else if (fromIndex < active && toIndex >= active) {
      nextActive = active - 1;
    } else if (fromIndex > active && toIndex <= active) {
      nextActive = active + 1;
    }

    queueRef.current = nextQueue;
    qIndexRef.current = nextActive;
    setQueue(nextQueue);
    setQIndex(nextActive);
  }, []);

  const next = useCallback((automatic = false) => {
    if (repeatRef.current === 'one' && automatic && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }

    flushListenRef.current();
    const activeQueue = queueRef.current;
    const index = qIndexRef.current;
    if (index < activeQueue.length - 1) {
      const nextIndex = index + 1;
      qIndexRef.current = nextIndex;
      setQIndex(nextIndex);
      loadSong(activeQueue[nextIndex], true);
    } else if (repeatRef.current === 'all' && activeQueue.length) {
      qIndexRef.current = 0;
      setQIndex(0);
      loadSong(activeQueue[0], true);
    } else if (automatic) {
      audioRef.current?.pause();
    }
  }, [loadSong]);
  nextRef.current = next;

  const previous = useCallback(() => {
    flushListenRef.current();
    const element = audioRef.current;
    if (!element) return;
    if (element.currentTime > 4 || qIndexRef.current <= 0) {
      element.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const previousIndex = qIndexRef.current - 1;
    qIndexRef.current = previousIndex;
    setQIndex(previousIndex);
    loadSong(queueRef.current[previousIndex], true);
  }, [loadSong]);
  previousRef.current = previous;

  const toggle = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    if (!currentRef.current) {
      if (songsRef.current.length) playQueue(songsRef.current, 0);
      return;
    }
    if (element.paused) element.play().catch(() => {});
    else element.pause();
  }, [playQueue]);

  const stop = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const seekTo = useCallback((percentage) => {
    const element = audioRef.current;
    const total = Number.isFinite(element?.duration) ? element.duration : durationRef.current;
    if (!element || !total) return;
    element.currentTime = clamp(percentage, 0, 1) * total;
    setCurrentTime(element.currentTime);
  }, []);

  const seekBy = useCallback((seconds) => {
    const element = audioRef.current;
    const total = Number.isFinite(element?.duration) ? element.duration : durationRef.current;
    if (!element || !total) return;
    element.currentTime = clamp(element.currentTime + seconds, 0, total);
    setCurrentTime(element.currentTime);
  }, []);

  const setVolumeValue = useCallback((nextVolume) => {
    const value = clamp(nextVolume, 0, 1);
    if (audioRef.current) {
      audioRef.current.volume = value;
      audioRef.current.muted = false;
    }
    setVolume(value);
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  }, []);

  const toggleShuffle = useCallback((notify) => {
    const nextShuffle = !shuffleRef.current;
    shuffleRef.current = nextShuffle;
    setShuffle(nextShuffle);
    if (nextShuffle && queueRef.current.length > 1) {
      const activeSong = currentRef.current;
      const rest = queueRef.current.filter((_, index) => index !== qIndexRef.current);
      for (let index = rest.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [rest[index], rest[randomIndex]] = [rest[randomIndex], rest[index]];
      }
      const nextQueue = activeSong ? [activeSong, ...rest] : rest;
      queueRef.current = nextQueue;
      qIndexRef.current = activeSong ? 0 : -1;
      setQueue(nextQueue);
      setQIndex(qIndexRef.current);
    }
    notify?.(nextShuffle ? 'Shuffle on' : 'Shuffle off');
  }, []);

  const cycleRepeat = useCallback((notify) => {
    const nextRepeat = { off: 'all', all: 'one', one: 'off' }[repeatRef.current];
    repeatRef.current = nextRepeat;
    setRepeat(nextRepeat);
    notify?.(nextRepeat === 'off' ? 'Repeat off' : nextRepeat === 'all' ? 'Repeat queue' : 'Repeat one');
  }, []);

  return {
    audio,
    queue,
    qIndex,
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    playQueue,
    clearQueue,
    playNext,
    addToQueue,
    removeFromQueue,
    moveQueueItem,
    jumpTo,
    next,
    previous,
    toggle,
    stop,
    seekTo,
    seekBy,
    setVolume: setVolumeValue,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  };
}
