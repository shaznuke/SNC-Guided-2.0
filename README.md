# SNC Guided 2.2.3

A personal, static workout and nutrition PWA for GitHub Pages. The app name remains SNC Guided 2.0; the release version is 2.2.3. No build step is needed. The HEIC fallback is bundled locally.

## Session exit and coach sharing

Exit to dashboard pauses timers and keeps a resumable draft without writing History or Excel rows. Only Finish Session logs a workout; partial workouts still require confirmation. A failed draft save keeps the workout open.

After a successful finish, a coach message draft includes phase, week, date, checked sets, weights, repetitions or durations, RPE and notes. Open WhatsApp draft prepares the text for manual recipient selection and sending. Copy Summary Text and Download Coach Excel are also available. Completed records persist on this device and populate the downloadable Excel workbook; the app does not automatically update an external workbook.

## Exercise tutorials

91 YouTube links embedded in the coach’s two-page PDF are bundled against their exact exercise entries across both phases. Linked cards show Watch tutorial, opening YouTube separately after saving the active workout. The nine entries without embedded PDF links retain Add tutorial link. No replacement videos have been guessed.

Custom links still override the defaults; removing a custom link restores the PDF tutorial. Custom links are included in JSON backups. A failed draft save stops navigation and asks for a backup. Videos require internet access.

## What changed after the audit

- Full JSON backup export and restore with a file preview, Merge/Replace choices, schema validation and rollback journaling. Backups include active drafts, cycles, preferences, meals, reusable meals, WHOOP, goals and deleted items, but never Gemini credentials. Exports use the active workout in memory when saving has failed.
- Readable recovery warnings for damaged saved JSON. Original records are preserved and included in a recovery export; a recovery copy containing unreadable records cannot silently replace healthy records.
- History now has a full set editor. Delete is reversible through Settings → Recently deleted (last 30 meals/sessions).
- Accurate per-side volume, explicit one/two-side and total/per-hand load controls, and separate stored rep/duration metadata when a set is edited. Numeric reps, time and instructions remain distinguishable. Holds and bodyweight are excluded from external-load volume.
- Partial-session status and a main-set completion count. A partial finish requires an in-app confirmation and does not complete a program day. Old sessions without a status are assessed from the planned main sets.
- Named six-week training blocks. Old records belong to Original block. Progress, previous-week suggestions and Excel export use the selected block; History can show all blocks/phases.
- Previous-week lookup skips incomplete retries and shows the date of the completed source set. Each exercise has a configurable load increment.
- Meal and WHOOP date browsing, editable meals, portion multipliers, reusable meals, editable calorie/macronutrient goals and a macro-calorie alignment control.
- Separate Take Photo / Choose from Photos buttons. Native decoding is attempted first, with a locally bundled HEIC-to-JPEG fallback. The final image is fitted to a white 1024 × 1024 JPEG canvas before Google analysis. Decoding failures include an alternative JPEG conversion workflow.
- Configurable rest duration, next-unchecked-main-set navigation and visible 30s hard / 30s easy bike interval controls. Audio/interval cues stop when backgrounded.
- Offline and update notices, visible release version, numeric-keyboard hints, larger touch controls, dialog keyboard focus handling and reduced-motion support.
- An exclusive browser Web Lock prevents simultaneous app windows from overwriting the same records. A second window asks the user to close the first; unsupported older browsers show an upgrade notice. This coordinates the updated app, not an old release left running in another tab.

## Run and test

Use Node.js 22 or later:

```
npm start
npm test
```

Default preview: http://127.0.0.1:4173/SNC-Guided/. Set the PORT environment variable for an isolated test origin. Local preview records do not transfer to GitHub Pages or to another device.

51 automated tests pass. They cover backup round trips, invalid backups, rollback on storage failure, interrupted restore recovery, failed-save exports, corrupted JSON, historical edits/PRs, per-side volume, partial completion, training-block separation, dated logs, undo, progression, request errors, metronome sequencing, service-worker caching and tutorial URL validation/backup restoration. The tutorial editor was checked at 390 × 844: invalid links show an error, a test-only link survives reload/resume, and Watch tutorial opens its YouTube URL in a separate tab. The test fixture was removed afterward. Regression tests check all 91 PDF mappings and preserve the distinct Step Ups videos used in the two phases. Video availability remains controlled by YouTube and the uploader.

Browser checks demonstrated meal scaling, partial-session confirmation/persistence, history editing, deletion undo, goal alignment, backup-file validation/preview, merge restore, and the restored meal appearing on its original date. A public HEIC sample was converted by the bundled decoder and fitted to a 1024 × 1024 JPEG without a Google request. Phone-sized layout was inspected at 390 × 844, and a second browser window was confirmed blocked from editing while the first held the write lock. This is not a physical iPhone test.

Real Gemini text and meal-photo requests succeeded earlier in the local browser. The current tests also exercise request/error handling with mocked responses; production-origin authentication and actual iPhone camera/voice behavior still need checking. No claim is made that photographic calorie estimates are exact.

## Data conventions and recovery

Enter total external load moved by default. If entering the weight of each of two simultaneously moved dumbbells, choose the per-hand multiplier. For single-arm rows use one dumbbell's load and two sides. Existing numeric dumbbell records are not automatically doubled. `15 ES` is interpreted as 15 repetitions on each of two sides. Starting/best weight records use entered kg; they are not estimated one-repetition maxima. Keep the same load convention when comparing sessions.

A complete program day requires all prescribed main sets to be checked with nonzero numeric reps. Warm-ups/accessories are still logged but do not determine completion. Repeated completed workouts fill only one week/day slot.

Merge preserves this device's records on matching IDs and its existing settings/current draft. Replace uses the fields present in the backup and replaces the daily-log collection; legacy backups cannot restore fields they never contained. Restore while no session is actively running. Export current records before replacement. Credentials are untouched.

Storage remains local to the browser/device. Clearing website data, deleting the installed app, device failure or storage eviction can remove records. Keep backups outside the app. Cloud synchronization and a hosted credential gateway are not included in this static GitHub Pages release; those require an additional service/account.

## Publish and install

For future deployments, publish `index.html`, `manifest.json`, `sw.js`, and the complete `css`, `js`, and `icons` folders at the root of the existing repository. Keep the vendored decoder and license inside `js/vendor`. Keep the existing HTTPS origin and `/SNC-Guided-2.0/` path. Close older app windows before updating. Settings → Check for App Update activates a downloaded release after saving an active draft.

For a branch-based Pages setup use main / root. Wait for the deployment to succeed, then open https://shaznuke.github.io/SNC-Guided-2.0/ in iPhone Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add. Launch the icon, configure the key in Settings and run Test Gemini Connection. Use the home-screen app consistently for your records.

The old published build contained a reversible embedded key. This code has no bundled fallback. Replacing/revoking that exposed key in Google AI Studio remains an account-owner action; no credentials were rotated and no Git history was rewritten here. The configurable Gemini model and Test Connection button remain available. Avoid committing keys.

## Final device acceptance checks

On the user's actual iPhone: install from the published URL; enter and resume a draft after backgrounding; reopen offline after a successful online load; try camera and HEIC library photos; check audible voice/tone timing; export/restore a backup; open the coach workbook in Excel. VoiceOver, software-keyboard obstruction and battery/background behavior need physical-device validation.

See THIRD_PARTY.md for decoder provenance. The original audit is kept in the parent project directory as a historical snapshot; the findings above describe their current implementation status.
