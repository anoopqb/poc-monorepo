# Micro-Sites Monorepo

A scalable architecture for generating 500+ static micro-websites using Next.js 15, with two templates (website + floorplans), incremental builds with change detection, and per-site branding.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    sites.config.json                             │
│              (property-001, property-002, ...)                   │
│              + brand tokens per site                             │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ website-template│  │floorplans-templ │  │ data/themes/    │
│ (marketing)     │  │ (listings)      │  │ (CSS overrides) │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ @repo/shared    │
                    │ (Header, utils) │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   dist/         │
                    │   ├── property-001/
                    │   │   ├── index.html (purple theme)
                    │   │   └── floorplans/
                    │   └── property-002/
                    │       ├── index.html (blue theme)
                    │       └── floorplans/
                    └─────────────────┘
```

## Project Structure

```
micro-sites-monorepo/
├── packages/
│   ├── shared/                        # Shared components and styles
│   │   ├── components/
│   │   │   ├── Header.tsx            # Reusable header component
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   ├── header.css            # Header styles (uses CSS variables)
│   │   │   └── variables.css         # Default CSS variable values
│   │   └── package.json
│   │
│   ├── website-template/              # Main property website
│   │   ├── app/
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── layout.tsx            # Injects CSS variables
│   │   │   ├── globals.css           # Uses CSS variables
│   │   │   └── theme.css             # Replaced at build time
│   │   ├── next.config.js            # Dynamic basePath + brand env
│   │   └── package.json
│   │
│   └── floorplans-template/           # Floorplans listing
│       ├── app/
│       │   ├── page.tsx              # Floorplan cards
│       │   ├── layout.tsx            # Injects CSS variables
│       │   ├── globals.css           # Uses CSS variables
│       │   └── theme.css             # Replaced at build time
│       ├── next.config.js
│       └── package.json
│
├── scripts/
│   ├── build-site.ts                 # Build single site (website + floorplans)
│   ├── build-all.ts                  # Build all sites
│   ├── build-floorplans.ts           # Incremental floorplans build
│   └── watch-floorplans.ts           # File watcher for auto-builds
│
├── data/
│   ├── floorplans-data.json          # Floorplan data per site
│   ├── themes/                       # Per-site theme CSS overrides
│   │   ├── _default.css              # Fallback (no overrides)
│   │   ├── property-001.css          # Purple theme overrides
│   │   └── property-002.css          # Blue theme overrides
│   └── .build-cache.json             # Content hashes (gitignored)
│
├── dist/                             # Build output (gitignored)
│   ├── property-001/
│   │   ├── index.html
│   │   ├── _next/static/...
│   │   └── floorplans/
│   └── property-002/
│
├── sites.config.json                 # Site configurations + branding
├── turbo.json
└── package.json
```

## Setup

```bash
npm install
```

## Commands

### Full Site Builds

```bash
# Build a single site (website + floorplans)
npm run build:site property-001

# Build all sites defined in sites.config.json (2 parallel by default)
npm run build:all

# Build with custom concurrency (e.g., 4 parallel builds)
npm run build:all -- --concurrency 4
npm run build:all -- -c 4

# Or set via environment variable
CONCURRENCY=4 npm run build:all
```

### Incremental Floorplans Builds

For hourly updates when only floorplan data changes:

```bash
# Build floorplans for a single site (with change detection)
npm run build:floorplans property-001

# Build floorplans for all sites (only changed ones, 2 parallel by default)
npm run build:floorplans:all

# Build with custom concurrency
npm run build:floorplans:all -- --concurrency 4

# Force rebuild even if no changes detected
npm run build:floorplans property-001 -- --force
```

### Parallel Builds

Both `build:all` and `build:floorplans:all` support parallel execution:

| Flag | Description |
|------|-------------|
| `--concurrency N` or `-c N` | Number of parallel builds (default: 2) |
| `CONCURRENCY` env var | Alternative way to set concurrency |

**Performance estimate** (10 sites, ~30s each):

| Concurrency | Time |
|-------------|------|
| 1 (sequential) | ~5 min |
| 2 (default) | ~2.5 min |
| 4 | ~1.25 min |

**Note**: Higher concurrency uses more CPU/memory. Start with 2-4 and adjust based on your machine.

### Watch Mode (Auto-Build on Changes)

Automatically rebuild when `data/floorplans-data.json` changes:

```bash
# Watch with default 60-second polling interval
npm run watch:floorplans

