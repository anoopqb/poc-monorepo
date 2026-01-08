# Micro-Sites Monorepo

A scalable architecture for generating 500+ static micro-websites using Next.js 15, with two templates (website + floorplans) and incremental builds with change detection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    sites.config.json                             │
│              (property-001, property-002, ...)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
┌─────────────────────┐                 ┌─────────────────────┐
│  website-template   │                 │ floorplans-template │
│  (marketing pages)  │                 │  (listings, units)  │
└─────────────────────┘                 └─────────────────────┘
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   dist/         │
                    │   ├── property-001/
                    │   │   ├── index.html
                    │   │   └── floorplans/
                    │   └── property-002/
                    └─────────────────┘
```

## Project Structure

```
micro-sites-monorepo/
├── packages/
│   ├── website-template/           # Main property website
│   │   ├── app/
│   │   │   ├── page.tsx           # Homepage
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── next.config.js         # Dynamic basePath from env
│   │   └── package.json
│   │
│   └── floorplans-template/        # Floorplans listing
│       ├── app/
│       │   ├── page.tsx           # Floorplan cards
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── next.config.js
│       └── package.json
│
├── scripts/
│   ├── build-site.ts              # Build single site (website + floorplans)
│   ├── build-all.ts               # Build all sites
│   └── build-floorplans.ts        # Incremental floorplans build with change detection
│
├── data/
│   ├── floorplans-data.json       # Floorplan data per site
│   └── .build-cache.json          # Content hashes (auto-generated, gitignored)
│
├── dist/                          # Build output (gitignored)
│   ├── property-001/
│   │   ├── index.html
│   │   ├── _next/static/...
│   │   └── floorplans/
│   │       ├── index.html
│   │       └── _next/static/...
│   └── property-002/
│
├── sites.config.json              # Site configurations
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

# Build all sites defined in sites.config.json
npm run build:all
```

### Incremental Floorplans Builds

For hourly updates when only floorplan data changes:

```bash
# Build floorplans for a single site (with change detection)
npm run build:floorplans property-001

# Build floorplans for all sites (only changed ones)
npm run build:floorplans:all

# Force rebuild even if no changes detected
npm run build:floorplans property-001 -- --force
```

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

Define all sites to be generated:

```json
{
  "sites": [
    {
      "id": "property-001",
      "name": "Sunset Apartments",
      "basePath": "/property-001",
      "strapiEndpoint": "https://strapi.example.com/api/properties/001",
      "floorplansEnabled": true
    }
  ]
}
```

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

## Workflow for Production

1. **Initial deployment**: Run `npm run build:all` to build all sites
2. **Hourly updates**: 
   - Fetch data from Strapi and update `data/floorplans-data.json`
   - Run `npm run build:floorplans:all` (only rebuilds changed sites)
3. **Deploy**: Sync `dist/` folder to S3/CDN
