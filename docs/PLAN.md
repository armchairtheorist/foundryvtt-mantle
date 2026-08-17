# Mantle for Foundry VTT — MVP System Plan

Target: **Foundry VTT v14** (stable since 14.359, April 2026).
Goal: a playable system for running Mantle v0.21 playtests with friends — not a
finished commercial system.

Source of truth for rules: the five v0.21 Markdown documents (Quick Start Guide,
Archetypes, Masteries, Equipment, Spellcasting catalogs).

---

## 1. Decisions already made

| Decision | Choice |
|---|---|
| Automation level | **Assisted** — every roll produces a chat card with the ladder resolved and buttons a human clicks. No silent auto-application. |
| Initiative | Delegate to the **Lancer Initiative** module (popcorn/activation tracker). Not reimplemented. |
| Condition stacks | Delegate display to **Status Icon Counters**. The system owns the numbers. |
| Spellcasting | **In scope for MVP.** The party will include casters. |
| Build tooling | Minimal — no bundler. See §3. |

---

## 2. What "minimum viable" means here

In scope for first playtest:

- Character sheet that computes every derived stat from the rules correctly.
- Adversary (enemy) sheet, simplified.
- The dice engine: d6 pools, 5–6 successes, result bands, patterns, the
  zero-dice case.
- Weapon attacks resolving to a damage ladder, with Solid Hit.
- Damage → Guard → Vitality, and the Wound / Burden flows.
- Spellcasting: Art × Resonance with the shaping economy.
- Valor as a shared party resource.
- Conditions as token status effects with stacks.
- Compendium content for everything in the four catalogs.

Explicitly **out** of MVP:

- Area templates on canvas (see §7 — v14 removed Measured Templates).
- Automatic condition ticking, automatic reaction prompts, automatic
  opposed-roll orchestration between two players.
- Character creation wizard, build-legality validation (equilibrium rule,
  prerequisites, slot-cost checking). The sheet will *display* slot usage and
  warn on overflow, but it won't stop you.
- Mission clock / merit tracking. That's GM bookkeeping, not table friction.
- Token Action HUD or Argon combat HUD adapters.

---

## 3. Tooling: recommendation

**Recommendation: no bundler. Plain ESM, plain CSS, two npm scripts.**

Rationale — for a system this size, bundling buys nothing. Foundry serves ES
modules natively, so the files in the repo are exactly the files running in the
browser. When something breaks mid-session, the stack trace points at a real
line in a real file instead of a source-map offset. If the codebase later grows
past the point where that's comfortable, adding Vite is a contained change that
doesn't touch any game logic.

What we *do* need tooling for:

| Need | Tool | Notes |
|---|---|---|
| Compendium packs | `@foundryvtt/foundryvtt-cli` **3.0.4** | Packs are LevelDB since v11; they must be compiled. Source JSON lives in `src/packs/`, build output in `packs/`. |
| API autocomplete | `fvtt-types` **14.366.0-beta** | Dev-only. Also serves as my offline copy of the v14 API — see §9. |
| Releases | GitHub Actions | On tag: zip the system, attach to a Release, publish the manifest URL so Foundry can install and auto-update. |

Styling is plain CSS with native nesting. No Sass, no build step for CSS.

### Repository layout

```
system.json                 manifest
mantle.mjs                  entry point (esmodules)
module/
  config.mjs                CONFIG.MANTLE — skills, conditions, tags, domains
  data/
    actor-character.mjs     TypeDataModel
    actor-adversary.mjs
    item-*.mjs              one per item type
  documents/
    actor.mjs               MantleActor — derived data pipeline
    item.mjs
  dice/
    pool.mjs                pool construction and modifiers
    patterns.mjs            Double / Triple / Sequence allocation
    roll.mjs                MantleRoll
  apps/
    sheets/                 ApplicationV2 sheets
    roll-dialog.mjs
    cast-dialog.mjs
    valor-tracker.mjs
  chat/
    cards.mjs               card rendering + button handlers
  hooks.mjs
templates/                  Handlebars
styles/mantle.css
lang/en.json
src/packs/<pack>/*.json     compendium source (version-controlled)
packs/                      build output (git-ignored)
docs/
```

