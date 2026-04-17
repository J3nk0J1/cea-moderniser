# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CadetNet Enhanced is a Chrome Extension (Manifest V3) that applies a dark glassmorphic "space glass" theme, productivity tools, and custom reporting to the CadetNet (CEA) web application at `cadetnet.gov.au`. The site is an AngularJS application, so DOM manipulation must account for Angular's digest cycle and dynamic rendering.

## Architecture

The extension has no build step — all source files are loaded directly by Chrome. Files are modularized into `js/` and `css/` directories.

### CSS Modules (loaded in order via manifest.json)

| File | Purpose |
|------|---------|
| `css/variables.css` | `:root` custom properties (`--ce-*`), Inter font import |
| `css/base.css` | Body, typography, links, status/service brand colors |
| `css/navigation.css` | Navbar, dropdowns, sidebar, breadcrumb, app launcher |
| `css/forms.css` | Form controls, inputs, validation states |
| `css/tables.css` | Tables, DataTables, zebra striping |
| `css/components.css` | Buttons, badges, alerts, pagination, search bar, tabs |
| `css/modals.css` | Modal overrides, draggable modal styles |
| `css/widgets.css` | Dashboard widgets, panels, charts, calendar |
| `css/pages.css` | Page-specific: people, activities, admin, landing, compact mode |
| `css/utilities.css` | Transitions, quick nav overlay, status bar, skeleton loading, print |
| `css/reporting.css` | Report builder panel styles |

### JS Modules (loaded in order via manifest.json)

All modules share the `window.CE` namespace. Each wraps internals in an IIFE and exposes public API on `CE`.

| File | Purpose | Exposes |
|------|---------|---------|
| `js/settings.js` | Creates `CE` namespace, settings sync with chrome.storage | `CE.settings`, `CE.loadSettings`, `CE.applySettings` |
| `js/utils.js` | Shared utility functions | `CE.escapeHtml`, `CE.navigateViaAngular` |
| `js/dom-fixes.js` | Body overflow, announcement restyle, chart text, service colors | `CE.initDomFixes` |
| `js/modals.js` | Draggable/resizable task modals | `CE.initModals` |
| `js/quick-actions.js` | Quick Nav (Ctrl+K), People Search (Ctrl+Shift+P), keyboard shortcuts | `CE.openQuickNav`, `CE.openPeopleSearch`, `CE.initQuickActions` |
| `js/sidebar.js` | Sidebar navigation + app launcher | `CE.initSidebar` |
| `js/status-bar.js` | Status bar, notifications, page title | `CE.createStatusBar`, `CE.removeStatusBar`, `CE.enhanceTitle` |
| `js/transitions.js` | SPA navigation transitions, skeleton loading, loading screen | `CE.showLoadingScreen`, `CE.installClickGuard` |
| `js/icons.js` | Icon modernisation (SVG replacements, Font Awesome) | `CE.initIcons` |
| `js/admin-panel.js` | Admin FAB with quick actions menu | `CE.initAdminPanel` |
| `js/reporting.js` | Report builder: entity search, filters, export | `CE.openReportingPanel`, `CE.initReporting` |
| `js/init.js` | Initialization orchestrator — calls all `CE.init*` functions | — |

### Other Files

- **manifest.json** — Manifest V3 config. Content scripts inject into `*.cadetnet.gov.au`. Permissions: `storage`, `activeTab`.
- **popup.html / popup.js** — Extension popup with toggle switches for settings (compactMode, quickNav, statusBar, enhancedNotifications). Settings sync via `chrome.storage.sync`.
- **icons/** — Extension icons (16, 48, 128px PNG).
- **ReferenceMaterial/** — Captured CadetNet pages and their JS/CSS assets for API reference.

## Development

No build tools, package manager, or tests. To develop:

1. Open `chrome://extensions` with Developer Mode enabled
2. Click "Load unpacked" and select the repo root
3. After editing files, click the refresh icon on the extension card (or Ctrl+R on the extensions page)
4. For content script changes, also reload the CadetNet tab

## Key Patterns

- All CSS custom properties use the `--ce-` prefix to avoid collisions with the host site.
- CSS uses `!important` extensively to override CadetNet's existing styles and Bootstrap defaults.
- JS modules share state via the `window.CE` namespace. `settings.js` creates it first, then each module attaches its public API. Internal functions stay private in per-file IIFEs.
- DOM manipulation uses `MutationObserver` scoped to `#ui-view-index-html` (the Angular view container) to avoid infinite loops with Angular's digest cycle.
- Announcement restyling uses regex matching against known inline color values to convert light-theme colors to dark-theme equivalents.
- The Report Builder uses `fetch()` to CadetNet's REST API at `/v5/api/`. Endpoints follow the pattern `/{Entity}/SearchPaged` (POST with `{pageIndex, pageSize, filters, sort}`) returning `{isSuccess, DataList, TotalItemCount}`.
- CSV exports use the existing `/v5/api/{Entity}/CSVExport` endpoints.

## CadetNet API Reference

The CadetNet AngularJS app exposes REST APIs at `/v5/api/`. Key patterns:

- **SearchPaged**: `POST /v5/api/{Entity}/SearchPaged` with body `{pageIndex, pageSize, filters, sort}` — returns `{isSuccess, DataList, TotalItemCount}`
- **CRUD**: `POST /v5/api/{Entity}/Save`, `POST /v5/api/{Entity}/Get`, `POST /v5/api/{Entity}/Delete`
- **CSV Export**: `GET /v5/api/{Entity}/CSVExport` or `/v5/api/{Entity}/csv`
- **Lists**: `GET /v5/api/List/{ListName}` — returns lookup data

The content script runs at `*.cadetnet.gov.au` so `fetch('/v5/api/...')` sends cookies automatically (same-origin).