# Watch with custom interval (in seconds)
npm run watch:floorplans -- --interval 10    # every 10 seconds
npm run watch:floorplans -- -i 30            # every 30 seconds

# Or set via environment variable
POLL_INTERVAL=120 npm run watch:floorplans   # every 2 minutes
```

The watcher:
- Polls the floorplans JSON file at the specified interval
- Detects changes using MD5 hash comparison
- Triggers incremental build (only rebuilds changed sites)
- Prevents concurrent builds

### Development

```bash
# Run both templates in development mode
npm run dev

# Serve the built dist folder locally
npm run serve:dist
```

### Utility

```bash
# Clean all build outputs
npm run clean

# Run linting
npm run lint
```

## Configuration

### sites.config.json

Define all sites to be generated with their branding:

```json
{
  "sites": [
    {
      "id": "property-001",
      "name": "Sunset Apartments",
      "basePath": "/property-001",
      "strapiEndpoint": "https://strapi.example.com/api/properties/001",
      "floorplansEnabled": true,
      "brand": {
        "primaryColor": "#667eea",
        "secondaryColor": "#764ba2",
        "accentColor": "#f093fb",
        "headerBg": "#ffffff",
        "headerText": "#333333",
        "fontFamily": "system-ui, -apple-system, sans-serif"
      }
    }
  ]
}
```

### Brand Tokens

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `primaryColor` | `--brand-primary` | Main brand color (buttons, links, accents) |
| `secondaryColor` | `--brand-secondary` | Secondary color (gradients) |
| `accentColor` | `--brand-accent` | Accent/highlight color |
| `headerBg` | `--brand-header-bg` | Header background color |
| `headerText` | `--brand-header-text` | Header text color |
| `fontFamily` | `--brand-font-family` | Font family for the site |

### data/themes/ (Per-Site CSS Overrides)

For complex style overrides beyond color tokens, create a CSS file matching the site ID:

```css
/* data/themes/property-001.css */

/* Custom card styling */
.floorplan-card {
  border-top: 3px solid var(--brand-primary);
}

.floorplan-card:hover {
  border-top-color: var(--brand-accent);
}
```

The build script copies the appropriate theme file to the template before building. If no site-specific theme exists, `_default.css` is used.

### data/floorplans-data.json

Floorplan data per site (can be updated hourly from Strapi):

```json
{
  "property-001": {
    "floorplans": [
      { "id": "fp-1", "name": "1 Bedroom Classic", "beds": 1, "baths": 1, "sqft": 750 }
    ],
    "lastUpdated": "2026-01-08T12:00:00Z"
  }
}
```

## Branding System

The branding system combines two approaches:

1. **CSS Variables from Config**: Brand tokens are injected as CSS custom properties on the `<html>` element at build time. Components use these variables for colors, fonts, etc.

2. **Per-Site Theme CSS**: Complex style overrides (shadows, borders, layouts) are defined in `data/themes/{site-id}.css` and copied to the template before building.

### How It Works

```
sites.config.json          →  layout.tsx injects CSS vars on <html>
    brand: { ... }              style="--brand-primary:#667eea;..."

data/themes/property-001.css  →  Copied to app/theme.css before build
                                   Imported by globals.css
```

### Example: Two Different Themes

| Feature | Property-001 (Sunset) | Property-002 (Harbor View) |
|---------|----------------------|---------------------------|
| Background | Purple gradient | Blue gradient |
| Header | White, dark text | Dark blue, white text |
| Card style | Top purple border | Left blue border |
| Accent | Purple underlines | Blue with header line |

## Shared Components

The `@repo/shared` package provides reusable components:

```tsx
import { Header } from '@repo/shared/components';

export default function Page() {
  return (
    <Header
      siteName="Sunset Apartments"
      floorplansUrl="/property-001/floorplans"
      currentPage="home"
    />
  );
}
```

The Header component automatically uses CSS variables for colors, so it adapts to each site's branding.

## Change Detection

The `build:floorplans` commands use content hashing to detect changes:

| Scenario | Behavior |
|----------|----------|
| First build (no cache) | Builds and creates cache |
| No data change | Skips build |
| Data changed | Rebuilds and updates cache |
| `--force` flag | Always rebuilds |

Example output:

```
🔍 Checking 2 sites for changes...

   ✓ No changes for property-001 (hash: 20199e91...)
   🔄 Data changed for property-002
      Previous: abc123...
      Current:  def456...