### Installing it for your table

Once the release workflow runs once, you install by pasting the manifest URL
into Foundry's *Install System* dialog:

```
https://github.com/armchairtheorist/foundryvtt-mantle/releases/latest/download/system.json
```

Your players don't install anything — the system lives on the host. They only
need the two modules from §1 if we keep those dependencies.

---

## 4. Data model

### Actors

**`character`** — player characters.

**`adversary`** — enemies and NPCs. Schema shaped around the challenge classes
the Quick Start names (Grunt / Regular / Elite / Champion / Nemesis), with
support for multiple turns per round and for declaring which hit locations the
creature actually has (some creatures are all Mass). Final shape pending the
*Pre-Generated Enemies* document.

### Items

| Type | Holds |
|---|---|
| `archetype` | kind (ancestry / basic path / specialist path), current rank, mastery domains granted, per-rank bonuses and abilities |
| `mastery` | domain, type (body/mind/soul), slot cost, set membership, prerequisite |
| `weapon` | weight class, attribute (POW / AGI / POW-or-AGI), tags, damage ladder (0s/1s/2s/3+) |
| `armor` | class (standard/martial), Guard bonus, penalty |
| `focus` | spell focus, basic or exotic |
| `wondrous` | wondrous item |
| `consumable` | common/exotic, optional attack ladder |
| `art` | base Vigor cost, basic shape, which dimensions are shapeable, effect ladders |
| `resonance` | one entry per supported Art: which ladder, tags, condition inflicted, opposed-by attribute, bonus damage |
| `feature` | granted maneuvers, reactions, and passives (Enter Frenzy, Deflect, Overwatch, Analyze, …) with `activation: {type, vigorCost, uses}` |
| `limitbreak` | prerequisite, effect. Pending the *Limit Breaks Catalog*. |

**Narrative skills are not items.** Fifty skills across six groups would bury the
item directory for no benefit. They live as a static table in `CONFIG.MANTLE`
with a `system.skills.<key>.trained` boolean on the character.

### The derived-stat pipeline

This is the part most worth getting right, because everything downstream depends
on it. Foundry runs `prepareBaseData()` → *Active Effects apply* →
`prepareDerivedData()`. That ordering means an Active Effect **cannot** write to
Max Vitality directly: derived data runs afterwards and would overwrite it.

So the pipeline is:

1. `prepareBaseData()` — zero out `system.bonuses.*` (vitality, strain, guard,
   resolve, vigorRefresh, vigorCap, spd, sen, gearSlots, wondrousSlots,
   consumablePoints, masterySlots.body/mind/soul/wildcard). These are the
   Active Effect targets.
2. Active Effects apply. Archetype ranks, masteries, and armor all write into
   `system.bonuses.*` and into raw attributes. *"+1 Max Vitality" from Human R1
   becomes an effect adding 1 to `system.bonuses.vitality`.*
3. `prepareDerivedData()` — compute everything from attributes plus bonuses:

   ```
   BODY = POW + AGI          MIND = REA + INS         SOUL = PRE + LUCK
   Max Vitality  = (BODY + 3) × 3   + bonuses.vitality
   Max Strain    = MIND + SOUL + 3  + bonuses.strain
   Resolve       = SOUL + 6         + bonuses.resolve
   Max Guard     = 0 + armor        + bonuses.guard
   Vigor refresh = max(BODY, 1)     + bonuses.vigorRefresh
   Max Vigor     = 7 + floor(CR/7)  + bonuses.vigorCap
   Mastery slots = {body: BODY, mind: MIND, soul: SOUL,
                    wildcard: 1 + floor(CR/5)} + bonuses
   Wondrous slots = SOUL          Gear slots = 3       Consumables = 2
   Languages = REA + 1            CR = Σ archetype ranks
   SPD / SEN / SIZE ← ancestry archetype
   ```

