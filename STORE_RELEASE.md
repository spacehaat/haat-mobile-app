# M3.6 — Public store release (App Store + Google Play)

After pilot testing (M2.6), use this guide for **production** store submission.

## Prerequisites

- Pilot feedback incorporated and critical bugs fixed
- Production API at `https://api.spacehaat.in` (or your domain) with valid SSL
- App Store Connect + Google Play Console apps created
- Privacy policy URL (required by both stores)
- Screenshots for all required device sizes

## Build production binaries

```bash
cd apps/mobile
eas build --profile production --platform ios
eas build --profile production --platform android
```

The `production` profile in `eas.json` uses:
- `distribution: store`
- Auto-incrementing build numbers
- `EXPO_PUBLIC_API_URL=https://api.spacehaat.in`

## Submit to stores

```bash
npm run submit:production:ios      # App Store Connect
npm run submit:production:android  # Google Play production track
```

Add these scripts if not present — see `package.json`.

## App Store (iOS)

1. **App Store Connect** → create app `Spacehaat` (bundle `in.spacehaat.app`)
2. Complete **App Privacy** questionnaire (data: email, phone, usage analytics if Sentry enabled)
3. Upload screenshots (6.7", 6.5", 5.5" iPhone + iPad if supporting tablet)
4. Write description highlighting: leads pipeline, Smart Match, proposals, offline notes
5. Set age rating **4+** (business productivity)
6. Submit for **App Review** — allow 1–3 days

## Google Play (Android)

1. **Play Console** → create app, complete store listing
2. Upload **AAB** from EAS production build
3. Complete **Data safety** form
4. Set content rating via questionnaire
5. Roll out to **Production** (or staged rollout 10% → 100%)

## Optional: Sentry monitoring (M3.5)

```bash
npx expo install @sentry/react-native
```

Set `EXPO_PUBLIC_SENTRY_DSN` in EAS secrets and wire `lib/monitoring.js`.

## Post-release

- Monitor crash-free rate in App Store Connect / Play Console
- Use `eas update --channel production` for JS-only hotfixes
- Collect broker feedback for M3 iterations

---

*See [PILOT_RELEASE.md](./PILOT_RELEASE.md) for internal testing before this step.*
