// Audio engine: queue, shuffle, repeat, play logging
const Player = {
  audio: null,
  queue: [],
  qIndex: -1,
  shuffle: false,
  repeat: 'off', // off | all | one
  listenedMs: 0,
  lastTs: 0,

  init() {
    this.audio = new Audio();
    this.audio.volume = 0.8;
    this.audio.addEventListener('ended', () => this.next(true));
    this.audio.addEventListener('timeupdate', () => {
      const now = performance.now();
      if (this.lastTs) this.listenedMs += now - this.lastTs;
      this.lastTs = now;
      this.emit('time');
    });
    this.audio.addEventListener('play', () => this.emit('state'));
    this.audio.addEventListener('pause', () => { this.flushListen(); this.emit('state'); });
    this.bindMediaSession();
  },

  listeners: {},
  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); },
  emit(evt) { (this.listeners[evt] || []).forEach(fn => fn()); },

  current() { return this.queue[this.qIndex] || null; },
  isPlaying() { return !!(this.audio && !this.audio.paused && this.current()); },

  setQueue(songs, startIndex = -1) {
    this.queue = [...songs];
    this.qIndex = startIndex;
  },
  playQueue(songs, startIndex = 0) {
    this.setQueue(songs, startIndex);
    this.load(this.queue[this.qIndex], true);
    this.emit('queue');
  },
  playNext(song) {
    this.queue.splice(this.qIndex + 1, 0, song);
    this.emit('queue');
    toast(`Playing next: ${song.title}`);
  },
  addToQueue(song) {
    this.queue.push(song);
    this.emit('queue');
    toast(`Added to queue: ${song.title}`);
  },
  removeFromQueue(i) {
    if (i === this.qIndex) return;
    this.queue.splice(i, 1);
    if (i < this.qIndex) this.qIndex--;
    this.emit('queue');
  },
  jumpTo(i) {
    if (i < 0 || i >= this.queue.length) return;
    this.qIndex = i;
    this.load(this.queue[i], true);
    this.emit('queue');
  },

  async load(song, autoplay) {
    this.flushListen();
    if (!song) { this.audio.pause(); return; }
    this.audio.src = demoAudioSrc(song);
    if (autoplay) {
      try { await this.audio.play(); } catch { /* needs gesture */ }
    }
    // count play when track starts
    App.history.push({ songId: song.id, ts: Date.now(), ms: 0 });
    this.listenedMs = 0;
    this.lastTs = 0;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title, artist: song.artist, album: song.album,
        artwork: [{ src: song.art, sizes: '320x320', type: 'image/svg+xml' }],
      });
    }
    this.emit('change');
    UI.renderIfCurrent(song);
  },

  toggle() {
    if (!this.current()) { this.playQueue(App.songs, 0); return; }
    if (this.audio.paused) this.audio.play(); else this.audio.pause();
  },
  next(auto) {
    if (this.repeat === 'one' && auto) { this.audio.currentTime = 0; this.audio.play(); return; }
    this.flushListen();
    if (this.qIndex < this.queue.length - 1) {
      this.qIndex++;
      this.load(this.queue[this.qIndex], true);
    } else if (this.repeat === 'all' && this.queue.length) {
      this.qIndex = 0;
      this.load(this.queue[0], true);
    } else if (auto) {
      this.audio.pause();
    }
    this.emit('queue');
  },
  prev() {
    this.flushListen();
    if (this.audio.currentTime > 4 || this.qIndex <= 0) { this.audio.currentTime = 0; return; }
    this.qIndex--;
    this.load(this.queue[this.qIndex], true);
    this.emit('queue');
  },
  seekTo(pct) {
    if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
  },
  setVolume(v) { this.audio.volume = v; this.audio.muted = false; },
  toggleMute() { this.audio.muted = !this.audio.muted; this.emit('state'); },

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle && this.queue.length > 1) {
      const cur = this.current();
      const rest = this.queue.filter((s, i) => i !== this.qIndex);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      this.queue = cur ? [cur, ...rest] : rest;
      this.qIndex = cur ? 0 : -1;
    }
    this.emit('queue');
    toast(this.shuffle ? 'Shuffle on' : 'Shuffle off');
  },
  cycleRepeat() {
    this.repeat = { off: 'all', all: 'one', one: 'off' }[this.repeat];
    toast(this.repeat === 'off' ? 'Repeat off' : this.repeat === 'all' ? 'Repeat queue' : 'Repeat one');
    this.emit('state');
  },

  flushListen() {
    const cur = this.current();
    if (cur && App.history.length && this.listenedMs > 3000) {
      const h = App.history[App.history.length - 1];
      if (h.songId === cur.id) h.ms += Math.min(this.listenedMs, this.audio ? this.audio.currentTime * 1000 : this.listenedMs);
    }
    this.listenedMs = 0;
    this.lastTs = 0;
  },

  bindMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => this.audio.play());
    navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
  },
};
