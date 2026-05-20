---
description: Apply comprehensive project context, architecture details, and coding style rules for all coding and debugging tasks in the repository.
applyTo: '**/*'
---

# Project Context

This project is a **Manifest V3 browser extension** (Chrome + Firefox) built with **WXT**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It helps students track grades, schedules, and info by scraping university portal pages.

## Key Technologies & Architecture
- **State Management**: Zustand stores persisted to `chrome.storage.local`.
- **Data Flow**: Side Panel UI -> Background Service Worker -> Content Scripts (DOM scraping).
- **DOM Scrapers**: Injected inline via `browser.scripting.executeScript()`.

## Specific Coding Standards

### General Rules
- Explain **WHY**, not **WHAT**. Avoid obvious/verbose comments.
- No `// ======` section dividers. Use brief `// ── section ──` with Unicode box-drawing chars only in large files.
- Minimal JSDoc: public API methods get one-liner `/** Brief. */`; private methods are self-documenting.
- Empty catch blocks: use an inline `/* reason */` block comment, never leave a bare `{}`.
- Use `Promise.all` for parallel independent async work.
- Use `Map` for in-memory caches with simple key patterns like `${a}:${b}`.

### Project-Specific Rules
- **Formatting & Linting**: Use **Biome** (avoid ESLint/Prettier).
- **Path Aliasing**: Use `@/*` to map to the repository root.
- **Constants**: Always check the `constants/` directory (e.g., `constants/default.ts`) to reuse existing values or define new ones centrally.
- **Error Handling**: Follow project patterns, especially considering content-script-to-background messaging.