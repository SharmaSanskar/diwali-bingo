# 🪔 Diwali Bingo

Realtime shared-card bingo for friends. Everyone opens one link and gets the **same card**. Each person crosses off their own squares, and the whole room sees a live stream of what's happening: who crossed something off, who finished a line, who is one square away, and who lit up the whole board. It comes with sounds, confetti and fireworks.

There's no leaderboard, just the live feed.

- **Frontend only.** Vite + React + TypeScript + Tailwind, deployed as a static site.
- **Realtime** uses Supabase Realtime **Broadcast + Presence** only. No tables, no auth, no migrations, no server.
- **The board lives in the link.** Title, items and options are compressed into the URL hash (`/{ROOMCODE}#{board}`), so nothing is stored anywhere.

---

## 1. Realtime setup (Supabase, about 5 minutes)

1. Go to <https://supabase.com>, sign in, and click **New project**. The free tier is fine. Pick any name, password and region.
2. Wait for the project to finish provisioning (about 1 minute).
3. Open **Project Settings → API** (also shown as **Connect** / **API Keys** in newer dashboards) and copy:
   - **Project URL**, e.g. `https://abcdxyz.supabase.co`
   - **anon / public** key (the long `eyJ…` string, or a `sb_publishable_…` key). **Don't** use the `service_role` / secret key.
4. In this folder:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

That's all. You don't need tables, SQL, policies or settings changes: Realtime **Broadcast** and **Presence** work out of the box on new projects.

> If the env vars are missing, the app shows a setup screen and offers **solo mode**, so you can still try it locally. In solo mode the feed only shows your own moves.

---

## 2. Run and test locally (quick)

```bash
npm install
npm run dev          # http://localhost:5173
```

### Test realtime with two players on one computer

Each browser profile counts as **one player** (the player id is saved in localStorage), so two normal tabs in the same browser are the *same* person. Use one of these instead:

- **Easiest:** open the invite link in one normal tab, then open it again in a second tab with `?player=2` added before the `#`:
  ```
  http://localhost:5173/ABC123?player=2#N4Ig...
  ```
  That tab gets its own identity (remembered for that tab only). Use `?player=3` and so on for more players.
- Or use a normal window plus an **incognito/private** window, or two different browsers.

### Test on your phone (same Wi-Fi)

```bash
npm run dev:host     # prints a Network URL like http://192.168.1.20:5173
```
Open that URL on your phone, create or join a room, and share the link between devices. (Clipboard and Web Share need HTTPS on some phones. If "Copy" fails, copy the URL from the address bar. Everything works on the deployed HTTPS site.)

### Checks

```bash
npm test             # vitest: board logic + link encoding
npm run build        # strict typecheck + production build
npm run preview      # serve the production build locally
```

### Manual test checklist

Open two player windows (see above) in the same room.

- [ ] **Same card:** both windows show identical squares in identical positions.
- [ ] **Refresh doesn't reshuffle:** reload one window and the layout stays the same.
- [ ] **Cross-off:** tap a square in window A. A gets a stamp animation and sound. B's feed shows "Aarav crossed off '…' 🪔" with a quiet tick (no toast).
- [ ] **Players strip:** A's chip shows `n/25` in both windows. Tap A's chip in B to highlight A's squares, and tap again to hide.
- [ ] **One away:** mark 4 squares of a line in A. Both feeds show "… needs '<missing item>' for Row X! 🔥", B gets a toast, and A's line plus the missing square pulse orange.
- [ ] **One-away rate limit:** quickly make two different lines one-away. Only one announcement fires within 5 s, and the other fires on a later tap.
- [ ] **Line complete:** finish the line. A gets a gold sweep, chime and confetti. B gets a toast, softer chime and a small burst.
- [ ] **No duplicates:** un-mark and re-mark that square. There's no second line announcement.
- [ ] **Un-mark:** un-marking plays a soft blip, announces nothing, and the line stops glowing.
- [ ] **24/25:** both feeds show "one square from the FULL BOARD".
- [ ] **Full board:** both windows get the full-screen banner, fireworks and fanfare. If B also finishes, a second banner follows.
- [ ] **Refresh keeps your marks:** reload A. Marks persist, nothing is re-announced, and B doesn't see a new "joined" entry.
- [ ] **Late joiner:** open a 3rd player. Their feed starts with "You joined the room", and the others see "… joined the party ✨".
- [ ] **Reactions:** tap 🎆 in A and it floats up in both windows.
- [ ] **Reconnect:** in DevTools set A to *Offline* and see the "Reconnecting…" chip. Go back online, the chip disappears, and A's presence comes back.
- [ ] **Mute:** the speaker button silences everything. Settings (⚙) has volume, friend cross-off sounds and notifications, and they stick after reload.
- [ ] **Notifications (optional):** enable in ⚙, switch A to another tab, and complete a line in B. A gets a system notification.
- [ ] **Code-only link:** open `/ABC123` without the `#…` part to see the friendly "ask for the full link" screen.
- [ ] **Mobile:** the card fits a phone with no sideways scroll, and the activity bar sits at the bottom with an unread badge.

