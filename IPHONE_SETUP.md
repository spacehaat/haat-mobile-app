# iPhone + Expo Go — connection troubleshooting

## Your Mac IP (check before each session)

```bash
ipconfig getifaddr en0
```

Update `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:8080
```

Restart Expo after changing `.env` (`Ctrl+C`, then `npx expo start --lan --clear`).

---

## "Internet connection appears to be offline" (Expo Go)

This usually means the **phone cannot reach your Mac on the local network**, not that Wi‑Fi is down.

### Fix 1 — Enable Local Network for Expo Go (most common on iPhone)

1. iPhone **Settings → Privacy & Security → Local Network**
2. Turn **Expo Go** **ON**
3. Force-quit Expo Go and scan the QR code again

### Fix 2 — Same Wi‑Fi network

- Mac and iPhone must be on the **same Wi‑Fi** (not iPhone cellular only).
- Avoid **guest Wi‑Fi** — many routers block device-to-device traffic.
- Turn off **VPN** on Mac and iPhone.

### Fix 3 — Use iPhone Personal Hotspot (works when router blocks LAN)

1. iPhone: **Settings → Personal Hotspot → ON**
2. Connect your **Mac** to the iPhone hotspot Wi‑Fi
3. Run `ipconfig getifaddr en0` again (IP will change, e.g. `172.20.10.x`)
4. Update `.env` with the new IP + restart Expo and backend

### Fix 4 — Tunnel mode (Metro only; bypasses LAN for the app bundle)

Stop Expo (`Ctrl+C`), then:

```bash
cd apps/mobile
npx expo start --tunnel
```

Scan the new QR code. **Note:** login still calls your API — you still need Fix 1–3 for `EXPO_PUBLIC_API_URL`, or tunnel the backend separately.

---

## Start checklist

```bash
# Terminal 1 — API
npm run dev:backend

# Terminal 2 — Mobile (only ONE Expo process)
cd apps/mobile
npx expo start --lan --clear
```

Do **not** press `w` (web). Use **Expo Go** or Camera → scan QR.

---

## Verify from iPhone Safari

Open: `http://YOUR_MAC_IP:8080`

You should see: `{"ok":true,"service":"spacehaat-backend"}`

If Safari cannot load it, Expo Go will not work either — fix Wi‑Fi / Local Network first.
