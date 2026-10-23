# FocusPal

An Android-first, offline productivity companion built with React Native, Expo SDK 58, TypeScript, and Expo Router. iOS shares the application code but has not been device-tested.

## Run

Requires Node.js, an Android SDK, and JDK 17 or a compatible newer JDK. Install dependencies with `npm ci`.

```sh
npm start
npm run android
```

`npm run android` builds the native development app. For a connected USB device, use `adb reverse tcp:8081 tcp:8081` and start Metro with `npx expo start --dev-client --localhost`. The development app needs Metro running; a standalone preview build does not.

On this Windows setup, `./scripts/Start-Android.ps1` selects the locally installed JDK 17 and configures USB forwarding. Pass `-DeviceId <adb-device-id>` if multiple devices are connected.

`npm run web` runs a browser preview. It uses localStorage instead of native SQLite and does not schedule native reminders.

## Implemented

- Account-free onboarding; nickname and daily study window.
- Local task CRUD, due dates, priority, course, manual step checklists, and completed tasks.
- Today dashboard, completed-task/focus totals, planned-session timeline, and missed-session prompt.
- Deterministic daily plan preview: deadlines first, priority as a tie-breaker, up to 25-minute blocks, five-minute breaks, explicit insufficient-time warnings, and confirmation before replacing future sessions.
- Focus setup, custom durations, pause/resume, end early, summaries with notes, and optional step completion. An absolute timestamp restores elapsed time after backgrounding/restart; finishing is idempotent.
- Rescue Mode for overwhelm, uncertainty, distraction, and tiredness.
- Optional local reminders (planned sessions, 15 minutes before deadlines, focus session end), task navigation on notification tap, and permission-denied handling.
- Minimal-copy UI: state shown with icons, badges, progress ring/bars and short labels.
- Local data reset with confirmation, privacy copy, system font scaling, accessible labels, and a static bundled mascot.

## Architecture

`src/domain.ts` contains serializable data types, pure scheduler and timer logic. `src/store.tsx` serializes writes and publishes state only after successful persistence. Native storage is a SQLite singleton snapshot with a versioned schema; web storage is a preview-only adapter. No backend, AI, analytics, or credentials are required. Reminders are reconciled after saved changes and at startup; the nearest 50 are scheduled.

## Verification

```sh
npm run typecheck
npx expo lint
npm test
npm run export:android
```

Before release, test on physical Android devices: fresh install, CRUD offline and after restart, notification acceptance/denial and tapping after a cold start, timer background/restart/pause, collision warnings, large text, TalkBack, and data reset. Browser tests do not replace these native checks.

## Build and release

`eas.json` defines development-client, standalone preview APK, and production AAB profiles. EAS requires your own Expo account/project configuration. Alternatively build locally with the Android toolchain. The current `com.focuspal.app` identifier is a development default; confirm your permanent identifier before store submission. Production signing, Play Console identity, store artwork, a hosted privacy policy/contact, Data safety declarations, release testing, and final store submission remain release work. No signing secrets are committed.

Deferred: Kanban, diagrams, calendar, rewards/customization, recurring tasks, manual timeline dragging, exact-alarm guarantees, quiet hours/snooze, backup/import/export, translation, cloud sync, and AI. The planner schedules today's remaining work only; it does not infer external calendar commitments. Focus mode never blocks other apps. Native notification delivery can be delayed by Android permissions and battery management. iOS needs a separate build and device validation.

The app intentionally begins empty, without fake student assignments or progress.

### Dependency review

The initial npm audit reported 20 high-severity dependency entries, primarily propagated through the Metro/Expo development toolchain (`braces` and `node-forge`). Its suggested automatic fixes include incompatible framework downgrades, so no forced downgrade was applied. Review compatible upstream patches before a production release; keep the development server bound to localhost.
