# Freq

Short-form vertical video, but instead of one algorithm feed you **tune between stations** like a radio.

Built with Expo (SDK 57) + TypeScript + expo-router. Runs in the iOS Simulator, on a phone via Expo Go, and in a web browser. There's no backend yet: mock data plus local storage, behind a service layer that a real backend can replace.

## Run it

```bash
npm install
npx expo start
```

Then:

- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS).
- **iOS Simulator:** press `i` (needs Xcode on a Mac).
- **Web:** press `w`. Mouse wheel or ↑ ↓ change videos, ← → turn the dial one station, double-click likes.

Checks: `npm run typecheck` and `npm run lint`.

## What's in v1

| Feature | Where |
| --- | --- |
| Vertical feed: full-screen paging, autoplay, tap to pause, loop, progress bar | `src/components/feed/` |
| The Dial: the only way to change station. Rotary knob with one detent per station, live frequency readout, static and sound while tuning | `src/components/dial/`, `src/state/useTuner.ts` |
| 25 stations (All + 24 topics), 5 mock videos each | `src/data/stations.ts`, `src/data/mockVideos.ts` |
| Tag routing: a post's tags (and caption #hashtags) pick its station, with "also fits" alternatives and a manual override | `src/lib/tagRouting.ts`, `src/components/post/` |
| Ranking: learns from watch time, completions, skips, likes and shares | `src/services/ranking/` |
| Welcome flow on first open: intro, a Human only (filter out AI) demo, dial practice, create account / log in | `src/app/welcome.tsx`, `src/components/onboarding/` |
| Test lab: practice dial with random targets, every haptic, the sounds, the Human only demo | `src/app/lab.tsx` (open it from your avatar) |
| Account page: profile, Test lab, replay welcome, log out | `src/app/me.tsx` |
| Human Only toggle + Human badge | `src/lib/human.ts`, `src/components/ui/HumanOnlyToggle.tsx` |
| Like / comment count / share, creator, caption | `src/components/feed/ActionRail.tsx` |
| Post: record with the in-app camera or upload, pick a station, add a caption | `src/app/post.tsx`, `src/components/post/` |

**Human rule** (one function, `isHumanMade`): a video is human if it was recorded with the Freq camera, or uploaded by a verified creator. Your own uploads are unverified. Each mock station has a mix, so toggling Human Only visibly changes every feed.

### Haptics

All haptics go through `src/lib/haptics.ts`:

| Moment | Feel |
| --- | --- |
| Dial passes a station | selection tick (+ click sound) |
| Dial locks onto a station | rigid impact |
| Swipe to the next video | soft impact |
| Like (button or double tap) | medium impact |
| Human Only toggle | medium impact |
| Dial practice target hit / account created / video posted / recording stopped | success notification |
| Recording starts | heavy impact |
| Taps (pause, share, buttons) | light impact |

On web, expo-haptics falls back to the Vibration API where the browser has one (Android Chrome). Desktop browsers and iOS Safari mostly don't vibrate.

### How ranking works

Each station's feed is ranked when you tune to it (`src/services/ranking/rank.ts`):

- **Quality:** engagement rate (likes + 3×comments + 5×shares per view), smoothed with a Bayesian prior so a video with 40 views and 10 likes can't beat a proven one on luck.
- **Affinity:** how much you like the video's tags, creator and (on All) station. Learned in `profile.ts`: watching to the end or rewatching is positive, swiping away in under 1.5s is negative, likes and shares count most. Interests halve after 3 days without reinforcement.
- **Freshness:** a 72-hour half-life.
- **Exploration:** a little per-session randomness so new things surface. The order stays stable while you browse.
- **Originals:** a small boost for human-made videos.
- **Already seen:** skipped videos sink hard, finished ones sink, half-watched ones sink a bit.
- **Variety:** a final pass stops the same creator appearing within 3 slots, and stops All from repeating a station back to back.

The taste profile lives on the device for now. With a backend, the same functions would run on the server over real view counts.

### Tag routing

`routeTags()` scores every station's keyword list against the tags: an exact match is worth 3, a plural/verb form 2 (`dogs` to `dog`), and a tag that contains a keyword 1 (`dogsofinstagram`). Earlier tags weigh slightly more. The top station is chosen, the next ones are offered as "also fits", and you can override it.

## Website (Railway)

The web build is a static export served by `serve`:

```bash
npm run build:web   # -> dist/
npm run serve:web   # serves dist on $PORT (default 3000)
```

`railway.json` tells Railway to run those two commands. On desktop the site shows the app as a phone-width column with keyboard hints beside it.

## Architecture

```
src/
  app/            routes (expo-router): feed (index), post (modal)
  components/     feed/, dial/, onboarding/, post/, ui/
  data/           stations + mock creators/videos
  lib/            haptics, sounds, the human rule, formatting
  services/       the backend seam
    types.ts      AuthService, VideoService, LikeService, SignalService, PreferencesService, MediaStore
    ranking/      taste profile + ranker (pure functions, portable to a server)
    mock/         current implementations (in-memory + AsyncStorage + local files)
    index.ts      picks which implementations the app uses
  state/          FreqProvider (account, station, Human only, likes, mute), feed + tuner hooks
```

### Adding a real backend (e.g. Supabase)

The UI only uses the interfaces in `src/services/types.ts`. To move to Supabase:

1. Add `src/services/supabase/` with `VideoService` (query a `videos` table filtered by `station_id`, plus the human rule, which can be a computed column or view), `LikeService` (a `likes` table), and `MediaStore` (upload to Supabase Storage and return the public URL).
2. Switch the factories in `src/services/index.ts`.
3. Store `origin` server-side and only set `camera` from the app's recording flow. A client-side flag can be faked, so the real backend should verify it (for example with signed upload tokens issued only to the in-app camera).

Swap `services/mock/localAuth.ts` for Supabase Auth: accounts are device-only for now (only a salted SHA-256 of the password is stored). Preferences (station, Human only) can stay device-local. Move `rankFeed` and the taste profile to the server so ranking can use real view counts and the whole catalogue.

## Notes and limits

- **Sample videos** are free clips from [Mixkit](https://mixkit.co/license/#videoFree), with Mixkit thumbnails as posters. Most are landscape and get cropped to fill the screen.
- **Design:** one warm neutral palette plus a single signal orange, set in Archivo, Archivo Narrow and IBM Plex Mono.
- **Web autoplay:** browsers block autoplay with sound, so web starts muted. Tap the speaker icon to unmute.
- **Web recording** uses the browser's MediaRecorder (expo-camera can't record video on web). Web recordings are `blob:` URLs and only last for that browser session.
- **iOS Simulator has no camera.** Use Upload there, or test recording on a real phone.
- `assets/sounds` and `assets/noise` are generated by `npm run generate-assets`.
