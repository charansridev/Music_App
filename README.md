# MUZIK

A minimalist, album-first local audio player built for tactile listening. Mount any music folder directly from your device—nothing leaves your machine—and listen with a spinning vinyl slide-out deck, 3D sleeve tilt physics, Web Audio DSP, and a beat-reactive Glyph Matrix background.

---

## Highlights

- **Local-First Library:** Mount folders using the File System Access API (with automatic directory-input fallback) and index **FLAC, WAV, MP3, M4A, AAC, OGG, and OPUS** files with embedded artwork and audio specs via `music-metadata`. Folder handles persist locally in IndexedDB for one-click reconnect.
- **Album-First Deck & Tactile Motion:** Pressing **Listen** (or clicking the album sleeve) slides a spinning vinyl disc out from behind the cover with spring physics. Both the album cover and the translucent control panel feature pointer-tracked 3D perspective tilt and a cursor-following light sheen.
- **Beat-Reactive Glyph Matrix Background:** A 60fps HTML5 Canvas + Web Audio `AnalyserNode` engine renders borderless micro-LED boxes across the `#09090B` canvas **only while music is playing**, radiating geometric beat ripples and frequency-mapped pulses in real time (respects the `Glyph Soundwire` toggle and `prefers-reduced-motion`).
- **Master Library & Hi-Res Vault:** Browse by Songs, Albums (with hover vinyl-peek and sheen), Artists, or dedicated Hi-Res (24-bit / DSD) masters with instant command search (`Ctrl/Cmd + K`).
- **Tape Stash (Reels & Loved Tracks):** Create, rename, populate, and erase custom Reels, or shuffle Loved tracks—stored locally in `localStorage`.
- **Listening Telemetry:** 60-day local playback log with 7-day / 8-week charts, time-of-day rhythm breakdown, daily history, and a 35-day listening streak tracker with configurable daily goals.
- **Audio Output & DSP Rig:** Switch system audio output devices (`setSinkId`), toggle **Glyph Soundwire**, engage analogue-style **Crossfeed DSP**, or sum to **Mono** in real time.
- **Instant Demo Mode:** Try the full experience immediately with 13 synthesized sample tracks, pre-seeded playlists, and telemetry—no local files required.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` | Play / Pause |
| `←` / `→` | Seek ±5 seconds |
| `Shift + ←` / `Shift + →` | Previous / Next track |
| `Ctrl + K` / `Cmd + K` | Open archive search |
| `Q` | Toggle transmission queue drawer |
| `Esc` | Close active overlay or modal |

---

## Tech Stack

- **UI & Build:** React 18, Vite 8
- **Animation & Icons:** Framer Motion, Lucide React
- **Audio & Metadata:** Web Audio API (`AnalyserNode`, Biquad/Delay Crossfeed, `setSinkId`), `music-metadata`

---

## Getting Started

Requires **Node.js 22.12+**.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Upcoming Roadmap

Planned improvements and experiments for future releases:

- [ ] **Adaptive Album-Tint Glyph Matrix:** Extract dominant colors from the active album cover so the beat-reactive matrix shifts palette per release.
- [ ] **Custom Glyph Matrix Modes:** Switchable visual patterns (Geometric Ripples, Vertical Matrix Rain, Minimal Pulse, Off) and brightness/sensitivity controls in System settings.
- [ ] **Synchronized Lyrics:** Parse embedded lyrics tags and sidecar `.lrc` files with smooth line-by-line auto-scroll.
- [ ] **10-Band Parametric EQ & Presets:** Interactive Web Audio equalizer with Studio Flat, Warm Vinyl, Bass Boost, and custom saved curves.
- [ ] **Gapless Playback & Crossfade:** Dual-buffer preloading for seamless live albums and configurable track-to-track crossfade.
- [ ] **Drag-and-Drop Queue Reordering:** Reorder upcoming tracks directly inside the queue drawer and export/import Reels as `.m3u` or JSON.
- [ ] **Smart Library Watch & Tag Editor:** Background folder re-indexing for newly added tracks plus inline metadata/artwork editing.
- [ ] **Installable PWA & Desktop App:** Full offline caching via Service Worker and an optional lightweight desktop wrapper (Tauri / Electron) with global media keys.
