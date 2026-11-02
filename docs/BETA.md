# Mnemos v0.7 closed beta plan

For Ayaan. The v0.7 build has everything the beta needs inside the app. What is left is people: this page is the checklist for running it.

## Goal and gate

Roadmap gate to leave v0.7: **crash-free, and session length measured.** We also want real data on difficulty and where Undercroft descents end, so the Crypt can be retuned from people instead of the simulation.

## Who

- 20 or more adults, 4 weeks minimum. Mix of ages (include some over 60), phone and desktop, at least 2 people who use a screen reader or large text, and at least one low-end Android phone.
- Tell them plainly: it is a memory training game, not a medical or IQ test; their data stays on their own device; they send reports by hand and can stop at any time.

## What to send them

1. The link https://ayaan40000.github.io/keepers-of-veyra/ (works offline after the first visit; on a phone, "Add to Home Screen" keeps Safari from clearing data). Or the file `builds/mnemos-v0.7.html` for anyone who prefers a file.
2. This short note:
   - Play the daily session on as many days as you can for 4 weeks. About 20 to 30 minutes.
   - Once a week: Keeper > Closed beta > **Save beta report**, and send the file to the beta email.
   - If something goes wrong: Keeper > Closed beta > **Report a problem**, then paste or attach it.
   - Also: Keeper > Your data > **Export backup** now and then. Safari can delete site data after 7 days without a visit.

## What the beta report contains

Only numbers: curriculum day, days trained, gates passed, streak, skill levels, accuracy per task type, session lengths, Undercroft depths and where descents ended, a few settings (sound, text size, readable font, reduced motion, theme), screen size, browser name, and the last 20 error messages. No alias, no palace names, nothing typed. Testers can read the full report in the app before saving it.

## Weekly routine for you

1. Collect reports into one folder.
2. Look at: median session minutes (target 20 to 30), errors (target none), accuracy per task (very low or very high means retune), and the Undercroft "ends" tally (target: most descents end between floors 8 and 12 for players past month 3).
3. Note any problem reports as GitHub issues once the repository exists (template in `.github/ISSUE_TEMPLATE/bug_report.md`).

## Two usability rounds (6 to 8 people each, plus accessibility testers)

Week 1 and week 3. Watch each person (in person or a video call) for 30 minutes, without helping:

- First run: from the title screen to finishing day 1. Where do they hesitate?
- Find and change: text size, sound, study timer.
- Save a backup and find the Undercroft.
- Screen reader testers (NVDA on Windows, VoiceOver on iPhone or Mac): complete one drill and read a chapter.
- Ask afterwards: what was confusing, what felt unfair, would you come back tomorrow?

## After the beta

Hand the reports to Claude with: "Retune Mnemos from the beta reports in <folder>." It will update session-length copy, difficulty and Crypt tuning from the real numbers, then v0.8 can start.
