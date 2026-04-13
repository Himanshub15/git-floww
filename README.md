<div align="center">

# git-floww

**Visualize git like a whiteboard.** Create branches, commits, merges, rebases — all as an interactive tree diagram.

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![D3.js](https://img.shields.io/badge/D3.js-7-f9a03c?style=flat&logo=d3.js&logoColor=white)](https://d3js.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Bundle](https://img.shields.io/badge/Bundle-~87kb_gzipped-4ade80?style=flat)]()

**[Try it live](https://himanshub15.github.io/git-floww/)**

</div>

---

## What is this?

A browser-based git branch visualizer. Draw branches, add commits, merge, rebase, cherry-pick, stash — and see the whole flow as an interactive tree diagram. Built for developers learning git, teams planning branching strategies, or anyone who thinks better visually.

No backend. No accounts. Everything runs in your browser.

## Features

- **Interactive SVG canvas** — zoom, pan, click. D3-powered with smooth bezier branch connections.
- **Full git operations** — branch, commit, merge, rebase, cherry-pick, stash/pop, reset
- **Conflict detection** — animated warning rings when merging diverged branches
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z with full history stack
- **Export** — download your diagram as PNG or SVG
- **Dark / Light theme** — deep indigo dark mode, clean slate light mode. Persists to localStorage.
- **Lightweight** — ~87kb gzipped. No heavy UI frameworks.

## Tech Stack

| What | Why |
|------|-----|
| React 19 + TypeScript | Component model for interactive UI |
| D3.js | SVG rendering, zoom/pan, graph layout |
| Zustand | Lightweight state management (~2kb) |
| Vite | Fast builds, HMR |
| html-to-image | PNG/SVG export |

## Run Locally

```bash
git clone https://github.com/Himanshub15/git-floww.git
cd git-floww
npm install
npm run dev
```

Open `http://localhost:5173` and start building your git flow.

## Quick Start

1. Click **Commit** to add commits to the active branch
2. Click **Branch** then click any commit to fork a new branch
3. Switch branches in the sidebar, add more commits
4. Click **Merge** to merge another branch into the active one
5. Hit **Export** to download your diagram

---

<div align="center">
  <sub>Built by <a href="https://github.com/Himanshub15">Himanshu</a></sub>
</div>