**Acceptance test for this phase:** the Quick Start's worked example builds Mira
(Half-Elf R1 / Warrior R2, POW 0 AGI 3 REA 0 INS 1 PRE 0 LUCK 0) and publishes
her full stat block — Max Vitality 21, Max Strain 5, Resolve 6, Max Guard 4,
Vigor refresh 4, SPD 5, SEN 10. If I build Mira on the sheet and every number
matches without hand-editing, the pipeline is correct.

*v14 note:* custom Actor subclasses must call `super.prepareBaseData()`. v14
splits Active Effect application into initial and final phases, and skipping the
super call leaves the phase-tracking set unreset, which throws on every
subsequent update.

---

## 5. The dice engine

The genuine value-add. Mantle's resolution is quick by hand but tedious over a
whole session, and it's the part a VTT should carry.

**Pool construction.** Attribute → base pool, then modifiers sum together
(bonuses net against penalties) before rolling:

- trained skill `+2d` (at most one per roll, never on attacks)
- hit location: Mass `0`, Edge `−2d`, Mark `−3d`
- ranged distance: adjacent `−1d`, within SEN none, up to max range `−1d`
- attacking while hidden `+2d`
- Impaired `−1d` per stack, Hindered `−1d` on attacks / `+1d` against you
- free-text situational `±Nd`

**Zero or fewer dice:** roll `2d6`, keep lowest, success only on 5–6, patterns
suppressed. (≈11% for one success.)

**Luck rolls** take no modifiers of any kind — not skills, not Impaired, not
Heroic Feats. Patterns still apply, since *Success with a Bonus* explicitly
covers luck rolls. Cursed forces zero successes.

**Patterns.** Double / Triple / Sequence-of-four, each die allocatable to at most
one pattern, every allocated pattern triggers, and nothing triggers on a graze
(0 effective successes). Since allocation is a player choice — `2 3 4 5 5` is
*either* a Sequence *or* a Double, not both — the card computes the highest-value
allocation by default and offers the alternatives as clickable chips.

**Chat card.** One card design carries most of the "Assisted" workload:

- rolled dice faces, successes highlighted, pattern badges
- the full ladder with the achieved band highlighted
- a **net-success stepper (− / +)** that re-highlights the band live. This single
  control absorbs opposition rolls, Heroic Feats (Valor for up to +3 successes),
  and GM fiat — without needing to orchestrate two players' rolls in code.
- Solid Hit's +3 per Double, applied automatically, toggleable
- buttons: **Apply to Targets**, **Take a Wound**, **Take a Burden**

**Damage application** walks the real rules: subtract from Guard first unless
Penetrating, then apply resistance (halve) or weakness (double) to the portion
that reaches Vitality, with the cancel-out rule for multi-type attacks. Excess
damage carries onto the refilled Vitality bar, so one hit can inflict multiple
Wounds.

**Wound flow** rolls the luck test, computes
`severity = filled slots − successes` (minimum 1), applies the Edge/Mark severity
floors, and for a Trauma Wound rolls the 1d6 sub-table. Burdens mirror this,
including the affliction table. Each step is a button, so a GM ruling can
interrupt at any point.

---

## 6. Spellcasting

A **Cast** dialog launched from an Art item:

1. Pick Art and Resonance — only valid combinations are offered, since an Art
   the Resonance doesn't list is refused by fiction.
2. Shape range / duration / area with steppers, each showing the running total
   Vigor cost and accumulated roll penalty.
3. Special shapes (Salvo N, Cone N, Line, Wall N) appear only if the matching
   shaping mastery is equipped.
4. Roll with the archetype's casting attribute, `−1d` if no focus is equipped
   (suppressed by Inner Focus).
5. Resolve against the Resonance's chosen ladder — Vitality or Strain — with its
   tags and inflicted condition.
6. On 0 successes, apply the graze Strain automatically: 1 base, 2 if the spell
   was shaped beyond its basic shape.

Area spells roll separately per target and pick up Imprecise and Seeking.

---

## 7. Module integrations, and a caveat

