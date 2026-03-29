# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-29

### Added

- **Side Panel GUI** — Premium dark theme editor with Inter/JetBrains Mono typography
- **Element Picker** — Visual inspector mode with smart CSS selector generation
  - Priority-based selector strategy (ID → data attributes → ARIA → classes → path)
  - Automatic filtering of dynamic/framework-generated IDs and CSS Modules classes
- **Step Configuration** — Modal editor for title, description, position, alignment, buttons, interaction, and custom CSS classes
- **Drag & Drop** — Reorder tour steps by dragging cards
- **Global Settings** — Animation, scroll, overlay, keyboard navigation, button texts, progress display
- **Live Preview** — CSP-compatible driver.js injection via `chrome.scripting.executeScript` with `world: 'MAIN'`
- **Export/Import** — JSON and JavaScript code export with native OS save dialog (`showSaveFilePicker`), JSON import, clipboard copy
- **Internationalization** — Full German (DE) and English (EN) localization with auto-detection and persistence
- **Auto-Save** — Tour state automatically saved and restored via `chrome.storage.local`
- **driver.js v1.3.1** — Bundled as IIFE for direct page injection
