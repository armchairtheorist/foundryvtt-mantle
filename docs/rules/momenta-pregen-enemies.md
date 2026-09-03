# Momenta — Pre-Generated Enemies

**Version:** 0.31

Momenta is a tactical, cinematic fantasy TTRPG built around modular archetypes and slottable masteries. This catalog contains ready-to-run enemy stat blocks and overlay templates for the **Novice tier** of play. It is intended to be used with the `Momenta - Quick Start Guide` document, which contains the core rules of Momenta — including the encounter asymmetry rules that govern everything below.

All of the catalog examples are a *sample of the design space*, and not to be considered an exhaustive list.



## Enemy Basics

Enemies work differently than player characters in Momenta, with optimizations to speed up gameplay. They have a separate, streamlined **action economy**, and are also scaled across two dimensions - **Challenge Class** and **Tiers of Play**.

> **Design note:** Authored stat blocks are sovereign; a baseline stat block may natively include Guard, defenses, or other features resembling class-menu abilities regardless of the menu's minimums — the minimum challenge class governs only what a **template** may add.



### Action Economy

Unless otherwise specified in the enemy stat block, the default action economy of an enemy is **1 Move maneuver + 1 extra maneuver**. Enemies **do not track Vigor** and have **no reactions by default**. For the extra maneuvers, enemies are limited to the following maneuver choices:

| Allowed Maneuvers                                            |
| ------------------------------------------------------------ |
| Move, Shift, Basic Attack, Shove, Feint, Shake It Off, Any additional stat block-defined abilities or attacks |

Unless otherwise specified, all enemies have a default **Unarmed Attack**, which can either be used to do a **Basic Attack** or a **Shove**.



### Challenge Class

Every enemy stat block will indicate the challenge class of the enemy. There are five challenge classes, in order of deadliness: **Grunt**, **Regular**, **Elite**, **Champion**, **Nemesis**.

Enemy stat blocks in the catalog represent the **baseline stat block**, and most of the enemies will be defined at the Regular challenge class. If you need an enemy of a different challenge class, you can apply one of these **challenge class templates** to a baseline stat block and apply the updated stats to make it into an enemy of a different challenge class.

Note that these templates can only be applied on baseline stat blocks that are designed at the Regular challenge class. Stat blocks that are already designed for higher challenge classes should not apply the templates.

Regular is not a valid template (since the baseline stat blocks should already be at Regular), but it is included in the table below for benchmarking.

|                           | Grunt                     | Regular     | Elite        | Champion     | Nemesis        |
| ------------------------- | ------------------------- | ----------- | ------------ | ------------ | -------------- |
| Turns / round             | 1                         | 1           | 1            | 2            | 3              |
| Vitality                  | 10 (capped)               | -           | -            | -            | +5             |
| Strain                    | 4 (capped)                | -           | -            | -            | +5             |
| Wound / Burden slots      | none                      | none        | 1 / 1        | 2 / 2        | 3 / 3          |
| Action rolls              | no roll; always 1 success | -           | -            | -            | -              |
| Patterns on action rolls  | no                        | no          | no           | yes          | yes            |
| Auto-clear conditions     | -                         | -           | -            | -            | auto clear all |
| Roll-to-clear conditions  | always fail               | always fail | auto clear 1 | auto clear 1 | auto clear all |
| Persistent conditions     | -                         | -           | -            | -            | -              |
| Challenge class abilities | -                         | -           | 1            | 2            | 4              |

**Special rule:** Grunts are usually fielded in squads. As such, in order to speed up gameplay, up to **4 Grunts may take their turns consecutively** (they are treated as a single turn from the enemy side in the turn order).

**Conditions by challenge class.** Auto-clear conditions behave normally for every class unless the table says otherwise. **Elites and Champions** do not roll to clear: at the end of each of their turns they shed 1 stack of each roll-to-clear condition (and auto-clear conditions shed as normal). A **Nemesis** removes all stacks of every auto-clear and roll-to-clear condition at the end of each of its turns. **Persistent conditions — such as Vulnerable — are never shed this way**; they end only by their own rules. End-of-turn effects (such as Wracked damage) resolve *before* shedding.