**Lancer Initiative** gives us popcorn/activation initiative: activation buttons
instead of initiative scores, colour-coded by faction, greyed out once a
combatant has acted, and multiple activations per combatant — which is exactly
how a Champion taking two turns per round should behave. It won't *enforce*
Mantle's specifics (strict ally/enemy alternation, Slowed acting after all
non-Slowed, Independents last, the side that ended the round not starting the
next), but those are visible at a glance in a tracker and easy to honour by hand.

**Status Icon Counters** reads `flags.statuscounter.value` on an ActiveEffect and
exposes `game.modules.get("statuscounter")?.api` plus an `effect.statusCounter`
getter, with `addCounterType()` for custom counter behaviour. The system will own
the stack numbers and *mirror* them into that flag.

> **Caveat worth checking before we commit.** Both modules are verified against
> **v13**. I could not confirm v14 support from this container — Lancer
> Initiative has an open v14 support request filed in April 2026, and I couldn't
> reach its repository (see §9). Neither will be a hard dependency in
> `system.json`: stack counts render on the character sheet regardless, and the
> system works with Foundry's stock combat tracker if Lancer Initiative isn't
> available. **Could you check both in your v14 install?** If either is dead on
> v14, tell me and I'll fold that piece into the system.

**Also relevant, no work needed from us:** Dice So Nice works automatically
because we use standard `Roll` objects, so your d6 pools get physical dice.

**v14 changed the ground here:** Measured Templates were removed outright — the
first Document type Foundry has ever eliminated — and absorbed into the Scene
Regions framework, with `canvas.regions.placeRegion` replacing the old preview
workflow. Area spell templates are therefore deferred to a later pass; MVP
states the area in text and you place it by hand.

---

## 8. Phases

Each phase ends with something loadable in Foundry, so you can stop at any point
and still have a system that runs.

| Phase | Delivers | Done when |
|---|---|---|
| **0 — Skeleton** | Manifest, entry point, tooling, CI release workflow, install instructions | The system appears in Foundry's system list and a world launches on it |
| **1 — Data & sheets** | Data models, derived-stat pipeline, character sheet, item sheets | Mira builds and every number matches the Quick Start's worked example |
| **2 — Dice & combat** | Pool builder, patterns, roll dialog, chat cards, weapon attacks, damage, Wounds/Burdens | A full attack resolves end to end from sheet to applied damage |
| **3 — Spellcasting** | Cast dialog, shaping economy, Art × Resonance resolution | An Ignis Rend and a Lux Mend both resolve correctly, shaped and unshaped |
| **4 — Content** | Compendium packs built from the four catalogs | You can drag a Warrior, a Rapier, and Bloodlust onto a sheet |
| **5 — Table polish** | Valor tracker, conditions as status effects, adversary sheet, module integration | A GM can run *The Toll Road* encounter from the Quick Start |

---

## 9. Open items

1. **Module v14 compatibility** — see the caveat in §7. Needs your check.
2. **Missing documents.** Three files are still to come. Two are referenced
   throughout and block content work: the *Limit Breaks Catalog* (Phase 4/5) and
   *Pre-Generated Enemies* (needed to finalise the adversary schema, Phase 5).
   Also: the Archetypes catalog ends at a bare `## Specialist Path Archetypes`
   heading with nothing under it, and the Rogue basic path is named in the Quick
   Start but has no stat block. Neither blocks Phases 0–3.
3. **Network restriction in this container.** `foundryvtt.com` and `codeberg.org`
   are blocked by the environment's egress policy, so I can't read the official
   v14 API docs directly. Mitigation: the `fvtt-types` package publishes a v14
   beta (14.366.0-beta) to npm, which npm *can* reach — that gives me the real
   v14 type surface to work against. It's a good substitute, but if I hit
   something genuinely ambiguous I may ask you to paste a doc snippet.
4. **Pattern allocation** — default to auto-selecting the highest-value
   allocation with alternatives offered as chips, per §5. Flagging it since it's
   a rules-facing UI choice rather than a purely technical one.