---

## 3. Deploy to Vercel

1. Push this folder to a GitHub, GitLab or Bitbucket repo:
   ```bash
   git init && git add -A && git commit -m "Diwali Bingo"
   git remote add origin https://github.com/<you>/diwali-bingo.git
   git push -u origin main
   ```
   `.env` is in `.gitignore`, so your keys aren't committed.
2. Go to <https://vercel.com/new> and **import** the repo. Vercel detects **Vite** automatically (build `npm run build`, output `dist`), so leave those defaults.
3. Under **Environment Variables**, add both variables (for Production, and Preview if you like):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon/public key |
4. Click **Deploy**. Then open the site, create a room and send the link to friends.

Notes:
- `vercel.json` rewrites every path to `index.html`, so room links like `/ABC123#…` work on refresh.
- `VITE_` variables are baked in at **build time**. If you add or change them later, **redeploy** (Deployments → ⋯ → Redeploy).
- The anon key is meant to be public. This app uses no tables, so there's no data behind it.
- CLI alternative: `npm i -g vercel && vercel`, then `vercel env add VITE_SUPABASE_URL`, `vercel env add VITE_SUPABASE_ANON_KEY`, and `vercel --prod`.

---

## 4. Editing content

Everything lives in **`src/config/content.ts`**:

- `appTitle`, `tagline`
- `templates`: `{ id, title, items[] }`. Add, remove or edit templates. Each needs at least 24 items (25 if you turn off the free center). Extra items are fine: each room picks 24, shuffled by room code.
- `avatarEmojis`, `playerColors`, `reactionEmojis`

Hosts can also edit items per room on the **Create room** screen (one per line, with live count and validation). Those edits travel inside the invite link.

Options on the create screen:
- **Free center square** (default on)
- **Keep my item order** (no shuffle)
- **Hide item text in the feed** ("Aarav crossed off a square")

---

## How it works

| Piece | File |
|---|---|
| Seeded shuffle, 12 lines, one-away, full board, event diffing | `src/lib/board.ts` (+ `board.test.ts`) |
| Board ↔ URL (lz-string), room codes, link parsing | `src/lib/share.ts` (+ `share.test.ts`) |
| Supabase client + env check | `src/lib/supabase.ts` |
| Channel `room:{code}`, Presence + Broadcast, payload validation | `src/lib/room.ts` |
| Web Audio sounds (stamp, chimes, fanfare…) | `src/lib/audio.ts` |
| Confetti / fireworks (skipped with reduced motion) | `src/lib/effects.ts` |
| Marks, persistence, tap → diff | `src/hooks/useGame.ts` |
| Connection, presence, feed, toasts, banners, reactions | `src/hooks/useRoom.ts` |

- **Events are computed by the player who tapped.** The client diffs its own state before and after each tap and broadcasts `mark`, `line_complete`, `one_away` and `full_board`. Receivers just render them. Your own actions play locally right away, and your own echoes are ignored.
- **Dedupe:** what's already been announced is stored per room and player in localStorage, so un-mark/re-mark and refreshes never re-announce. Receivers also dedupe line and full-board events.
- **Presence** (throttled to about 4 updates/s) carries name, avatar, color, `markedCount`, line count, one-away and full-board flags, and a 25-bit `marked` bitmask for the "view their squares" highlight.
- **Late joiners** only see events from when they joined.
