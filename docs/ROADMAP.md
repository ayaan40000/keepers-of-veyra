# Mnemos Roadmap to Public Release

Nov 1, 2026 · Ayaan. Source: the Claude Doc "Mnemos Roadmap to Public Release" (ROADMAP.pdf in this folder includes the roadmap diagram).

## Summary

Four more builds before a public v1.0: harden for release, deepen the learning, polish the world, then a closed beta of at least 20 adults for 4 weeks. The independent auditor rates v0.3 at 7/10 provisionally and lists 8 must-fix items, none large.

- **v0.4 Release hardening:** the 8 auditor must-fixes plus accessibility blockers.
- **v0.5 Learning depth:** harder, more realistic face drills, review built into relics and the Crypt, a coached first day.
- **v0.6 World and story:** gate restoration animations, chapter cutscenes, Crypt boss floors and weekly challenges.
- **v0.7 Closed beta:** real players tune difficulty, session length and the Crypt curve.
- **v0.8 Palace and polish:** walkable palace room, keyboard and controller, install prompt.
- **v1.0 Public release:** GitHub Pages, trademark cleared, licences shipped, after owner approval.

Already fixed: the shared pixel engine (`src/pixel/core.js`) was split into `raster.js` (plain JS) and `components.jsx` (React), so every module imports it normally.

## Status (Nov 1, 2026: v0.7.0 built)

| Build | Status |
| --- | --- |
| v0.4 Release hardening | Built. All backlog items in. Audit re-run still to do. |
| v0.5 Learning depth | Built. All backlog items in; 147 unit tests pass. |
| v0.6 World and story | Built. Layered depth effect left for v0.8 (day, dusk and dawn light done). Map as optional home view not done. |
| v0.8 Palace and polish | Built (v0.8.0): walkable palace rooms, keyboard and controller, install prompt after day 3, three-quarter faces, map depth, map as home. Beta skipped by owner decision. |
| v0.7 Closed beta | Software built (session-length measurement, beta report, problem report, Crypt end tally, simulated retune). The beta itself needs 20+ testers for 4 weeks: see `docs/BETA.md`. |

Not done in code, needs people: WCAG 2.2 AA check with NVDA and VoiceOver, device testing on real phones, 500-face representation review, trademark search, beta recruitment.

## Roadmap gates

| Build | Scope | Gate to move on |
| --- | --- | --- |
| v0.4 Release hardening | Auditor must-fixes, accessibility blockers, phone menu | Audit re-run at 8/10 |
| v0.5 Learning depth | Lure faces, echo floors, recall cards, coached first day | All tests pass |
| v0.6 World and story | Restoration animation, cutscenes, Crypt boss floors, weekly seed | Feature freeze |
| v0.7 Closed beta | 20+ adults for 4+ weeks, two usability rounds, retune difficulty | Crash-free, session length measured |
| v0.8 Palace and polish | Walkable palace room, keyboard and controller, install prompt | Trademark and licences clear |
| v1.0 Public release | GitHub Pages, free and open source | Owner approval |

## What each agent recommended

| Agent | Top recommendation | Other priorities | Biggest release risk |
| --- | --- | --- | --- |
| Faces and portraits | Lure faces that differ in only 1 or 2 features (M) | Same person, changed look; show key features after each answer; better contrast on very dark skin | Representation review of 500 faces; text-hint mode for low vision |
| Relics | Recall cards: answer a question to polish an item (M) | Fading relics when a probe slips; Calder's Ledger as a book; grouped unlock screen | Item ids must never change; sparse mid-year rewards |
| Undercroft (Crypt) | Echo floors re-asking items from two floors up (S) | Boss floor every 10th; weekly seed; modifiers | Untested difficulty; timed floors ignore extended timers; free retry on mid-floor close |
| World and scenes | Gate restoration animation (S) | Walkable palace room; cutscene panels; day and night; layered depth | Battery on low-end Android; ~880 KB bundle; map needs text labels |
| Game UI | 5-slot phone navigation with a Menu (S) | Coached day 1; settings with text size; keyboard/controller; install prompt | Focus hidden behind sticky bars; canvas text equivalents; colour-only cues |
| Independent auditor | 8 must-fixes before v1.0 | Migration tests, changelog, issue template, privacy statement | Stale offline cache; sound on by default; font licence text missing |

## Feature backlog

Effort: S under a day, M 1 to 3 days, L a week or more.

