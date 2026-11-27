<div align="center">

<img src="./public/icon.png" alt="MUZIK M Logo" width="112" />

# MUZIK

**An experimental, Swiss-editorial local music player built for people who still own their files.**

*Ink Black · Off-White Paper · Warm Sand · Signal Green*

![React](https://img.shields.io/badge/React-18-0A0A0A?style=for-the-badge&logo=react&logoColor=F4D026)
![Vite](https://img.shields.io/badge/Vite-8-0A0A0A?style=for-the-badge&logo=vite&logoColor=18B848)
![Electron](https://img.shields.io/badge/Electron-Desktop-0A0A0A?style=for-the-badge&logo=electron&logoColor=F2F1EC)
![Local First](https://img.shields.io/badge/100%25-Local--First-007A19?style=for-the-badge)

</div>

---

No subscriptions. No algorithms. No cloud uploads. Just your local FLAC, WAV, MP3, M4A, AAC, OGG, and OPUS collection wrapped in an expressive Swiss-grid interface with vinyl physics, bouncing record crates, and Web Audio DSP.

---

## Three Switchable Playback Decks

Pick your mood on the **01 Deck** screen using the circular signal pills:

| Mode | Visual Personality | Signature Toy |
| :--- | :--- | :--- |
| **M · Mix** | Warm Sand (`#D8D1C5`) meets Ink & Paper | Dual asymmetric spinning vinyl discs + 72-bar waveform scrubber |
| **R · Reel** | Warm Taupe (`#B5AAA0`) & Ink Black | 3-prong rotating tape reel, dot-matrix playhead, rainbow arc meter & 16-band spectrum |
| **P · Poster** | Full-bleed Signal Green (`#007A19`) | Oversized Swiss typography, 45° arrow, orange track badge & vinyl peek |

---

## What Makes It Fun

- **Interactive Falling Music Crate Scanner:** Indexing a big folder isn't a boring spinner anymore. As your files are tagged, vinyl discs, 3-prong reels, and signal badges drop into an interactive 2D physics crate. **Move your cursor** to bat them around, **click anywhere** to trigger a shockwave, or hit **Shake Crate** to toss everything in the air.
- **Native Desktop App (Electron):** Automatically mounts your OS **Music** folder on launch (or remembers whichever folder you picked), streams audio directly from disk with HTTP byte-range seeking via `muzik-media://`, and lets you switch or reset folders anytime in **05 System**.
- **Smart Cover Art Validation:** Embedded album artwork is sniffed by magic bytes and verified with `createImageBitmap`—so broken tags never leave you staring at a blank square, falling back cleanly to bold geometric cover art.
- **Master Library (`02 Library`):** Browse by **Songs**, **Albums** (with vinyl-peek cards and `HI-RES` callouts), or **Artists**, filter by genre chips, sort A–Z or Newest, and jump anywhere instantly with `Ctrl/Cmd + K`.
- **Tape Stash (`03 Stash`):** Build custom Reels, seed new Reels straight from a track's right-click menu, and shuffle your Loved tracks.
- **Editable Queue (`Q`):** Slide-out transmission drawer with drag-and-drop reordering, move up/down buttons, and live playback equalizer bars.
- **Audio Output Switcher & Live DSP:** Route playback directly to your speakers, DAC, or headphones (`AudioContext.setSinkId` + `HTMLAudioElement.setSinkId`), toggle **Glyph Soundwire** (beat-reactive canvas matrix), engage **Crossfeed DSP** for headphones, or flip to **Mono** downmix on the fly.
- **Listening Telemetry (`04 Stats`):** 60-day local history with 7-day / 8-week activity bars, time-of-day rhythm breakdown, oversized Swiss date logs, and a 35-day streak grid with daily listening goals.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `←` / `→` | Seek ±5 seconds |
| `Shift + ←` / `Shift + →` | Previous / Next track |
| `Ctrl + K` / `Cmd + K` | Open archive search |
| `Q` | Toggle queue drawer |
| `Esc` | Close active overlay or modal |

---

## Run It Yourself

Requires **Node.js 22.12+**.

```bash
# 1. Install dependencies
npm install

# 2. Run in browser (Vite dev server)
npm run dev

# 3. Launch as Electron desktop app
npm run electron

# 4. Package Windows .exe (installer + portable in /release)
npm run electron:build
```

> **Tip for first-time Electron setup:** If Electron's binary download wasn't cached during `npm install`, run `node node_modules/electron/install.js` once before `npm run electron`.

---

## Tech Stack

- **Frontend:** React 18, Vite 8, Framer Motion, Lucide React
- **Desktop Wrapper:** Electron, Electron Builder, custom `muzik-media://` byte-range streaming protocol
- **Audio & Metadata:** Web Audio API (`AnalyserNode`, Biquad/Delay Crossfeed, `setSinkId`), `music-metadata`

---

## Upcoming Ideas

- [ ] **Synced `.lrc` & Embedded Lyrics:** Scrollable editorial lyric sheets alongside the active deck.
- [ ] **10-Band Parametric EQ:** Custom curves and hardware-inspired presets.
- [ ] **Gapless Playback & Crossfade:** Seamless transitions for live records and continuous mixes.
- [ ] **Global Media Keys:** Control MUZIK from anywhere on your desktop while minimized.
