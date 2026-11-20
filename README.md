# Leonida Platinum Atlas — GTA VI Trophy Guide & Tracker
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/StarsN/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/StarsN/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built as a make.fun entry for the "Build the best GTA 6 trophy guide" bounty. It is plain static files — open `app/index.html` in a desktop browser with the network off and everything works; the app loads nothing from the network.

## What it does

- **The full official list.** Every one of the 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden on PlayStation) with its official name, official description and grade, in `app/data/trophies.json`.
- **A guide to each trophy**, written for this entry in its own words: what to do, where and how, and when it can be missed — with its sources named beside it.
- **A tracker.** Tick trophies off as you earn them; progress is saved in the browser (localStorage) and can be exported to a JSON file and imported back. Trophies PlayStation tracks a count for (250 stunts, 42 Shooting Range challenges, 100 locations…) carry a progress counter that fills the trophy in when it reaches its target.
- **Filters and search.** By grade, by kind (story, side missions, collectibles, activities, free-roam feats, completion), by earned/remaining, missable only, plus full-text search.
- **Spoiler mode.** Hides the names, descriptions and guides of story trophies (and trophies hidden on PlayStation) until you earn them.
- **Roadmap to the platinum.** Six stages in the order to earn them: the story first, then side strands, activities, collectibles and the map, free-roam feats and money, and 100% completion last — each stage with its own progress.
- **Missables flagged.** Three trophies are flagged missable, read from the official descriptions alone (a one-time story set-piece, a showroom set-piece, a fail-first moment). The guide says plainly that the game launched on 2026-11-19 and no source yet confirms any trophy as permanently missable.

## Data sources

- Names, descriptions, grades and hidden flags: the official PlayStation 5 trophy list as listed by **Exophase** — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- Grades and the progress counts PlayStation tracks: **PSNProfiles** — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi

The two sources agree on every name, description and grade, and the list was cross-checked against both before this entry was built (including the asterisked name "T**s Ass Drug Money" and the curly apostrophe in "Let’s Go Bowling", both as PlayStation publishes them). The official names and descriptions are quoted as published; every guide is original text written for this entry. Where a description pins down no exact step (a few hidden trophies are jokes or deliberately vague), the guide says so instead of inventing one. No Rockstar Games logo, artwork or screenshots are used; the look is this guide's own.

## Run it

Serve `app/` with any static file server and open it in a browser, e.g. from the repository root:

```
python3 -m http.server 8080 --directory app
```

then open http://localhost:8080. Or hand the entry in the way the grader does:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there with the vendored `vendor/makefun-frontend.ts` library, byte for byte as the scorer rebuilds it.

## Layout

- `app/index.html` — the page: progress header, filters, list + guide pane, roadmap and missables views
- `app/js/store.js` — progress state: localStorage save, export and import, counters
- `app/js/app.js` — rendering, filters, the spoiler rule, the detail pane, roadmap and missables
- `app/style.css` — the dark atlas look with grade-coloured badges
- `app/data/trophies.json` — the 55 trophies with their guides, kinds, missable flags, targets and roadmap stages
- `screenshots/` — four renders of the app taken in Chrome (see `shots.json`)
