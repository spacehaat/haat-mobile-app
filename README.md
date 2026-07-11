# Spacehaat — Mobile App (standalone repo)

Expo (React Native) for iOS and Android.

**GitHub:** [spacehaat/haat-mobile-app](https://github.com/spacehaat/haat-mobile-app)  
**Deploy:** EAS Build (TestFlight / Play Store)

This repo is **self-contained**. Shared code is vendored in `packages/` inside this repo (not a parent monorepo).

Related repos:
- Backend → [spacehaat/haat-backend](https://github.com/spacehaat/haat-backend)
- Web → [spacehaat/haat-web-app](https://github.com/spacehaat/haat-web-app)

## Local development

```bash
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your LAN IP or production API
npm run dev
```

Press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go.

## Environment

```bash
# Phone must reach API — use LAN IP for local backend, or production URL
EXPO_PUBLIC_API_URL=https://haat-backend.onrender.com
EXPO_PUBLIC_PORTAL_URL=https://haat-web-app.vercel.app
```

Copy `.env.example` → `.env` before running.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Expo dev server |
| `npm run ios` | Open iOS simulator |
| `npm run android` | Open Android emulator |

## M2 features (field workflows)

| Tab / screen | Capability |
|--------------|------------|
| **Smart Match** | Paste enquiry → parse → ranked inventory matches → create lead |
| **Proposals** | List, search, view status, open/share PDF |
| **Client portal** | Public `/p/:token` route for client feedback |
| **Leads** | Pipeline, notes, assignee, offline queue |
| **Browser** | Inventory search, filters, freshness |

## EAS builds

See `eas.json` for build profiles. Set secrets in EAS:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value https://haat-backend.onrender.com
```

## Shared packages (in-repo)

| Package | Purpose |
|---------|---------|
| `packages/access` | Permissions & screen gates |
| `packages/api-client` | HTTP client for backend API |
| `packages/types` | Shared types |
| `packages/utils` | Formatting helpers |
| `packages/inventory-schema` | Listing wizard schema |

When you change shared logic, edit `packages/` here and sync the same change to `haat-web-app` if needed.
