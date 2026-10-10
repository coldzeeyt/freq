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
| Like / share, creator, caption | `src/components/feed/ActionRail.tsx` |
| On Air: once a day, at a random local time, everyone gets 2 minutes to post a back-and-front camera photo (BeReal-style). You only see others' after posting yours; late posts are tagged | `src/app/onair/`, `src/components/onair/`, `src/lib/onAir.ts`, `server/onair.ts` |
| Talk: a Reddit-style board per station (posts, up/down votes, Hot/New/Top) and threaded comments on posts and videos | `src/app/talk/`, `src/app/comments/`, `src/components/talk/`, `server/talk.ts` |
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

## Server (Railway)

Freq has a real backend in `server/`: Express + Postgres, deployed on Railway as one service that also serves the web app.

- **Accounts:** sign up / log in with email and password (bcrypt hashes, 30-day signed tokens).
- **Feed:** `GET /api/feed?station=comedy&humanOnly=1` returns that station ranked for the signed-in person. The server runs the same ranking code as `src/services/ranking/`, with each person's taste profile stored in Postgres.
- **Posting:** `POST /api/videos` (multipart) stores the file on a Railway volume (`/data/media`) and serves it at `/media/...` with range requests, so videos stream.
- **Likes and signals:** likes, watch time and shares update counts and the taste profile.
- **On Air:** `GET /api/onair?tz=` returns today's window and moments (others' stay hidden until you post); `POST /api/onair` takes `back` and `front` photos. The daily time is derived from the date, so phones schedule their own reminders (expo-notifications) with no push server. Set `FREQ_ONAIR_LIVE=1` locally to open the window immediately for testing.
- **Deleting:** `POST /api/videos/:id/delete` removes your own post and its file. `POST /api/auth/delete` (Account → Delete account) removes the account, its posts, files, likes and profile.
- The server creates its tables on start. There are no sample videos: feeds only show what people post, and an empty station asks you to record one.

Railway setup (project `freq`): a `web` service (this repo; `railway.json` builds the web app and runs `npm run server`), a `Postgres` service, and a `freq-media` volume on `web` at `/data`. `web` has `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET`, `MEDIA_DIR=/data/media` and `NODE_ENV=production`.

Run it locally:

```bash
DATABASE_URL=postgres://... npm run server        # API + built web app on :3000
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start   # point the dev app at it
EXPO_PUBLIC_BACKEND=mock npx expo start           # or skip the server: everything stays on the device
```

The phone app talks to the production server by default. The website calls the server it's served from.

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

### Swapping backends

The UI only uses the interfaces in `src/services/types.ts`. `src/services/index.ts` picks the server implementations (`api/`) or the offline ones (`mock/`). Moving to another backend (Supabase, etc.) means writing new implementations of those interfaces.

`origin: 'camera'` is still sent by the app, so a determined user could fake it. To make the Human label tamper-proof, have the server issue one-time recording tokens to the camera screen.

## Notes and limits

- **Design:** one warm neutral palette plus a single signal orange, set in Archivo, Archivo Narrow and IBM Plex Mono.
- **Web autoplay:** browsers block autoplay with sound, so web starts muted. Tap the speaker icon to unmute.
- **Web recording** uses the browser's MediaRecorder (expo-camera can't record video on web). Web recordings are `blob:` URLs and only last for that browser session.
- **iOS Simulator has no camera.** Use Upload there, or test recording on a real phone.
- `assets/sounds` and `assets/noise` are generated by `npm run generate-assets`; app icons by `python3 scripts/generate-icons.py`.
- **Home-screen app:** the site is a PWA. On iPhone, Safari → Share → Add to Home Screen; on Android, Chrome → ⋮ → Install app. It then opens full-screen with its own icon.
