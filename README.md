# Mantle for Foundry VTT

A game system implementing [Mantle](https://armchairtheorist.com) — a tactical,
cinematic fantasy TTRPG built around modular archetypes and slottable masteries.

Roll a pool of d6. Count 5s and 6s as successes to find your result band, then
read the dice a second time for patterns — doubles, triples, and sequences — the
way you would a Yahtzee hand. This system carries that arithmetic so the table
can stay in the fiction.

> **Status: feature-complete for playtest.** Targeting Foundry VTT v14. Every
> phase in [docs/PLAN.md](docs/PLAN.md) is implemented: character and adversary
> sheets, the dice and pattern engine, damage, Wounds and Burdens, spellcasting,
> conditions, the Valor tracker, and seven compendium packs including four
> ready-to-play characters and eleven enemies.

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

**Status Icon Counters.** Mantle's conditions stack and Foundry's status effects
do not, so stack counts live on the effect in `flags.statuscounter.value` — the
flag this module reads to draw the number on the token. Without it the counts are
still tracked and still shown on both actor sheets; only the token badge is
missing.

**Lancer Initiative.** Mantle resolves turn order by side-alternating zipper
rather than by a rolled formula, which is why the system deliberately registers
no `CONFIG.Combat.initiative`. Lancer Initiative's activation model is the
closest fit, and it handles the multi-turn Champions and Nemeses — a Nemesis
takes three turns a round, each as its own slot in the order. The default combat
tracker also works: add each combatant once per turn they take.

## Running a game

Everything the table needs is in the **Mantle** compendium folder.

| Pack | What is in it |
|---|---|
| Pre-Generated Characters | Mira, Kira, Maya, and Vera — built, equipped, and ready to hand to a player |
| Adversaries | Eleven enemies, Regular through Nemesis |
| Archetypes | Four ancestries and four basic paths |
| Masteries | The full mastery catalog, including Arts and Resonances |
| Equipment | Weapons, armor, spell foci, wondrous items, and consumables |
| Arts & Resonances | The spellcasting half — four Arts, five Resonances |
| Limit Breaks | Six General and one Archetype Limit Break |

A few things worth knowing before the first session:

- **The Party actor holds Valor.** Create one, add the party (select their tokens
  and press **+**), and give every player **Owner** permission on it. Valor is
  the table's resource, and routing every spend through the GM makes it feel like
  the GM's.
- **Nothing is applied to a character without a click.** A roll card shows the
  result and offers **Apply**; a hit that owes a Wound offers **Take a Wound**.
  The net-success stepper on every card absorbs opposed rolls, Heroic Feats, and
  plain GM adjudication in one place — the defender rolls their own Dodge, and
  someone clicks minus.
- **Adversaries scale with two dials.** A stat block authored at Regular takes a
  **class template** (Grunt through Nemesis); every stat block takes a **tier of
  play**. Neither is written into the creature, so both can be set back.
- **End of turn is a button.** It resolves Wracked damage, auto-clears,
  roll-to-clears, and the Faltering and Unraveling checks, and posts what
  happened to chat.

## Developing

```bash
npm install
npm run link -- "/path/to/FoundryVTT"   # symlink into Foundry's Data/systems
npm run verify                           # templates + typecheck + tests
npm run build:packs                      # src/content/*.mjs -> packs/ (LevelDB)
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
src/content/             compendium source, one module per pack
packs/                   compiled packs (git-ignored, built on demand)
tools/                   build and dev scripts
docs/PLAN.md             implementation plan
```

### Compendium content

Content is authored as JavaScript under `src/content/`, one module per pack, each
exporting a `build()` that returns documents. A weapon is one readable line that
mirrors its row in the catalog, rather than a JSON file of id and ownership
boilerplate — and the pregenerated characters assemble themselves from the other
packs by name, so a correction to the Rapier's ladder reaches Mira's Rapier too.

`npm run build:packs` compiles that into the LevelDB packs Foundry reads;
`npm run extract:packs` pulls edits made in Foundry's compendium UI back out.

`npm run check:packs` guards the failure this repository has already been bitten
by: the Foundry CLI skips any document without a valid `_key`, silently, so a
missing key compiles an empty pack over a completely green build.

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
