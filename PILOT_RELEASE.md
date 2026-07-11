# M2.6 — Pilot release (TestFlight + Play Internal)

Step-by-step guide to ship the Spacehaat mobile app to pilot brokers.

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| [Expo account](https://expo.dev/signup) | Free tier works for internal builds |
| [EAS CLI](https://docs.expo.dev/build/setup/) | `npm i -g eas-cli` |
| Apple Developer Program | Required for TestFlight ($99/yr) |
| Google Play Console | Required for Play Internal Testing ($25 one-time) |
| Deployed backend API | Pilot builds use HTTPS — not `localhost` |

## One-time setup

### 1. Link EAS project

```bash
cd apps/mobile
eas login
eas init
```

`eas init` writes your **project ID** into `app.json` → `extra.eas.projectId` and sets the OTA updates URL. Commit the updated `app.json`.

### 2. Configure API URL for pilot builds

Pilot profiles in `eas.json` default to `https://api.spacehaat.in`. Override per environment:

```bash
# Staging API example
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.staging.spacehaat.in
```

Or edit the `env` block in `eas.json` for `preview`, `testflight`, and `play-internal` profiles.

### 3. Apple credentials (TestFlight)

```bash
eas credentials --platform ios
```

Follow prompts to set up Distribution Certificate + Provisioning Profile. EAS can manage these automatically.

Update `eas.json` → `submit.testflight.ios.appleTeamId` with your 10-character Team ID from [Apple Developer](https://developer.apple.com/account).

Create the app in **App Store Connect** with bundle ID `in.spacehaat.app` (must match `app.json`).

### 4. Google Play credentials (Internal testing)

1. Create app in Play Console with package `in.spacehaat.app`
2. Run `eas credentials --platform android`
3. Upload a service account JSON for submit (or use EAS managed credentials)

## Build commands

From `apps/mobile`:

| Goal | Command |
|------|---------|
| Quick internal APK (Android, share link) | `npm run build:preview:android` |
| Quick internal iOS (Ad Hoc link) | `npm run build:preview:ios` |
| **TestFlight** | `npm run build:testflight` |
| **Play Internal (AAB)** | `npm run build:play-internal` |

## Submit to stores (pilot tracks)

After a successful build:

```bash
# Upload latest iOS build to TestFlight
npm run submit:testflight

# Upload latest Android AAB to Play Internal track
npm run submit:play-internal
```

### TestFlight — add pilot users

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight**
2. Wait for build processing (~10–30 min)
3. **Internal Testing** → add testers (up to 100, must have App Store Connect roles)
4. **External Testing** → create group, add broker emails, submit for Beta App Review (first time only)

Testers install via the **TestFlight** app on iPhone.

### Play Internal — add pilot users

1. Open [Play Console](https://play.google.com/console) → your app → **Testing → Internal testing**
2. Create release from the uploaded AAB (draft → review → start rollout)
3. **Testers** tab → create email list → share opt-in link with brokers

Testers install via the Play Store link (may take a few hours to propagate).

## Push notifications on pilot builds

Push **does not work in Expo Go**. Pilot builds (`testflight` / `play-internal`) include `expo-notifications` and register tokens with your backend on login.

Ensure the deployed backend is reachable at the `EXPO_PUBLIC_API_URL` baked into the build.

## OTA updates (JS-only hotfixes)

After `eas init`, push JS fixes without a new store build:

```bash
eas update --channel preview --message "Fix lead filter bug"
```

Pilot builds on the `preview` channel receive updates on next app launch.

## Pilot test checklist

Before inviting brokers, verify on a physical device:

- [ ] Login with broker credentials
- [ ] Dashboard loads stats
- [ ] Leads list, filter, detail, notes, stage change
- [ ] Smart Match parse + create lead
- [ ] Proposals list + open/share PDF
- [ ] WhatsApp opens from lead detail
- [ ] Push notification on lead assign (another user assigns to you)
- [ ] Deep link `spacehaat://leads/:id` opens correct lead

## CI (optional)

GitHub Actions workflow `.github/workflows/mobile-preview.yml` can build on manual trigger. Add repository secret `EXPO_TOKEN` from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails — no icon | Ensure `apps/mobile/assets/icon.png` exists |
| API unreachable on device | Use HTTPS staging URL in `eas.json`, not LAN IP |
| TestFlight build missing | Use `testflight` profile (`distribution: store`), not `preview` |
| Push not received | Use pilot build; grant notification permission; check backend logs |
| `projectId` invalid | Run `eas init` again |

---

*M2.6 deliverable — pilot release infrastructure ready. Run `eas build` + `eas submit` when store accounts are configured.*
