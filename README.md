# Questly

Duolingo-style productivity for Android: finish tasks, earn XP, keep your streak, clear daily quests. Built with React Native, Expo SDK 58, TypeScript and Expo Router. Works offline with no account.

## Features

- **XP loop** — tasks give XP by priority (+10 base, +10 High / +5 Medium, +5 before the deadline), subtasks +3, daily quests +10–15.
- **Daily goal** (Casual 10 / Regular 30 / Serious 50 / Intense 80 XP), **streak** of active days, levels, coins and achievements.
- **Tasks** — timeline, board and subtask-diagram views; swipe right to complete, left to delete; categories, priority, date/time, reminders.
- **Screenshot → task** — on-device text recognition (ML Kit) reads a screenshot or photo and fills in title, due date, category and subtasks. Free and offline.
- **Calendar**, **day planner** (time blocks within study hours), **statistics** with a shareable weekly card, **notifications** with quiet hours.

## Project layout

- `app/` — Expo Router screens (tabs: Home, Tasks, Calendar, More).
- `src/domain.ts` — data types and pure logic: planner, XP, streaks, quests, achievements.
- `src/scan.ts` — turns recognised text into a task draft (dates via `chrono-node`).
- `modules/text-scan` — local Expo module wrapping ML Kit text recognition.
- `src/store.tsx` — serialised persistence (SQLite on device, localStorage on web) and XP-gain events.

## Develop

```sh
npm ci
npm run typecheck
npx expo lint
npm test
```

## Build an APK (Windows)

```powershell
./scripts/Build-Phone.ps1            # builds, copies Questly-<version>.apk to the Desktop,
                                     # installs it if a phone is connected
./scripts/Mirror-Phone.ps1           # mirror the phone screen (scrcpy)
```

Native builds fail on long Windows paths, so the script builds from a short copy at `C:\fp` and uses Android SDK CMake 3.31.6 (`cmake;3.31.6`), whose ninja supports long paths.

## Release notes

- Package ID `com.scotzf.questly` is permanent once uploaded to Google Play.
- Before a Play Store release: create an upload keystore (or use EAS `eas build -p android --profile production`), store listing, privacy policy, Data safety form.