[builds property-002...]

📊 Summary:
   Rebuilt: 1 sites
   Skipped: 1 sites (no changes)
```

## URL Structure

When served (locally or via CDN):

| URL | Content |
|-----|---------|
| `/property-001/` | Website homepage |
| `/property-001/floorplans/` | Floorplans listing |
| `/property-002/` | Website homepage |
| `/property-002/floorplans/` | Floorplans listing |

## Environment Variables

Templates use these env vars (set automatically by build scripts):

| Variable | Description |
|----------|-------------|
| `SITE_ID` | Site identifier (e.g., `property-001`) |
| `SITE_NAME` | Display name (e.g., `Sunset Apartments`) |
| `SITE_BASE_PATH` | URL base path (e.g., `/property-001`) |
| `FLOORPLANS_DATA` | JSON string of floorplan data |
| `FLOORPLANS_URL` | Link to floorplans section |
| `WEBSITE_URL` | Link back to main website |
| `BRAND_PRIMARY_COLOR` | Primary brand color |
| `BRAND_SECONDARY_COLOR` | Secondary brand color |
| `BRAND_ACCENT_COLOR` | Accent color |
| `BRAND_HEADER_BG` | Header background color |
| `BRAND_HEADER_TEXT` | Header text color |
| `BRAND_FONT_FAMILY` | Font family |

## Workflow for Production

1. **Initial deployment**: Run `npm run build:all` to build all sites
2. **Hourly updates**: 
   - Fetch data from Strapi and update `data/floorplans-data.json`
   - Run `npm run build:floorplans:all` (only rebuilds changed sites)
3. **Deploy**: Sync `dist/` folder to S3/CDN

## Adding a New Site

1. Add site configuration to `sites.config.json` with brand tokens
2. Add floorplan data to `data/floorplans-data.json`
3. (Optional) Create `data/themes/{site-id}.css` for custom style overrides
4. Run `npm run build:site {site-id}`

## Infrastructure Diagram

```text
┌──────────────────────┐
│      Developers      │
│ (Code / Manual Ops)  │
└─────────┬────────────┘
          │
┌─────────┼───────────────────────────────────────────────┐
│         │                       │                        │
│         │                       │                        │
▼         ▼                       ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Manual / Pull Flow  │  │   Auto / Push Flow   │  │  Floorplan Pipeline  │
│ (Release / Override) │  │ (On Code Commit)     │  │ (Scheduled / Event)  │
└─────────┬────────────┘  └─────────┬────────────┘  └─────────┬────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
│   AWS CodePipeline   │  │   AWS CodePipeline   │  │     EventBridge Rule   │
│  (Manual Trigger)    │  │  (GitHub Trigger)    │  │  (Hourly / Custom)    │
└─────────┬────────────┘  └─────────┬────────────┘  └─────────┬────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
│  Source: GitHub ZIP  │  │  Source: GitHub ZIP  │  │   CodeBuild (Direct)   │
│ (Pipeline Artifact)  │  │ (Auto Triggered)     │  │  (No Pipeline)        │
└─────────┬────────────┘  └─────────┬────────────┘  └─────────┬────────────┘
          │                           │                           │
          └───────────────┬───────────┴───────────┬─────────────┘
                          ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                AWS CodeBuild                                  │
│------------------------------------------------------------------------------│
│ install:                                                                      │
│   - nodejs 20                                                                 │
│   - npm ci                                                                    │
│                                                                              │
│ pre_build:                                                                    │
│   - Read ENV vars (BUILD_MODE / SITE_ID / FORCE / CONCURRENCY)                │
│   - Defaults + Validation                                                     │
│                                                                              │
│ build:                                                                        │
│   - Full site / Incremental / Floorplan build                                 │
│   - Change detection                                                          │
│   - FORCE override                                                            │
│                                                                              │
│ post_build:                                                                   │
│   - Sync artifacts to S3                                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────┐
│        Amazon S3          │
│  (Static Site Bucket)    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│      CloudFront CDN      │
│  (Cache + Invalidation)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│        End Users         │
│   (Web / Mobile / SEO)  │
└──────────────────────────┘
```