| Phase | Item | Area | Effort |
| --- | --- | --- | --- |
| v0.4 | Version the service-worker cache per release; "update available" prompt | Operations | S |
| v0.4 | Sound off by default; separate mute for dialogue blips | Accessibility | S |
| v0.4 | Ship OFL font licence text and a third-party licence list | Legal | S |
| v0.4 | Validate all save data (Crypt, relics, quests), 5 MB import cap, 50 corrupted-file tests | Security | M |
| v0.4 | Crypt honours `prefs.timerMult`; leaving mid-floor costs a flask | Crypt | S |
| v0.4 | Backup reminder after 7 days; Safari data-loss warning; storage persistence status | Data | S |
| v0.4 | Focus never hidden behind bars; 200% text; shapes as well as colour | Accessibility | M |
| v0.4 | Text equivalents for map, Crypt and portraits | Accessibility | M |
| v0.4 | Test that fails if any item id changes | Relics | S |
| v0.4 | Phone navigation: Today, Veyra, Crypt, Progress, Menu | UI | S |
| v0.4 | Session-length copy "about 20 to 30 minutes" until measured | Honesty | S |
| v0.5 | Lure faces and "same person, different look" drills | Faces | M |
| v0.5 | Show each face's key features after answering | Faces | S |
| v0.5 | Echo floors in the Crypt | Crypt | S |
| v0.5 | Recall cards and fading relics | Relics | M |
| v0.5 | Coached day 1 with Wren; first-time tips; replay tips | UI | M |
| v0.5 | Settings regrouped; text size 100 to 150%; volume controls | UI | M |
| v0.5 | Larger word and name pools | Content | M |
| v0.6 | Gate restoration animation on the map | World | S |
| v0.6 | Chapter cutscene panels | Story | M |
| v0.6 | Portrait moods match each dialogue line | Story | S |
| v0.6 | Calder's Ledger book view; grouped unlock screen after gates | Relics | S |
| v0.6 | Crypt boss floors, weekly seed, modifiers | Crypt | M |
| v0.6 | Day, night and weather palettes; layered depth effect | World | M |
| v0.6 | Mid-year rewards | Relics | S |
| v0.7 | Closed beta: 20+ adults, 4 weeks minimum | Testing | L |
| v0.7 | Two usability rounds of 6 to 8 people plus accessibility testers | Testing | M |
| v0.7 | Local stats on where Crypt runs end; retune toward floors 8 to 12 | Crypt | S |
| v0.8 | Walkable palace room | World | L |
| v0.8 | Keyboard and controller play; install prompt after day 3 | UI | M |
| v0.8 | Three-quarter view faces | Faces | L |
| Later | Shareable run card; opt-in leaderboard (needs a server) | Crypt | S / L |
| Later | Translations; anonymous opt-in research export | Platform | L |

## UI and UX changes

| Change | Phase |
| --- | --- |
| Five-slot phone menu (Relics, Palaces, Keeper inside Menu); desktop keeps side list | v0.4 |
| Crisp pixel scaling at whole multiples; empty states for Relics, Crypt, Palaces, Progress | v0.4 |
| Coached first day; settings in four groups (Audio, Display, Training, Data) | v0.5 |
| Reliquary "recently earned" row and skill-based hints; Crypt failure coaching, run map, "Resume descent" | v0.5 |
| Map as optional home view; one grouped unlock moment per session | v0.6 |
| Keyboard and controller; install flow | v0.8 |

Study and recall screens stay still and quiet in every phase.

## Public release requirements

### Must
- [ ] Honest claims: "performance on Mnemos tasks" only; no memory or IQ promises.
- [ ] Session length copy "about 20 to 30 minutes" until beta measures the median.
- [ ] Training Score provisional for 14 days; "not an IQ or clinical test" on onboarding, Progress and README.
- [ ] Data safety: local-only notice, 7-day backup reminder, Safari warning, export/import covers all state.
- [ ] Import security: full validation, 5 MB cap, no imported text as HTML, 50 corrupted files tested.
- [ ] Legal: trademark search for "Mnemos" (US, EU, Canada); OFL text shipped; third-party licence list; content attribution list.
- [ ] Accessibility: WCAG 2.2 AA with NVDA and VoiceOver; sound off by default; 200% text.
- [ ] Devices: desktop Chrome, Firefox, Safari, Edge; iPhone Safari; Android Chrome incl. one low-end phone.
- [ ] Closed beta: 20+ adults for 4+ weeks.
- [ ] Versioned offline cache with update prompt.

### Should
- [ ] Old-save migration tests; changelog; issue template and in-app problem report; privacy statement with a no-network CI check; performance budget; 500-face representation review.

### Could
- [ ] Opt-in research export; translations; small pilot study.

## Open decisions

1. Keep the name "Mnemos" if the trademark search finds conflicts (fallback: "Keepers of Veyra").
2. Sound off by default (recommended).
3. No leaderboards for v1.0.
4. Walkable palace in v0.8, after the beta.
5. Map as home screen: optional first.
6. Approve three story choices from the relics build (Gallery key, Warden ring, page 12 text).
7. Beta recruitment: owner recruits 20+ adults.
8. GitHub account and repository name. Decided Nov 1, 2026: ayaan40000/keepers-of-veyra, hosted on GitHub Pages for the closed beta.
