# Mantle for Foundry VTT

A game system implementing [Mantle](https://armchairtheorist.com) — a tactical,
cinematic fantasy TTRPG built around modular archetypes and slottable masteries.

Roll a pool of d6. Count 5s and 6s as successes to find your result band, then
read the dice a second time for patterns — doubles, triples, and sequences — the
way you would a Yahtzee hand. This system carries that arithmetic so the table
can stay in the fiction.

> **Status: in development.** Targeting Foundry VTT v14. Not yet playable; see
> [docs/PLAN.md](docs/PLAN.md) for the build order.

## Installing

Once a release exists, install it from inside Foundry:

1. **Game Systems → Install System**
2. Paste this into **Manifest URL**:

   ```
   https://github.com/armchairtheorist/foundryvtt-mantle/releases/latest/download/system.json
   ```

3. **Install**, then create a world using the Mantle system.

Only the person hosting the game installs the system. Players just join the world.

### Recommended modules

Neither is required — the system works without them, and degrades gracefully.

| Module | What it adds |
|---|---|
| [Status Icon Counters](https://gitlab.com/woodentavern/status-icon-counters) | Stack counts on token status icons, so `Impaired 3` and `Wracked 2` read at a glance |
| [Lancer Initiative](https://codeberg.org/Bolts/lancer-initiative) | Popcorn/activation initiative, a close fit for Mantle's side-alternating zipper turn order and for multi-turn Champions and Nemeses |
| Dice So Nice | 3D dice. Works automatically — no system configuration needed |

## Developing

```bash
npm install
npm run link -- "/path/to/FoundryVTT"   # symlink into Foundry's Data/systems
npm run typecheck                        # advisory; uses fvtt-types v14
npm run build:packs                      # src/packs/*.json -> packs/ (LevelDB)
```

`npm run link` wants your Foundry **user data** directory — the folder containing
`Data/`, `Config/`, and `Logs/`. After linking, edit a file and reload Foundry
with F5 to see the change.

There is deliberately **no bundler**. The files in this repository are the files
the browser runs, so a stack trace points at a real line in a real file. Type
checking is advisory and runs through JSDoc comments against
[fvtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types);
nothing is compiled.

### Layout

```
system.json              manifest
mantle.mjs               entry point
module/
  config.mjs             CONFIG.MANTLE — attributes, skills, conditions, tags
  data/                  data models (TypeDataModel subclasses)
  documents/             Actor and Item subclasses
  dice/                  pool building, pattern detection, MantleRoll
  apps/                  sheets and dialogs (ApplicationV2)
  chat/                  chat card rendering and button handlers
templates/               Handlebars templates
styles/mantle.css        plain CSS, native nesting
lang/en.json             localization
src/packs/               compendium source JSON (version-controlled)
packs/                   compiled packs (git-ignored, built on demand)
tools/                   build and dev scripts
docs/PLAN.md             implementation plan
```

### Compendium content

Content lives as one JSON file per document under `src/packs/`, which keeps it
diffable in review. The workflow runs both directions: `npm run build:packs`
compiles source into the LevelDB packs Foundry reads, and `npm run extract:packs`
pulls edits made in Foundry's compendium UI back out into source.

### Releasing

Push a version tag and CI does the rest — stamping the version into the
manifest, building packs, zipping, and publishing a GitHub Release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Licence

MIT for the system code. The Mantle game rules and setting are the property of
their author and are not covered by that licence.
