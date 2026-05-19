# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev (Chrome) | `pnpm dev` |
| Dev (Firefox) | `pnpm dev:firefox` |
| Build (Chrome) | `pnpm build` |
| Build (Firefox) | `pnpm build:firefox` |
| Package for distribution | `pnpm zip` / `pnpm zip:firefox` |
| Type check | `pnpm compile` |
| Lint check | `pnpm ultracite:check` |
| Auto-fix lint | `pnpm ultracite:fix` |

No test suite exists in this project.

## Architecture

This is a **Manifest V3 browser extension** (Chrome + Firefox) built with [WXT](https://wxt.dev/), React 19, TypeScript, and Tailwind CSS v4. It helps students of Ho Chi Minh City Open University track grades, schedules, and student info by scraping university portal pages.

### Two Extension Contexts

**1. Background Service Worker** ([entrypoints/background/index.ts](entrypoints/background/index.ts))
- Acts as a message router between the side panel and content scripts
- Injects content scripts into active tabs via `browser.scripting.executeScript()`
- Manages side panel behavior (opens on extension icon click)

**2. Side Panel UI** ([entrypoints/sidepanel/](entrypoints/sidepanel/))
- A React app with 5 tabs: Point, Info, Calendar, Statistic, Config
- Entry: [app.tsx](entrypoints/sidepanel/app.tsx) → detects current URL → routes user to relevant tab
- Communicates with background via `browser.runtime.sendMessage()`

### Data Flow

```
Side Panel → background (message) → content script injected into tab → DOM scrape → back to side panel
```

Message type constants are defined in [constants/chrome.ts](constants/chrome.ts) (e.g., `_GET_POINT_DATA`, `_GET_USER_DATA`, `_GET_CLASS_CALENDAR_DATA`).

### State Management

Three Zustand stores, each persisted to `chrome.storage.local`:

| Store | File | Manages |
|-------|------|---------|
| Global config | [store/use-global-store.ts](store/use-global-store.ts) | Active tab, site URL, ignored subjects, fixed points |
| Grade data | [entrypoints/sidepanel/PointTab/use-score-store.ts](entrypoints/sidepanel/PointTab/use-score-store.ts) | Semester scores, GPA calculations |
| Calendar data | [entrypoints/sidepanel/CalendarTab/use-calendar-store.ts](entrypoints/sidepanel/CalendarTab/use-calendar-store.ts) | Class schedules, exam events |

### Content Scripts (DOM Scrapers)

Content scripts run inside university portal tabs and are **not loaded as separate files** — they are injected as inline functions by the background script:

- Grades: [entrypoints/sidepanel/PointTab/scripts/index.ts](entrypoints/sidepanel/PointTab/scripts/index.ts) — scrapes `#excel-table`
- User info: [entrypoints/sidepanel/InfoTab/scripts/index.ts](entrypoints/sidepanel/InfoTab/scripts/index.ts) — scrapes `app-thongtin-user`
- Calendar: [entrypoints/sidepanel/CalendarTab/scripts/index.ts](entrypoints/sidepanel/CalendarTab/scripts/index.ts) — complex week-by-week DOM automation

### Target Sites

Defined in [constants/default.ts](constants/default.ts) (`_DEFAULT_SITE_URL_MAPPING`):
- `https://tienichsv.ou.edu.vn` — primary portal
- `https://tienichkcq.oude.edu.vn` — secondary campus portal

### UI Components

- `/components/ui/` — Shadcn/ui (Radix-based, auto-generated, excluded from linting)
- `/components/custom/` — project-specific reusable components
- Icons: Lucide React; notifications: Sonner; charts: Chart.js + react-chartjs-2

## Code Conventions

- **Linter/Formatter**: Biome (not ESLint/Prettier) — config in [biome.jsonc](biome.jsonc)
- **Commits**: Conventional Commits enforced by commitlint + husky (required for semantic-release versioning)
- **Path alias**: `@/*` maps to the repo root
- **Constants & Definitions**: When coding magic numbers, defining thresholds, or adding constant configuration functions, ALWAYS check the `constants/` directory (e.g., `constants/default.ts`) to reuse existing values or define them centrally.
- **Grade conversion**: 10-point → 4-point scale logic is in [utils/index.ts](utils/index.ts)
- **Release**: Automated via semantic-release on push to `main`; updates `package.json`, `wxt.config.ts`, `CHANGELOG.md`, and `assets/data/info.json`
