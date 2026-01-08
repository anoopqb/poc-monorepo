# Turborepo Monorepo - Next.js Apps

Monorepo with two Next.js applications where `small-app` is built and embedded into `main-app` at build time.

## Structure

```
poc-monorepo-app/
├── apps/
│   ├── main-app/          # Primary CMS-driven app
│   └── small-app/         # Independent app (static export)
├── scripts/
│   └── copy-small-app-build.ts  # Build-time copy script
├── package.json
└── turbo.json
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs both apps in development mode.

## Build

```bash
npm run build
```

Build process:
1. `small-app` builds with static export to `apps/small-app/out/`
2. `main-app` builds
3. `small-app/out/*` is automatically copied to `main-app/public/small-app/`
4. `main-app` serves `small-app` at `/small-app`

## How It Works

- `small-app` is configured with:
  - `output: 'export'` (static export)
  - `basePath: '/small-app'`
  - `assetPrefix: '/small-app/'`
  
- After `small-app` builds, the copy script runs automatically
- `main-app` serves static files from `public/small-app`
- Both apps work standalone and integrated

## Standalone Testing

### Test small-app standalone:
```bash
cd apps/small-app
npm run build
npm run start
# Visit http://localhost:3000/small-app
```

### Test main-app with embedded small-app:
```bash
cd apps/main-app
npm run build
npm run start
# Visit http://localhost:3000 (main app)
# Visit http://localhost:3000/small-app (embedded small-app)
```

