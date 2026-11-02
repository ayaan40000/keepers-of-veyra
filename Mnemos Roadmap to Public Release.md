# Mnemos Roadmap to Public Release

Nov 1, 2026 · @Ayaan

## Summary

The team recommends four more builds before a public v1.0: harden for release first, then deepen the learning, then polish the world, then run a closed beta of at least 20 adults for 4 weeks. The independent auditor rates v0.3 at 7/10 provisionally and lists 8 must-fix items for release, none of them large.

- **v0.4 Release hardening:** fix the 8 auditor must-fixes plus accessibility blockers.
- **v0.5 Learning depth:** harder, more realistic face drills, review built into relics and the Crypt, and a coached first day.
- **v0.6 World and story:** gate restoration animations, chapter cutscenes, Crypt boss floors and weekly challenges.
- **v0.7 Closed beta:** real players tune the difficulty, the session length and the Crypt curve.
- **v1.0 Public release:** GitHub Pages, trademark cleared, licences shipped.

One earlier blocker is already fixed. All five agents flagged that the shared pixel engine could not be imported; it was split into plain and React parts during v0.3 integration.

## What each agent recommended

Each specialist was asked for its top improvements, UI changes and release risks. Their strongest single idea is listed first.

| Agent | Top recommendation | Other priorities | Biggest release risk |
| --- | --- | --- | --- |
| Faces and portraits | Lure faces that differ in only 1 or 2 features, so players practise fine detail (M) | Same person with a changed look; show the face's key features after each answer; fix contrast on very dark skin tones | Representation review of 500 sample faces; a text-hint mode for low vision |
| Relics and collectibles | Recall cards: answer a question about an item to polish it, turning the collection into review (M) | Fading relics when a probe slips; Calder's Ledger as a book; group unlock moments into one screen | Item ids must never change; mid-year months have too few rewards |
| The Undercroft (Crypt) | Echo floors that re-ask items from two floors up, giving spaced recall inside a run (S) | Boss floor every 10th; a weekly fixed seed; optional modifiers | Difficulty untested; timed floors ignore the extended-timer setting; closing mid-floor gives a free retry |
| World and scenes | Restoration animation when a gate is passed: fog rolls back, lamps light (S) | Walkable palace room; chapter cutscene panels; day and night; layered depth effect | Battery on low-end Android; bundle size about 880 KB; map needs text labels |
| Game UI | Phone navigation: 5 slots with a Menu, since 6 tabs are cramped (S) | Coached first day with tips; regrouped settings with text size; keyboard and controller play; install prompt | Focus hidden behind sticky bars; canvas screens need text equivalents; colour-only cues |
| Independent auditor | 8 must-fixes before v1.0 (Section 6) | Migration tests, changelog, issue template, privacy statement | Old builds stuck in the offline cache; sound on by default; font licence text missing |

## Roadmap

&#91;embedded content: roadmap · 6 releases, 5 gates\]

Each build must pass its gate before the next starts. The beta in v0.7 is the slowest step, because it needs at least 4 weeks of real use.

## Feature backlog by phase

Effort: S is under a day of build work, M is 1 to 3 days, L is a week or more. The beta and its usability testing set the real calendar more than build effort does.