**Regulars never clear roll-to-clear conditions on their own.** Hindered, Grabbed, Slowed and the like stick to the rank-and-file until removed by other means (separation, an ally's help, the end of combat). This is deliberate: control is strongest against the many and weakest against the few.



### Tiers of Play

Apply adjustments to each baseline enemy stat block based on the current tier of play:

| Tier of Play | Action Roll Adjustment | Vitality Adjustment | Strain Adjustment | Action Economy Adjustment |
| ------------ | ---------------------- | ------------------- | ----------------- | ------------------------- |
| Novice       | -                      | -                   | -                 | -                         |
| Seasoned     | +1d                    | +5                  | +2                | -                         |
| Veteran      | +2d                    | +10                 | +4                | 1 extra maneuver          |
| Paragon      | +3d                    | +15                 | +6                | 2 extra maneuvers         |



### Challenge Class Abilities

| Ability               | Minimum Challenge Class | Effect                                                       |
| --------------------- | ----------------------- | ------------------------------------------------------------ |
| Armored               | Elite                   | Novice: **+2 Max Guard**<br />Seasoned: **+4 Max Guard<br />**Veteran: **+6 Max Guard**<br />Paragon: **+8 Max Guard** |
| Commander             | Elite                   | Allies within **SEN / 2 squares** receive **+1d bonus** to action rolls |
| Dreadful Aspect       | Elite                   | First time a character sees the enemy, they gain the **Frightened** condition |
| Battle Ready          | Elite                   | Immune to **Surprised** condition                            |
| Sprightly             | Elite                   | **+2 SPD**                                                   |
| Relentless Advance    | Champion                | Immune to **Slowed** and **Hindered** conditions             |
| Battlefield Awareness | Champion                | Immune to **Shrouded** condition                             |
| Resilient             | Champion                | Novice: **Restore 5 Vitality** at the **start of the first turn in a round**<br />Seasoned: **as above but 8 Vitality<br />**Veteran: **as above but 12 Vitality**<br />Paragon: **as above but 17 Vitality** |
| Hardened              | Champion                | Gain **resistance** to one damage type                       |
| Unbreakable           | Nemesis                 | Immune to **Broken** condition                               |
| Chosen One            | Nemesis                 | Can **re-roll any luck roll**, but must keep the re-rolled result |



### Enemy Tags

Enemies may have tags that indicate the type of enemy they are. Certain player abilities may have special effects against specific enemy tags. Enemies may have one or more tags.

| Enemy Tags                                             |
| ------------------------------------------------------ |
| Humanoid, Beast, Avian, Aquatic, Undead, Fey, Mindless |



### Hit Locations, Wounds, and Burdens

Unlike player characters, not all enemies will have the standard Mass/Edge/Mark hit locations. Most Humanoid foes will, but some exotic monsters and creatures may not have an Edge, or a Mark, or may have multiples of each. Every creature will define in its stat block the valid hit locations for that particular creature, as well as what happens on a hit to that location (1+ success on a damage dealing attack), or a Wound to that location.

Creatures with no Wound slots (usually Regular enemies) can ignore the Wound Effect hit location column, but it is still included in the stat block just in case the GM wants to apply a Challenge Class template to the enemy to give it additional Wound slots.

By default, if there is no special Wound Effect listed, then the creature gains the **Impaired N** condition, where N = number of Wound slots now filled (including this Wound). If a Wound Effect is specified, then they suffer the listed effect instead, and does not get the Impaired condition. Enemies never roll on the Wound or Burden consequence tables; they use their listed effects, or the Impaired N default.

Similarly for Burdens, all creatures who receive a Burden will gain the **Impaired N** condition, where N = number of Burden slots now filled (including this Burden). There are no Afflictions for enemies (since enemy behavior is always under the GM control anyway).

**Calling shots.** By default, enemies attack **Mass**. An enemy calls Edge or Mark shots only if its stat block says so, via a **Precise** line in its Tactics / Behavior entry naming which location it favors and when. Grunts never call shots.



## Challenge Class — Regular



### Goblin Skirmisher
| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 20       | 0      | 5      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1    | 2    | 0    | 1    | 0    | 1    | 5    | 10   | 1S   |

| Maneuver                           | Roll | Effect                       |
| ---------------------------------- | ---- | ---------------------------- |
| Shiv (Piercing, Melee 1)           | 2d6  | Damage: 1 / 4 / 8 / 12       |
| Sling (Crushing, Range 10)         | 2d6  | Damage: 1 / 4 / 8 / 12       |
| Unarmed Attack (Crushing, Melee 1) | 2d6  | Damage: 1 / 3 / 6 / 9        |
| Trip (Melee 1)                     | 2d6  | 1+: target gets **Hindered** |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect |
| --------------------------------- | ----------------------- | ------------ |
| Mass (none)                       | -                       | -            |
| Edge (-2d penalty)                | **Hindered**            | -            |
| Mark (-3d penalty)                | **Impaired 1**          | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Swarms in squads of 3–4; gangs up on whoever a bigger ally is already fighting. |



### Bandit Thug

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 22       | 0      | 6      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 2    | 1    | 0    | 1    | 1    | 2    | 5    | 10   | 1M   |

| Maneuver                           | Roll | Effect                 |
| ---------------------------------- | ---- | ---------------------- |
| Cudgel (Crushing, Melee 1)         | 3d6  | Damage: 2 / 6 / 11 / 17 |
| Unarmed Attack (Crushing, Melee 1) | 3d6  | Damage: 1 / 3 / 6 / 9  |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect |
| --------------------------------- | ----------------------- | ------------ |
| Mass (none)                       | -                       | -            |
| Edge (-2d penalty)                | **Hindered**            | -            |
| Mark (-3d penalty)                | -                       | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Fights as a pack; focuses whoever is already bleeding.       |



### Cultist

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 22       | 0      | 6      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1    | 1    | 1    | 1    | 2    | 1    | 5    | 10   | 1M   |

| Maneuver                                                     | Roll | Effect                          |
| ------------------------------------------------------------ | ---- | ------------------------------- |
| Ritual Sickle (Slashing, Melee 1)                            | 3d6  | Damage: 2 / 6 / 11 / 17          |
| Zealot's Screech (Mental, Range 10, Indefensible, Imprecise, Seeking; Opposable by INS) | 2d6  | Strain damage: 1 / 2 / 3 / 4    |
| Unarmed Attack (Crushing, Melee 1)                           | 3d6  | Damage: 1 / 3 / 6 / 9           |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect |
| --------------------------------- | ----------------------- | ------------ |
| Mass (none)                       | -                       | -            |
| Edge (-2d penalty)                | -                       | -            |
| Mark (-3d penalty)                | -                       | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Screeches from the back until a Mindbinder or Hierophant falls — then charges in a frenzy of sickles. |



### Ironshell Sentinel

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 22       | 0      | 6      | 0       | 3     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 2    | 0    | 0    | 1    | 1    | 1    | 4    | 10   | 1M   |

| Maneuver                           | Roll | Effect                  |
| ---------------------------------- | ---- | ----------------------- |
| Flanged Mace (Crushing, Melee 1)   | 3d6  | Damage: 2 / 7 / 13 / 20 |
| Unarmed Attack (Crushing, Melee 1) | 3d6  | Damage: 1 / 3 / 6 / 9   |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect                                | Wound Effect |
| --------------------------------- | ------------------------------------------------------ | ------------ |
| Mass (none)                       | -                                                      | -            |
| Edge (-2d penalty)                | -                                                      | -            |
| Mark (-3d penalty)                | A chink opens: the next attack against it gains **+1d** | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Holds a chokepoint and never chases; spreads its attacks to whoever presses the line. Chip attacks bounce off its Guard; Penetrating, Wracked, and Strain damage walk straight through. |



### Crag Troll

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 26       | 0      | 5      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 3    | 0    | 0    | 1    | 0    | 1    | 4    | 12   | 1L   |

| Maneuver                           | Roll                        | Effect                                                       |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------ |
| Slam (Crushing, Melee 1)           | 3d6<br />(+1d vs Grabbed)   | Damage: 3 / 8 / 15 / 22                                      |
| Grab (Melee 2) | 3d6                      | 1+: target gains **Grabbed N** (N = net successes, max 3). The Troll can hold a target 2 squares away; dragging follows the SIZE rule. |
| Unarmed Attack (Crushing, Melee 1) | 3d6                         | Damage: 1 / 3 / 6 / 9                                        |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect |
| --------------------------------- | ----------------------- | ------------ |
| Mass (none)                       | -                       | -            |
| Edge (-2d penalty)                | **Hindered**            | -            |
| Mark (-3d penalty)                | -                       | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Grabs the biggest threat it can reach and slams whatever it's holding. |



### Razorwing

| Challenge Class | Tags         | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | ------------ | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Beast, Avian | 18       | 0      | 5      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1    | 3    | 0    | 2    | 0    | 1    | 6    | 12   | 1S   |

| Maneuver                          | Roll | Effect                                                       |
| --------------------------------- | ---- | ------------------------------------------------------------ |
| Diving Talons (Slashing, Melee 1) | 3d6  | Damage: 2 / 6 / 11 / 17<br />**+2 damage** if it Moved 3+ squares straight toward the target this turn. |
| Unarmed Attack (Crushing, Melee 1) | 3d6 | Damage: 1 / 3 / 6 / 9                                        |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Flight**: moves over creatures and obstacles; ignores ground-based difficult terrain. |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect                                      | Wound Effect                                    |
| --------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Mass (none)                       | -                                                            | -                                               |
| Wings (-2d penalty)               | Loses **Flight** until the end of its next turn (falls if airborne — untyped falling damage applies). | Loses **Flight** for the rest of the encounter. |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Circles high, dives the most isolated PC, and retreats out of reach. |



### Alley Blade

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Regular         | Humanoid | 18       | 0      | 6      | 0       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1    | 3    | 1    | 1    | 1    | 1    | 6    | 10   | 1M   |

| Maneuver                                      | Roll | Effect                                  |
| --------------------------------------------- | ---- | --------------------------------------- |
| Stiletto (Piercing, Melee 1, **Penetrating**) | 3d6  | Damage: 1 / 3 / 6 / 9. *Ignores Guard.* |
| Unarmed Attack (Crushing, Melee 1)            | 3d6  | Damage: 1 / 3 / 6 / 9                   |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Shadow Start**: if the fiction allows, begins the encounter **Hidden** (core Hidden rules: +2d on its first attack, which reveals it). |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect |
| --------------------------------- | ----------------------- | ------------ |
| Mass (none)                       | -                       | -            |
| Edge (-2d penalty)                | -                       | -            |
| Mark (-3d penalty)                | -                       | -            |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Ignores the unarmored; hunts whoever is wearing the heaviest armor — its blade doesn't care.<br />**Precise:** calls **Mark** against a target with an open Wound slot or in Crisis — a Mark Wound also Breaks them. |



## Challenge Class — Elite



### Bandit Captain

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Elite           | Humanoid | 24       | 1      | 9      | 1       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 3    | 2    | 1    | 2    | 2    | 2    | 5    | 10   | 1M   |

| Maneuver                                                     | Roll | Effect                   |
| ------------------------------------------------------------ | ---- | ------------------------ |
| Longsword (Slashing, Melee 1)                                | 4d6  | Damage: 3 / 8 / 15 / 22  |
| **Executioner's Swing** (Telegraphed, Slashing, Melee 1)<br />Lock: Target one creature within range<br />Resolve: Start of next turn | 4d6  | Damage: 6 / 14 / 24 / 34 |
| Unarmed Attack (Crushing, Melee 1)                           | 4d6  | Damage: 1 / 3 / 6 / 9    |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Parry** (scripted defense, 1/round): oppose one melee attack against the Captain with **3d6**.<br />**Commander** (challenge class ability): allies within SEN/2 (5) squares receive **+1d** on action rolls.<br />Sheds 1 stack of each auto-clear and roll-to-clear condition at end of turn (persistent conditions unaffected). |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect                                                 |
| --------------------------------- | ----------------------- | ------------------------------------------------------------ |
| Mass (none)                       | -                       | -                                                            |
| Edge (-2d penalty)                | **Hindered**            | Sword arm mangled: **Signature unavailable** for the rest of the fight. |
| Mark (-3d penalty)                | -                       | Helm split: loses **Parry**.                                 |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Duels the strongest-looking PC and orders the pack — fights alongside Thugs, whom his Commander aura sharpens.<br />**Precise:** calls **Edge** against the party's most dangerous melee combatant, then sends the thugs at the Hindered target (no Dodge, +1d incoming). |



### Cult Mindbinder

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy          |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ----------------------- |
| Elite           | Humanoid | 20       | 1      | 10     | 1       | 0     | Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 0    | 1    | 2    | 3    | 3    | 1    | 5    | 12   | 1M   |

| Maneuver                                                     | Roll | Effect                                                       |
| ------------------------------------------------------------ | ---- | ------------------------------------------------------------ |
| Mind Spike (Mental, Range 12, Indefensible, Imprecise, Seeking; **Opposable by INS**) | 4d6  | Strain damage: 1 / 2 / 4 / 6                                 |
| **Dread Whisper** (Telegraphed, Mental, Range 12, Indefensible, Imprecise, Seeking; **Opposable by INS**)<br />Lock: Target up to two creatures within range<br />Resolve: Start of first turn of next round | 4d6  | Strain damage: 2 / 4 / 6 / 9<br />2+ net successes: target gains **Frightened** (the Mindbinder is the source). |
| Unarmed Attack (Crushing, Melee 1)                           | 2d6  | Damage: 1 / 3 / 6 / 9                                        |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Veil of Doubt** (scripted defense, 1/round): oppose one attack against the Mindbinder with **3d6**.<br />**Dreadful Aspect** (challenge class ability): first time a character sees the Mindbinder, they gain **Frightened**.<br />Sheds 1 stack of each auto-clear and roll-to-clear condition at end of turn (persistent conditions unaffected). |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect                                                 |
| --------------------------------- | ----------------------- | ------------------------------------------------------------ |
| Mass (none)                       | -                       | -                                                            |
| Edge (-2d penalty)                | -                       | Concentration shattered: **Signature unavailable** next round. |
| Mark (-3d penalty)                | -                       | The binding slips: **every condition the Mindbinder has inflicted ends immediately**. |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Stays behind bodies; Spikes whoever has the least Strain remaining — it wants a collapse, not a corpse. |



## Challenge Class — Champion



### Cult Hierophant

| Challenge Class | Tags     | Vitality | Wounds | Strain | Burdens | Guard | Action Economy                                         |
| --------------- | -------- | -------- | ------ | ------ | ------- | ----- | ------------------------------------------------------ |
| Champion        | Humanoid | 26       | 2      | 10     | 2       | 0     | **2 turns / round**<br /><br />Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1    | 1    | 2    | 4    | 4    | 2    | 5    | 12   | 1M   |

**Reads patterns** on its action rolls (Solid Hit applies; 1+ effective success required, as normal).

| Maneuver                                                     | Roll | Effect                                                       |
| ------------------------------------------------------------ | ---- | ------------------------------------------------------------ |
| Scourge of Doctrine (Slashing, Melee 2)                      | 5d6  | Damage: 4 / 10 / 19 / 28                                     |
| Word of Unmaking (Mental, Range 12, Indefensible, Imprecise, Seeking; **Opposable by INS**) | 5d6  | Strain damage: 2 / 4 / 6 / 9                                 |
| **Litany of the Hollow God** (Telegraphed, Mental, Range 12, Indefensible, Imprecise, Seeking; **Opposable by INS**)<br />Lock: Target up to one creature within range<br />Resolve: Start of first turn of next round | 5d6  | Damage: 8 / 16 / 28 / 40<br />*Half the damage (round down) is dealt to Vitality, half to Strain.* |
| Unarmed Attack (Crushing, Melee 1)                           | 3d6  | Damage: 1 / 3 / 6 / 9                                        |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Faith Unshaken** (scripted defense, 1/round): oppose one attack against the Hierophant with **4d6**.<br />**Battlefield Awareness** (challenge class ability): immune to **Shrouded**.<br />**Resilient** (challenge class ability): restores **5 Vitality** at the start of its first turn each round.<br />**Wound bar effects:** 1st bar lost — *the mask cracks*: all Cultists within 12 immediately make one Ritual Sickle attack · 2nd bar lost — *the Hollow God stirs*: the Hierophant's next Signature **does not need to be telegraphed**.<br />**Strain Breakdown** (once, the first time it takes a Burden): *doubt floods in* — the Hierophant loses its next turn, then continues with its remaining Burden slots.<br />Sheds 1 stack of each auto-clear and roll-to-clear condition at the end of each of its turns (persistent conditions unaffected). |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect | Wound Effect                                                 |
| --------------------------------- | ----------------------- | ------------------------------------------------------------ |
| Mass (none)                       | -                       | -                                                            |
| Edge (-2d penalty)                | -                       | Voice broken: cannot use Word of Unmaking or its Signature next round. |
| Mark (-3d penalty)                | -                       | The icon shatters: loses **Faith Unshaken**.                 |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Opens with the Litany telegraph to force scattering, Scourges whoever closes, and saves the second turn each round to answer whatever hurt it most. |



## Challenge Class — Nemesis



### Sorrowmaw, the Grief-Drake

*It remembers every death it has ever caused. It treasures them. When Sorrowmaw descends, the air itself weeps.*

| Challenge Class | Tags          | Vitality | Wounds | Strain | Burdens | Guard | Action Economy                                    |
| --------------- | ------------- | -------- | ------ | ------ | ------- | ----- | ------------------------------------------------- |
| Nemesis         | Undead, Beast | 30       | 3      | 10     | 3       | 0     | **3 turns / round** <br />Move + 1 extra maneuver |

| POW  | AGI  | REA  | INS  | PRE  | LUCK | SPD  | SEN  | SIZE |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 4    | 3    | 1    | 3    | 4    | 2    | 6    | 15   | 3    |

**Reads patterns** on its action rolls (Solid Hit applies; 1+ effective success required, as normal). **Clears all auto-clear and roll-to-clear conditions** at the end of each of its turns (persistent conditions unaffected).

| Maneuver                                                     | Roll | Effect                                                       |
| ------------------------------------------------------------ | ---- | ------------------------------------------------------------ |
| Grave-Chill Bite (Piercing, Melee 2)                         | 6d6  | Damage: 4 / 11 / 20 / 30                                     |
| Wing Buffet (Crushing, Melee 2; **all creatures in range**)  | 6d6  | Damage: 2 / 6 / 11 / 17 to each, and each target hit (1+) is **Shoved 2 squares** directly away. One roll, opposed individually. |
| Keening of the Lost (Mental, Range 6 **emanation — all creatures within 6**; Indefensible, Imprecise, Seeking; **Opposable by INS**) | 6d6  | Strain damage: 2 / 4 / 6 / 9 to each. One roll, opposed individually. |
| **Sorrow Made Flesh** (Telegraphed)<br />Lock: Cone 6 anchored to the Sorrowmaw's position in a chosen direction; the drake cannot move until the attack is resolved <br />Resolve: Start of its next turn | 6d6  | Damage: 6 / 14 / 24 / 34 to every creature in the cone (defended normally — Dodge, Deflect, Brace all apply). Creatures damaged by the breath take **2 Strain**. As it inhales, surround lights (if any) will dim. |
| Unarmed Attack (Crushing, Melee 2)                           | 6d6  | Damage: 1 / 3 / 6 / 9                                        |

| Abilities                                                    |
| ------------------------------------------------------------ |
| **Flight**: moves over creatures and obstacles; ignores ground-based difficult terrain.<br />**Miasma of Grief**: at the start of each of Sorrowmaw's turns, every creature within 3 squares takes **1 Strain**.<br />**Chosen One** (challenge class ability): may re-roll any luck roll, but must keep the re-rolled result.<br />**Unbreakable** (challenge class ability): immune to **Broken**.<br />**Hardened** (challenge class ability): **resistance (Slashing)** — old scars teach old lessons.<br />**Dreadful Aspect** (challenge class ability): first time a character sees Sorrowmaw, they gain **Frightened**.<br />**Wound bar effects:** 1st bar lost — *the death-wind rises*: +2 SPD for the rest of the fight · 2nd bar lost — *grief given voice*: Keening of the Lost gains **+1d** · 3rd bar lost — *the hollow heart shows*: Sorrowmaw loses Flight, its Signature no longer needs to be telegraphed, and it gains **+1d on all action rolls** — desperate, grounded, and furious.<br />**Strain Breakdown** (each time it takes a Burden): *the grief overwhelms* — Sorrowmaw spends its next turn keening at the sky (that turn: Move only). |

| Hit Locations (Targeting Penalty) | Hit (1+ success) Effect                                      | Wound Effect                                                 |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Mass (none)                       | -                                                            | -                                                            |
| Wings (-2d penalty)               | **Faltering flight**: cannot use Flight-dependent movement on its next turn. | Wing torn: loses **Flight** for the rest of the fight (falls if airborne — untyped falling damage applies). |
| The Hollow Heart (-3d penalty)    | The grief flickers: **Miasma of Grief** is suppressed until its next turn. | The heart gutters: Sorrowmaw **loses its next turn entirely**. |

| Tactics / Behavior                                           |
| ------------------------------------------------------------ |
| Opens from the sky: Dreadful Aspect, then Keening over the clustered party. Telegraphs the breath to shatter formations, lands to Bite whoever stands alone, and uses Wing Buffet + Flight to escape when surrounded. It saves its third turn each round to punish healers — Sorrowmaw hates hope most of all. |