| Phase | Item | Area | Effort | Why |
| --- | --- | --- | --- | --- |
| v0.4 | Version the offline cache per release and show "update available" | Operations | S | Players can get stuck on an old build |
| v0.4 | Sound off by default, separate mute for dialogue blips | Accessibility | S | Auditor must-fix |
| v0.4 | Ship the font licence text and a third-party licence list | Legal | S | Required by the font licence |
| v0.4 | Validate all new save data (Crypt, relics, quests), cap import size, test 50 corrupted files | Security | M | Untrusted files must never break the app |
| v0.4 | Crypt respects the extended-timer setting; leaving mid-floor costs a flask | Crypt | S | Accessibility and fairness |
| v0.4 | Backup reminder after 7 days, Safari data-loss warning, storage status | Data | S | iPhone Safari can delete data after about 7 days unused |
| v0.4 | Focus never hidden behind bars; 200% text with nothing clipped; shapes as well as colour | Accessibility | M | WCAG 2.2 AA blockers |
| v0.4 | Text equivalents for map, Crypt and portraits | Accessibility | M | Screen-reader users |
| v0.4 | Test that fails if any item id changes | Relics | S | Renaming an id erases ownership |
| v0.4 | Phone navigation: Today, Veyra, Crypt, Progress, Menu | UI | S | Six tabs are cramped at 390 px |
| v0.4 | Session-length copy: "about 20 to 30 minutes" until measured | Honesty | S | Auditor must-fix |
| v0.5 | Lure faces and "same person, different look" drills | Faces | M | Trains the detail real name recall needs |
| v0.5 | Show each face's key features after answering | Faces | S | Teaches what to notice |
| v0.5 | Echo floors in the Crypt | Crypt | S | Spaced recall inside a run |
| v0.5 | Recall cards and fading relics | Relics | M | Collection becomes review, not grind |
| v0.5 | Coached day 1 with Wren, first-time tips, replay tips | UI | M | New players understand Lumen, keys, relics |
| v0.5 | Settings regrouped, text size 100 to 150%, volume controls | UI | M | Comfort and accessibility |
| v0.5 | Larger word and name pools | Content | M | Deep Crypt runs repeat items |
| v0.6 | Gate restoration animation on the map | World | S | The payoff moment for a month's work |
| v0.6 | Chapter cutscene panels with Wren and the player | Story | M | Story told visually, not only in text |
| v0.6 | Portrait moods match each dialogue line | Story | S | Characters feel alive |
| v0.6 | Calder's Ledger as a book; grouped unlock screen after gates | Relics | S | Stronger reward moments |
| v0.6 | Crypt boss floor every 10th, weekly seed, modifiers | Crypt | M | Reasons to return and push limits |
| v0.6 | Day, night and weather palettes; layered depth effect | World | M | Atmosphere and the requested 3D feel, without heavy 3D |
| v0.6 | Mid-year rewards to fill the sparse months | Relics | S | Balance |
| v0.7 | Closed beta: 20+ adults, 4 weeks minimum | Testing | L | Tunes difficulty and length with real data |
| v0.7 | Two usability rounds of 6 to 8 people plus accessibility testers | Testing | M | Finds confusing game terms |
| v0.7 | Local stats on where Crypt runs end; retune the curve | Crypt | S | Target runs ending around floors 8 to 12 |
| v0.8 | Walkable palace room: walk between stops, items appear as props | World | L | Strongest learning hook of all proposals |
| v0.8 | Keyboard and controller play; install prompt after day 3 | UI | M | Desktop and installed-app players |
| v0.8 | Three-quarter view faces | Faces | L | Recognising a face from a new angle |
| Later | Shareable run card image; opt-in leaderboard (needs a server) | Crypt | S / L | Leaderboard breaks the offline design, so last |
| Later | Translations; optional anonymous research export | Platform | L | Wider reach and evidence |

## UI and UX changes

The interface already reads as a game; the next changes are about navigation on phones, teaching new players, and making every screen usable without sight of a canvas.

| Change | What it looks like | Phase |
| --- | --- | --- |
| Five-slot phone menu | Today, Veyra, Crypt, Progress, Menu (Relics, Palaces, Keeper inside Menu); desktop keeps the side list | v0.4 |
| Map as the home view (option) | Tap a district to open a sheet with its banner, quest and Begin | v0.6 |
| Coached first day | Wren walks the player through day 1; tips appear the first time Lumen, keys and relics show up; tips can be skipped and replayed | v0.5 |
| Settings in four groups | Audio, Display (theme, readable text, text size, motion), Training (timers), Data | v0.5 |
| One unlock moment per session | A single grouped reward screen; a gate pass shows Calder's page first, then the artifact | v0.6 |
| Reliquary helpers | "Recently earned" row; hints that point to a skill, never to grinding | v0.5 |
| Crypt feedback | Coaching after a failed floor based on the error type; a small floor map of the run; "Resume descent" on Today | v0.5 |
| Crisp pixel scaling | Scenes snap to whole multiples (2x, 3x) so pixels stay even | v0.4 |
| Empty states | Relics, Crypt, Palaces and Progress explain what is coming and when | v0.4 |
| Keyboard and controller | Arrow keys through menus, number keys for tabs, Esc to leave, gamepad support | v0.8 |
| Install flow | Offer "install as app" after day 3, with iPhone instructions; storage made persistent | v0.8 |

The study and recall screens stay still and quiet in every phase. That rule protects the learning and is not up for trade.

## Public release requirements

A public v1.0 needs everything under **Must**. Most of it is small; the two long poles are the 4-week closed beta and the trademark search on the name.

### Must

- [ ] **Honest claims:** every claim says "performance on Mnemos tasks"; no promise of better memory or IQ; techniques cited, outcomes not.
- [ ] **Session length:** copy says "about 20 to 30 minutes" until the beta measures the real median.
- [ ] **Scores:** Training Score marked provisional for 14 days; "not an IQ or clinical test" on onboarding, Progress and the README; no game reward can raise a learning score.
- [ ] **Data safety:** "stored only in this browser" shown clearly; backup reminder after 7 days; Safari data-loss warning; export and import include Crypt, relics and quest state.
- [ ] **Import security:** full validation of every field, a 5 MB cap, no imported text ever shown as HTML, 50 corrupted files tested.
- [ ] **Legal:** trademark search for "Mnemos" in the US, EU and Canada (software and education classes); font licence text shipped; third-party licence list; content attribution list for facts and vocabulary.
- [ ] **Accessibility:** WCAG 2.2 AA checked with NVDA and VoiceOver; sound off by default; no motion during study or recall; text at 200% with nothing lost.
- [ ] **Devices:** Chrome, Firefox, Safari and Edge on desktop; Safari on iPhone; Chrome on Android, including one low-end Android phone.
- [ ] **Closed beta:** 20 or more adults for at least 4 weeks, long enough to reach the first monthly challenge and the 7-day recalls; track completion and bugs.
- [ ] **Updates:** offline cache versioned per release with an "update available" prompt.

### Should

- [ ] Test that loads every older save format through migration.
- [ ] Version numbers and a changelog for every release.
- [ ] GitHub issue template and an in-app "report a problem" that exports a cleaned copy of state.
- [ ] Privacy statement, plus an automated check that the app makes no network calls.
- [ ] Performance budget: page load and frame time measured on a low-end phone.
- [ ] Representation review of a 500-face sample by a few outside reviewers.

### Could

- [ ] Optional, anonymous, opt-in research export.
- [ ] Translations.
- [ ] A small pilot study comparing players with their own day-1 baseline.

**Hosting:** GitHub Pages from a public repository, code under MIT and story and art under CC BY 4.0, published only after your approval.

## Open decisions for you

| # | Decision | Recommendation |
| --- | --- | --- |
| 1 | Keep the name "Mnemos" if the trademark search finds conflicts? | Search first; keep "Keepers of Veyra" as a fallback title |
| 2 | Sound on or off by default | Off by default, with a clear sound button (auditor) |
| 3 | Leaderboards (needs a server, breaks offline-only) | Not for v1.0; ship a shareable run card instead |
| 4 | Walkable palace room (largest build item) | Build after the beta, in v0.8 |
| 5 | Map as the home screen | Offer it as an option first, decide from beta feedback |
| 6 | Three story choices made during the relics build: the Gallery key and the Warden ring are artifacts rather than side-quest rewards, and page 12 quotes Calder's final lesson | Approve as written, or say which to change |
| 7 | Who runs the beta and how testers are found | You recruit 20+ adults; the team prepares the beta build, feedback form and tracking |
| 8 | GitHub account and repository name for publishing | Needed before v1.0 |
