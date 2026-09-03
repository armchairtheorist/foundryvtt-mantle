# Mantle — Quick Start Guide

**Version:** 0.21

Mantle is a tactical, cinematic fantasy TTRPG built around modular archetypes and slottable masteries. This guide covers the core rules, the character-build system, and a primer on how Mantle adventure is structured.

> **About this document:** The rules are presented concisely for TTRPG-veteran readers. The **Version** line under each document's title is its version marker; the files themselves are versioned in git.
>
> **Acknowledgements:** Mantle takes inspiration from many excellent TTRPG and JRPG games, including:
>
> - **Tri-Stat dX** - BODY / MIND / SOUL primary attribute structure.
> - **Lancer** - Zipper initiative, dual-track damage, Structure/Stress model.
> - **Draw Steel** - Single-roll resolution, recoveries, tiers of success for attacks.
> - **Octopath Traveler** - Break system and the Broken condition.
> - **Troubleshooter: Abandoned Children** - Mastery board, mastery sets, "Vigor" terminology.
> - **Final Fantasy Tactics** - Multi-archetype character building.
> - **Blades in the Dark** - Slot-based persistent harm, mission structure, narrative play.
> - **One-Roll Engine** - Dice patterns-as-resolution lineage.
> - **Pathfinder 2e** - Tag-based content design.
> - **Tales from Elsewhere** - Hit-location concept (Mass/Edge/Mark adopted from Bulk/Brim/Ace).
> - **GURPS Thaumatology / Ars Magica** - Freeform verb-and-noun spell construction.



## What is Mantle?

**Mantle is a tabletop roleplaying game of cinematic, tactical fantasy**. Battles play out on a grid, but they resolve quickly at the speed of a story. You spend **Vigor** to chain together daring **maneuvers**, take **Strain** when you push past your limits, and pour your party's shared **Valor** into **Limit Breaks** that turn desperate situations into legend.

**Every roll is read twice.** Roll your pool of d6s, count successes to see how well you did, then scan for dice **patterns** like in Yahtzee. **Doubles** land **Solid Hits**. **Triples** and **sequences** fuel rarer and more impactful techniques. Every throw of the dice carries a second chance for something cinematic to happen, and reading it takes a glance, not a calculation.

**Your victories belong to the table.** Valor is earned by the whole party and spent by whoever needs it most. The game is built for the moment your friend's character does something unforgettable because *you* set it up.

**Magic is a grammar, not a spell list.** Combine an **Art** (the verb: **Rend**, **Mend**, **Compel**, **Impel**...) with a **Resonance** (the noun: **Ignis**, **Lux**, **Mens**, **Terra**...) and the grid of combinations is yours to explore. Arts are fixed and comprehensive; Resonances are an open surface, built to be extended, hacked, and homebrewed.

**Wounds tell stories.** Getting hurt doesn't just tick a number down. Physical **Wounds** and mental **Burdens** carry consequences, **afflictions** give you something to *play*, and pushing on versus resting is a real strategic choice.

**Character building is a game in itself.** Stack always-on **archetypes** and slot **masteries** to tune the build. Go deep to unlock **specialist archetypes**, go broad for new domains, and retrain freely between missions. Experiment without regret.

**Campaigns with a pulse.** Play runs on **missions** with clear main and side objectives, ticking clocks, and a real strategic choice between pushing on and pulling back to rest. Fight on the grid, breathe in **interludes**, grow in **downtime**, and advance by achieving objectives, and not solely by counting kills. A tactical wargame and a visual novel, taking turns.

And one core design principle, applied everywhere: **if tracking something isn't fun, Mantle doesn't track it.**



# ARC 1 — BASIC RULES



## 1. Core Resolution

Roll a pool of d6. Each die showing **5 or 6 is a success**. Count your successes. The number of successes determines the result of the roll, split into **four result bands** plus an optional **overflow** band:

| Successes | Result Band                                                  |
| --------- | ------------------------------------------------------------ |
| 0         | The weakest defined outcome, colloquially named a *graze*. However, even the lowest band result will usually do something, and will rarely result in "nothing happened". |
| 1         | A slightly better outcome.                                   |
| 2         | An even better outcome.                                      |
| 3+        | Best possible outcome.                                       |
| Overflow  | For every additional success above 3, apply the listed effect per additional success. |

Every roll will define what each result band represents.

> **Always round down.** Any division or fractional value in the game rounds down by default, unless specifically called out.

### Dice Pool Size

The number of dice rolled depends on the **attribute** used for the roll, adjusted by **modifiers**. Typical dice pools for starting characters: 2-4 dice. Veterans: 4-6 dice. Legendary heroes: 7+ dice.

Reference probabilities:

| Pool | 0 success | 1 success | 2 success | 3+ success |
| ---- | --------- | --------- | --------- | ---------- |
| 1d6  | 67%       | 33%       | -         | -          |
| 2d6  | 44%       | 44%       | 11%       | -          |
| 3d6  | 30%       | 44%       | 22%       | 4%         |
| 4d6  | 20%       | 40%       | 30%       | 11%        |
| 5d6  | 13%       | 33%       | 33%       | 21%        |
| 6d6  | 9%        | 26%       | 33%       | 32%        |
| 7d6  | 6%        | 20%       | 31%       | 43%        |
| 8d6  | 4%        | 16%       | 27%       | 53%        |

### Modifiers

Modifiers adjust the number of dice rolled in the dice pool.

-  **+Nd bonus** - add N dice to the pool.
-  **-Nd penalty** - remove N dice from the pool.
- If a roll is affected by multiple modifiers, add them all together (with bonuses netting out penalties), then roll.

### Rolling with Zero Dice

If a dice pool results in rolling 0 dice or fewer:

- Roll 2d6 and take the **lowest** die
- If the lowest die is a 5 or 6, it counts as one success
- Patterns do not apply

Reference probabilities: 11% for 1 success, 89% for 0 successes

### Types of Rolls

**Action roll** - Every dice pool roll in Mantle is an action roll. Build the pool from one of the attributes, then apply modifiers (±Nd). If you are trained in a skill relevant to the task (GM adjudication), you can add a **+2d bonus** to the roll (at most one skill can be applied per roll). Some action rolls are opposed.

**Attack (attack roll)** - Attacks are action rolls made to inflict harm or another undesirable effect on a target. Skills are never applied to attacks. Attacks can usually be opposed by the target's defenses.

**Opposition roll** - This is an action roll made to **oppose** someone else's action roll. Subtract the opposition roll's successes from the opposed roll's successes; the result (minimum 0 successes) is the roll's **effective successes**. Result bands are always read from effective successes, and an attack reduced to 0 effective successes becomes a *graze*. When opposing an attack, an opposition roll is also called a **defensive roll**.

**Luck roll** - Also known as **testing your luck**, a luck roll is an action roll using LUCK that takes **no modifiers of any kind**: no bonuses, no penalties, no trained skills, no Heroic Feats. Count successes as normal. Nothing ever opposes a luck roll, though a luck roll may itself serve as an opposition roll.

### Patterns

Besides counting successes when rolling, patterns that emerge from the set of rolled values may also trigger special outcomes. There are three patterns:

- **Double** - two dice showing the same value
- **Triple** - three dice showing the same value
- **Sequence** - four dice showing consecutive values (e.g., `2`, `3`, `4`, `5`)

Certain attacks or abilities may define special pattern outcomes.

Each d6 in the dice pool may only be allocated to a single pattern. For example, if a 5d6 pool shows the following values: `2`, `3`, `4`, `5`, `5`

- You can pick out one double pattern (`5`, `5`)
- Or a sequence pattern (`2`, `3`, `4`, `5`)
- But you cannot pick out both the double and the sequence, as that will require allocating one of the `5` to more than one pattern, which is disallowed.

**Every pattern that is allocated will trigger**, including repeated patterns. For example, a roll of `1`, `1`, `4`, `5`, `5` will result in two double patterns, and the double pattern outcome will trigger two times (if applicable).

By default, a **pattern will only trigger** if the roll achieves at least **1 effective success**. Thus, a *graze* will not trigger any patterns. Specific pattern's may specify additional requirements that override this default.

Reference probabilities:

| Pool | Double | Triple | Sequence |
| ---- | ------ | ------ | -------- |
| 2d6  | 17%    | -      | -        |
| 3d6  | 44%    | 3%     | -        |
| 4d6  | 72%    | 10%    | 6%       |
| 5d6  | 91%    | 21%    | 15%      |
| 6d6  | 98%    | 37%    | 27%      |
| 7d6  | 100%   | 54%    | 38%      |
| 8d6  | 100%   | 71%    | 49%      |



## 2. Basic Character Stats

### Attributes

There are six attributes, and they typically range 0–6, with 7–8+ for legendary characters. Attributes cannot be lower than 0.

| Attribute      | Represents                                                   |
| -------------- | ------------------------------------------------------------ |
| Power (POW)    | **Raw physical force** - hitting harder, lifting more, muscling through |
| Agility (AGI)  | **Speed and precision of movement** - balance, reflexes, and quickness of hand |
| Reason (REA)   | **Analytical reasoning and learned knowledge** - what you've studied and how sharply you apply it |
| Insight (INS)  | **Awareness and intuition** - noticing, sensing, and reading what's really there |
| Presence (PRE) | **Force of personality asserted outward** - command, intimidation, and the will to shake off fear |
| Luck (LUCK)    | **Fortune's lean** - not skill, but the universe favoring you |

### Cores

Besides attributes, every character also has three cores, representing the foundational elements of every character. The values of each core is derived from their corresponding attributes:

| Core | Sum of | Contributes towards |
|---|---|---|
| BODY | POW + AGI | Vitality, Vigor refresh, Body mastery slots |
| MIND | REA + INS | Strain, Surges, Mind mastery slots |
| SOUL | PRE + LUCK | Strain, Valor, Soul mastery slots, Resolve, Wondrous item slots |

### Vitality

Vitality represents a character's physical health. During combat, attacks cause damage, which is deducted from the character's Vitality. If damage reduces a character's Vitality to **0 or below**, the character will receive a **Wound**, and their Vitality is restored back to full. If the character has too many Wounds, they risk becoming **Defeated**.

A character's Vitality may never exceed their **Max Vitality**.

```
Max Vitality = (BODY + 3) × 3
```

### Strain

Besides physical damage, a character may also gain mental and spiritual stress called Strain. Strain may be caused by powerful enemy attacks, witnessing horror, or even voluntarily taken to power certain abilities. If a character gains enough Strain to **reach or exceed** their **Max Strain**, they suffer a **Burden**, and their Strain is cleared. If a character is carrying too many Burdens, they risk becoming **Lost**.

```
Max Strain = MIND + SOUL + 3
```

### Wounds and Burdens

Characters have **Wound slots**, which represents the maximum number of Wounds that they can receive. If all of their slots are filled, and they need to take another Wound, then they become **Defeated** immediately.

Similarly, characters have **Burden slots**, and if a character needs to gain a Burden when all of their slots are already filled, then they become **Lost** immediately.

```
Wound Slots = 3
Burden Slots = 3
```

### Resolve

Resolve is a strategic resource that represents a character's innate resilience, a character's personal capacity to recover, push on, and endure. Characters can use Resolve during a mission to recover lost Vitality, clear Wounds, and remove Burdens.

```
Resolve = SOUL + 6
```

Resolve is refreshed during **downtime**.

### Vigor

Vigor represents a character's pool of "action points", that can be spent during combat turns on maneuvers. Some Vigor is restored at the beginning of every turn, but it can never exceed the character's **Max Vigor**.

```
Max Vigor = 7
```

As characters rank up, their Max Vigor will increase.

### Guard

Guard is an abstract representation of a character's armor and passive defenses, and helps absorb damage. Like Vitality, it is a depletable resource. Whenever a character takes damage, **subtract it from Guard first**. Only after Guard is 0, then damage reduces Vitality.

At the beginning of every turn, a character's Guard is replenished to its **Max Guard** value, which for most starting characters, start at 0.

```
Max Guard = 0
```

Equipping armor will increase a character's Max Guard. Certain abilities and masteries may also increase Max Guard. Guard gained from different sources are added together.

A character's Guard value may temporarily exceed their Max Guard. When that happens, it is called **Over-Guard**. A character with Over-Guard will not have their Guard replenished to its Max Guard value at the beginning of the turn.

> **What Guard stops — and what it doesn't.** Guard absorbs **Vitality damage from attacks** before your Vitality is touched. Guard does **not** absorb: **Strain damage** (mental harm ignores armor and Guard alike); **untyped damage** (falling, drowning, and other environmental harm — these are not attacks); damage from attacks or effects with the **Penetrating** tag (including all damage from **Wracked** conditions); or any damage that is not from an attack. Resistance and weakness apply only to the damage that gets past Guard.

### Speed

Speed (SPD) is a stat representing how many squares (or hexes) a character can travel every time they take the **Move** maneuver. It is determined by the character's **ancestry archetype**, and the value generally ranges between 4 to 6.

> Combat in Mantle can be played on either **square** or **hex** maps. For convenience, we will refer to only squares in the core rules when it comes to movement, but it is applicable to hexes as well.

### Senses

Senses (SEN) is a stat representing the effective range in squares (or hexes) that a character can generally perceive without penalty. Like SPD, it is also determined by the character's **ancestry archetype**, with typical values ranging between 10-15.

### Size

Size (SIZE) is a stat representing how big the character is, and is determined by the character's **ancestry archetype**. Most characters will be some variation of Size 1.

| SIZE | Description | Footprint   | Examples               |
| ---- | ----------- | ----------- | ---------------------- |
| 1T   | Tiny        | 1 square    | Sprites                |
| 1S   | Small       | 1 square    | Halflings, Goblins     |
| 1M   | Medium      | 1 square    | Humans, Elves, Dwarves |
| 1L   | Large       | 1 square    | Minotaurs, Lizardfolk  |
| 2    | Huge        | 2x2         | Ogres, Centaurs        |
| 3    | Giant       | 3x3         | Giants                 |
| 4+   | Gargantuan  | 4x4 or more | Dragons                |

To determine which of two creatures are **bigger** or **smaller** based on their respective SIZE stat:

```
(Smaller) 1T < 1S < 1M < 1L < 2 < 3 < 4 (Larger)
```

### Equipment

There are three kinds of equipment that characters can have:

- **Gear** - Weapons, armor, or other archetype-specific gear like spell foci. Characters have a number of **gear slots** that determine how much gear can be equipped. No matter how many gear slots are available, characters **cannot equip more than one armor** at a time.
- **Wondrous Items** - Special items that grant special benefits and abilities. Like gear, characters have a number of **wondrous item slots** that determine how many wondrous items can be equipped at any time.
- **Consumables** - Single-use equipment, like potions and bombs. Consumables are represented using **consumable points**. One consumable point allows a character to dig into their backpack and automatically retrieve and use any one consumable that the character or party has access to. These consumables do not have to be pre-decided ahead of time. Consumable points are replenished during **downtime**.

Characters start with a fixed number of gear slots, wondrous item slots, and consumable points. These may be increased later on through special abilities or masteries.

```
Gear Slots = 3
Wondrous Item Slots = SOUL
Consumable Points = 2
```

### Languages Known

All characters will know the **Common** language, which represents the prevalent language that almost everyone speaks in the world. Besides Common, a character will know a number of additional languages based on their REA score:

```
Additional Languages = REA + 1
```



## 3. Combat Basics

Combat is conducted in **rounds**. Within each round, every combatant will take a **turn**. Some combatants may take multiple turns within a single round.

Before combat can begin, the GM will have to do the following:

1. Determine who are the combatants, and sort each of them into one of three **sides**:

   - **Allies** - combatants belonging to the player side, which includes all player characters, as well as non-player characters that are aligned with the players.

   - **Enemies** - combatants that play the role of antagonists for the allies.

   - **Independents** - combatants belonging to neither the player side nor the enemy side.

2. Determine whether there are any combatants that are **Surprised**.

Once the above is done, the GM will start the first round of combat and follow the turn order.

### Surprise

If the GM judges that some combatants are caught unaware as combat begins, those actors gain the **Surprised** condition before combat starts. While they have the Surprised condition, they **act last in the turn order**, and they **cannot take reactions**.

Surprise may also be inflicted mid-combat as determined by the GM. In that case, immediately apply the **Surprised** condition on the surprised combatant.

> A **condition** is a status that is applied to a creature that can be removed. Rules for conditions are described in detail later.

### Turn Order

A round follows a modified *zipper initiative* turn order. Combat alternates turns between the **allies** and **enemies**.

- For **Round 1**, the **players decide** which of the combatants on the allies takes the first turn. The chosen combatant then takes their turn. If everyone on the allies side is Surprised, then the enemies go first instead.
- Turns then **alternate sides** - enemies, players, enemies, and so forth, with each side choosing which of its combatants will take the next turn (the GM chooses for the enemies).
- When one side has no combatants left that need to take a turn, the other side freely takes all their remaining turns in sequence.
- Whichever side between allies and enemies took the **final turn** in a round, the **other side** will take the **first turn of the following round**.

Special cases:

- **Slowed** combatants take their turn only after every other **non-Slowed** combatant (on either side) have already taken all their turns.

- NPCs belonging to neither allies nor enemies are considered **independents**, and they always **take their turns last in a round** after both the allies and enemies have already taken all their turns, regardless if anyone has the Slowed condition. An NPC that is allied to a side is not considered an independent; they will take their turn as part of either the allies or enemies as appropriate.

In summary:

```
Allies/Enemies --> Slowed Allies/Enemies --> Independents
```

### Taking a Turn

At the start of a player turn, the player character:

1. Regains Vigor equal to **3 + (BODY / 2)**; their Vigor cannot exceed their Max Vigor.
2. Restore Guard back to Max Guard.

> Remember that characters with **Over-Guard** (temporarily with more Guard than their Max Guard) do not restore their Guard back to their Max Guard.

Characters enter the first round of combat with full Vigor and Guard, unless otherwise specified by the GM.

During the turn, the character can choose to take maneuvers, many of which will cost Vigor. If a maneuver has a Vigor cost that exceeds the character's current Vigor, then the maneuver cannot be taken.

A player can choose to end their turn when they don't want to (or can't) take anymore maneuvers. Any unspent Vigor is kept, and may be used to power **reactions**.

If the character has any **conditions** that are **roll-to-clear** or **auto-clear**, they are resolved at the end of the turn as well.

> **Design note:** A key tactical decision for players is how to budget their Vigor across rounds. Not spending all of their Vigor during their turn allows them to reserve some Vigor for defensive reactions.

### Taking Multiple Turns

Certain powerful combatants (like boss enemies) may be able to take multiple turns per round.

For combatants with multiple turns, each of their turns are taken one at a time, and each turn is treated as an individual event within the *zipper initiative* turn order. For example, if you have Player A, Player B, and a Boss enemy that can take 2 turns:

- **CORRECT:** Player A Turn --> Boss Turn 1 --> Player B Turn --> Boss Turn 2
- **INCORRECT:** Player A Turn --> Boss Turn 1 --> Boss Turn 2 --> Player B Turn

For combatants with multiple turns, certain turn-cycle hooks have to handled in a special manner:

- Unless otherwise specified, any events that refer to the **"start of your next turn"** will resolve at the start of the next turn that the combatant takes, regardless how many turns they can take in a round. And if the combatant gains resources at the start of a turn, it will apply to every turn that they take. For example, if a player character has an ability to let them take two turns per round, they will be able to restore Vigor/Guard twice during a round.
- Any events that refer to the **"end of your turn"** will resolve at the end of the combatant's **last turn** of the round. This includes resolving conditions, **Faltering** and **Unraveling** checks, and so forth.

A combatant always has the option to **forgo any extra turns** they have and make the current turn their last turn of the round. However, every combatant must at least take one turn each round.

> **Design note:** A multi-turn enemy that spends all of its attacks on a single character is the deadliest behavior available in the game. Author it deliberately, and telegraph it.

### Maneuvers

All characters can perform the following maneuvers during their turn. Certain **masteries** and **archetypes** may grant additional maneuver options as well.

| Maneuver          | Vigor Cost    | Description                                                  |
| ----------------- | ------------- | ------------------------------------------------------------ |
| Move              | Free / 1      | Move a number of squares up to SPD. This movement cannot be broken up and has to be resolved all at once. Every Move maneuver costs 1 Vigor, but the first Move maneuver each turn is free. |
| Shift             | 1             | Move a number of squares up to half SPD (minimum 1). This movement cannot be broken up and has to be resolved all at once. Does not trigger **reactive attacks**. |
| Basic Attack      | 2             | Make one attack with an equipped weapon.                     |
| Shove             | 2             | Make one attack with the **Unarmed Attack** weapon. Instead of dealing damage, push the target away N number of squares, where N = number of successes rolled on the attack (maximum 3). This is considered **forced movement**. |
| Grab              | 2             | Make one attack with the **Unarmed Attack** weapon. Instead of dealing damage, the target gets the **Hindered N** condition, where N = number of successes rolled on the attack (maximum 3). |
| Feint             | 2             | Make one Basic Attack with a **melee weapon**. Instead of dealing damage, the target gets the **Vulnerable N** condition, where N = number of successes rolled on the attack (maximum 3). |
| Use Consumable    | 1             | **Spend a consumable point** to activate the effects of one consumable. |
| Hide              | 1             | Become **Hidden** if the conditions for hiding are met.      |
| Shake It Off      | 2             | Clear one stack of the **Hindered** or **Exhausted** condition. |
| Catch Your Breath | Full turn     | **Spend 1 Resolve to restore Vitality** equal to **half their Max Vitality**. Taking this maneuver does not cost any Vigor, but the character cannot take any other maneuvers or reactions until the start of their next turn, except for their free **Move**. |
| Steady Yourself   | Full turn     | **Clear Strain** equal to **half their Max Strain**. Taking this maneuver does not cost any Vigor, but the character cannot take any other maneuvers or reactions until the start of their next turn, except for their free **Move**. |
| Surge             | Free (1/turn) | Burn your mental and spiritual reserves for action. The character may choose to **increase Vigor** up to a **maximum value of MIND**, but for each point of Vigor gained, they will **take 2 Strain**. This cannot raise Vigor above the Max Vigor, and once used, they may not **Surge** again until the start of their next turn. A character with MIND of 0 cannot **Surge**. |
| Cast a Spell      | Variable      | See the **spellcasting** section.                            |
| Limit Break       | Full turn     | See the **Limit Breaks** section. Limit Breaks do not cost any Vigor, but the character cannot take any other maneuvers or reactions until the start of their next turn, except for their free **Move**. |

### Reactions

Reactions are maneuvers that can be taken at any time (usually outside of a character's turn), in response to a **trigger**. When a trigger event is met, the character has the option to take the reaction immediately, provided that the Vigor cost is paid. For any single trigger event, the affected character may take at most one reaction.

All characters can perform the following reactions. Certain **masteries** or **archetypes** may grant additional reaction options as well.

| Reaction  | Trigger                                                      | Vigor Cost | Description                                                  |
| --------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------------ |
| Dodge     | When you are targeted by an attack.                          | 2          | *Reactive Defense*<br />You **oppose** the attack with AGI.  |
| Brace     | When you are about to take damage from an attack.            | Free       | You gain **resistance** to the attack. You immediately become **Broken**. |
| Intercept | A combatant out of reach of one of your equipped **melee weapons** moves into reach during their movement. | 2          | *Reactive Attack*<br />Make a **Basic Attack** against the triggering combatant using the equipped **melee weapon**. This interrupts the movement, but the target can finish their movement after the attack resolves. |
| Forestall | A combatant within reach of one of your equipped **Reflexive melee weapons** attempts to move, and it is **not forced movement**. | 2          | *Reactive Attack*<br />Make a **Basic Attack** against the triggering combatant using the equipped **Reflexive melee weapon**. This interrupts the movement, but the target can finish their movement after the attack resolves. |

> For defensive reactions like **Dodge** which are triggered by another combatant targeting a character with an attack, the reaction is declared the moment they are targeted, before the attacker rolls.
>
> Note that although **Brace** has no Vigor cost, effectively it can only be used once, as once a character receives the **Broken** condition, they are locked out of taking any further maneuvers and reactions until the condition is cleared. Players should treat this as a last resort.

Two notable reactions that are available via the **Warrior** archetype:

| Reaction      | Trigger                                                      | Vigor Cost | Description                                                  |
| ------------- | ------------------------------------------------------------ | ---------- | ------------------------------------------------------------ |
| Deflect       | When you are targeted by a **melee attack**, and you have an equipped weapon with the **Deflect** or **Shield** tag. For weapons with the Deflect tag, the **weight class** of the weapon must equal or exceed the attacking weapon's weight class. | 1          | *Reactive Defense*<br />You **oppose** the attack with either POW or AGI, depending on the attribute of the weapon used for deflection. Once an equipped weapon has been used in this manner, it cannot be used again to Deflect until the start of their next turn. |
| Counterattack | When you are targeted by a **melee attack**.                 | 2          | *Reactive Attack*<br />Immediately make a **Basic Attack** against the attacker with an equipped melee weapon. Resolve the counterattack first, then take the triggering damage in full. |

> **Weapon weight classes:** Superheavy > Heavy > Medium > Light
>
> For attacks that do not have a specified weapon weight class, treat them as **Medium** weapons.

### Indefensible Attacks

Certain attacks will carry the **Indefensible** tag. Against those attacks, the target cannot use **reactive defenses** like **Dodge** or **Deflect**. However, the target can still **Brace** or **Counterattack**.

### Grab

To take the Grab maneuver, make one **Unarmed Attack** against the target. Instead of dealing damage, the target gets the **Hindered N** condition, where N = number of successes rolled on the attack (maximum 3). Like any other attack, this Unarmed Attack can be mitigated with **reactive defenses**.

While the **Hindered** condition is active, the target is considered grabbed by the attacker. While grabbed, neither the target nor attacker can **Move** or **Shift** unless they remain adjacent to each other throughout the movement. If one of the two is bigger than the other (based on SIZE), then the bigger creature can move freely, and the smaller creature will be dragged along to remain adjacent to the bigger creature. Being dragged in this manner is considered **forced movement**.

Once all stacks of the Hindered condition are removed, the target is no longer considered grabbed by the attacker, and both attacker and target can move freely. If the attacker and target are ever no longer adjacent, the grab ends immediately; any remaining Hindered stacks persist.

During the attacker's turn, they can take the Grab maneuver again to attempt to add on more stacks of the Hindered condition. However, like most of the other stackable conditions, the cap on the number of stacks is 3.

### Free Actions

Minor narrative actions during combat (e.g., opening a door, picking up a key from a table, shouting to an ally, etc.) don't consume Vigor and can be taken freely within reason (GM adjudicates).

### Movement

When a character takes the Move (or Shift) maneuver, they can move a number of squares up to their SPD value. (or half their SPD value, for Shift). Additional rules:

- Diagonal movement (on a square grid map) costs 1 square, just like horizontal and vertical movement.
- Some squares may be considered **difficult terrain**, in which case it costs double to move into that square. If a character only has 1 square of movement, they will not be able to move into difficult terrain.
- Characters with any stacks of the **Hindered** condition can only **Move up to half SPD** (minimum 1), and they **cannot Shift**.
- Involuntary movement (like movement caused by the **Shove** maneuver) is called **forced movement**, and does not trigger **Forestall** reactions.

Other forms of movement requires special rules:

- **Climb** - All characters are assumed to be able to climb.
  - **Trained in Climbing skill** - You can **Move** and **Shift** as per normal, but every square while climbing is treated as **difficult terrain**.
  - **Not trained in Climbing skill** - You **cannot Shift** while climbing. Whenever you take the **Move** maneuver when climbing, you **may not move more than 1 square**, regardless of your SPD.
- **Swim** - All characters are assumed to be able to swim.
  - **Trained in Swimming skill** - You can Move and Shift as per normal, but every square while swimming, is treated as **difficult terrain**.
  -  **Not trained in Swimming skill** - You **cannot Shift** while swimming. While swimming, all maneuvers cost **double the Vigor** (doesn't apply to maneuvers with no Vigor cost).
- **Horizontal Jump** - When a character takes the **Move** maneuver, they can traverse obstacles (like empty space, pits, or hazards) of no more than **one square long** during their movement, as long as they finish their Move on a flat and stable surface. If they are **trained in the Jumping skill**, they can traverse obstacles up to a length of half their SPD.
- **Vertical Jump** - A character can take the **Move** maneuver to attempt to jump vertically straight up. The number of squares they can jump is equal to their SIZE value. If they are trained in the Jumping skill, the number of squares they can jump is equal to twice their SIZE value.

> **Falling:** A creature that falls takes 2 untyped damage per square of distance fallen. The distance can be mitigated by the character's AGI value. For example, Mira falls 5 squares has an AGI of 3. Effectively, that means she treats the fall as if it is only 2 squares distance, and thus she will only take 4 untyped damage from the fall.

### End of the Round

- A combat round ends when every combatant has taken all their turns, and the next round begins.

- Remember, whichever side between the allies and enemies took the **final turn** in a round, the **other side** will take the **first turn of the following round**.

### Ending the Combat

The GM can declare combat to be over if any of the following are true:

- All of the enemy combatants have been **Defeated**.
- The players have already achieved the main objectives of the combat.
- All of the players characters are either **Defeated** or **Lost**.



## 4. Attacking in Combat

To make a **Basic Attack**, or any other maneuver that is an attack:

1. Determine the attack dice pool size, based on the **attribute** used for the attack, and applying any **modifiers** as required.
   - **For weapons**, the attribute used is either POW or AGI, depending on the weapon.
   - **For other attacks**, other attributes may be used.
2. Count the number of successes. If the attack is opposed by a reactive defense (e.g., Dodge), the defender will roll, and their number of successes will be deducted from the attacker's number of successes (minimum 0).
3. Determine the damage from the attack stat block based on the resulting number of successes. For example, a weapon may have the following stat block:

```
[WEAPON] Mace (Crushing, Melee 1)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 7 damage
- 2s: 13 damage
- 3+: 20 damage
```

4. Apply the damage to the defender's **Guard** first, and only after it is depleted, then the remaining damage gets deducted from the defender's **Vitality**.

Some attacks may force the target to take **Strain**, instead of damage. In which case, all of the rules above still apply, but Guard will not defend against Strain (since the defender is not taking physical damage).

### Solid Hit

All characters will by default have the **Solid Hit** **pattern** that can be applied for every attack roll.

```
[PATTERN] Solid Hit (Double)
Applies to: Attacks that deal damage

Effect: Increase the damage of the attack by 3.
```

### Melee vs. Ranged Attacks

Attack tags determine whether an attack is melee or ranged.

**Melee attacks** are tagged with **Melee N**, with N indicating the reach of the weapon in squares. An attacker can attack any target within the stated reach as long as the attack can reasonably reach the target (GM adjudicates). **Melee attacks are not affected by cover**.

**Ranged attacks** are tagged with **Range N**. N is the **maximum range** of the attack in squares. An attacker can attack any target within the maximum range, as long as they have an unobstructed line-of-sight to the target (GM adjudicates). **Ranged attacks are affected by cover**.

For ranged attacks, there could be a penalty modifier to the attack roll depending on how far the target is:

| How far is the target...                   | Attack roll penalty |
| ------------------------------------------ | ------------------- |
| Adjacent to the attacker (1 square)        | -1d penalty         |
| Number of squares up to the attacker's SEN | none                |
| Up to maximum range                        | -1d penalty         |
| Anything over maximum range                | cannot target       |

> If the attacker's SEN is greater or equal to the maximum range, then any attack within maximum range will have no penalty.

If an attack has no **Melee N** or **Range N** tag specified, then by default assume it is **Melee 1**.

### Damage Types

Every attack carries one or more **damage type tags**, set by the weapon, spell, or ability. Damage types could determine the kind of defense that could be used to mitigate the attack, or affect **Resistances** and **Weaknesses**.

| Damage Type                  | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| Slashing, Piercing, Crushing | Attacks that deal one of the three flavors of physical damage. If an attack does not have any damage type tags specified, assume that it is **Crushing by default**. |
| Fire                         | Attacks that do damage based on flame and heat.              |
| Earth                        | Attacks that do damage based on stone, rocks, or grounding force. |
| Water                        | Attacks that do damage based on water, ice, or freezing cold. |
| Air                          | Attacks that do damage based on wind, pressure, or vacuum.   |
| Mental                       | Attacks on the mind.                                         |
| Cosmic                       | Attacks that defy worldly physics, like time, fate, void.    |
| Radiant                      | Attacks using holy, light, or positive energy.               |
| Necrotic                     | Attacks using decay, entropy, or dark energy.                |
| Corrosive                    | Attacks that dissolve, poison, or break down matter.         |
| Shock                        | Attacks using electrical charge, voltage, or plasma.         |
| Sonic                        | Attacks that do damage based on sound waves, vibration, or concussive pitch. |
| Untyped                      | Usually represents falling, drowning, or other kinds of environmental damage. Untyped damage is **not affected by Guard, resistances, weaknesses**, and generally cannot be mitigated. |

> A single attack may carry several damage type tags. For example, a **holy flaming sword** may carry the **Slashing**, **Radiant**, and **Fire** tags.
>

### Resistance and Weakness

Resistances and weaknesses modify the amount of damage that a target may take from an attack:

- If a target has **resistance**, damage is **halved** (minimum 0) before being applied to Vitality.
- If a target has **weakness**, damage is **doubled** before being applied to Vitality.

Resistances and weaknesses is only applied to the portion of the damage that hits Vitality, and not to the damage that depletes Guard.

Also, **attacks that deal Strain** are **not affected by resistance and weakness**. Therefore, effects that grant resistance/weakness to an attack (Brace, Arcane Shield, the Mark hit location, etc.) do nothing against attacks that deal Strain.

Resistances and weaknesses are typed to specific damage types. Examples: **Resistance (Crushing)**, **Resistance (Fire)**, **Weakness (Radiant)**, and so forth.

> Some abilities like the **Brace** maneuver or targeting the **Mark hit location** say that you "gain resistance/weakness to the attack". This just means that regardless of damage type, the character has resistance or weakness against that attack only. This follows the same rules for stacking and canceling out resistances/weaknesses as per below.

For a creature that has resistance to all three of the physical damage types, you can use the **Resistance (Physical)** shorthand to represent having **Resistance (Slashing)**, **Resistance (Piercing)**, and **Resistance (Crushing)**. Same applies to weaknesses as well.

Special handling of resistances and weaknesses for attacks that carry multiple damage types:

- If an attack has multiple damage types, and the defender has **resistance to at least one listed damage type** and **no weaknesses** to any listed damage type, then the defender has **resistance** against the attack.
- Similarly, If an attack has multiple damage types, and the defender has **weakness to at least one damage type** and **no resistances** to any listed damage type, then the defender has **weakness** against the attack.
- If a defender has **at least one resistance and one weakness** against any of the attack's listed damage types, then the defender treats the attack normally **without any resistances or weaknesses**.

> **Design note:** Cancelling out resistances and weaknesses in this simple manner is a design decision to speed up play.

Example: Mira deals 20 damage with the holy flaming sword (Slashing, Radiant, Fire) to a creature with 5 Guard:

| If the creature has...                    | Then they will take this much Vitality damage... | Notes                   |
| ----------------------------------------- | ------------------------------------------------ | ----------------------- |
| No resistances or weaknesses              | 15 damage = 20 damage - 5 Guard                  |                         |
| Resistance (Fire)                         | 7 damage = (20 damage - 5 Guard) / 2             |                         |
| Resistance (Slashing) + Resistance (Fire) | 7 damage = (20 damage - 5 Guard) / 2             | No stacking resistances |
| Weakness (Fire)                           | 30 damage = (20 damage - 5 Guard) x 2            |                         |
| Weakness (Radiant) + Weakness (Fire)      | 30 damage = (20 damage - 5 Guard) x 2            | No stacking weaknesses  |
| Resistance (Slashing) + Weakness (Fire)   | 15 damage = 20 damage - 5 Guard                  | Cancels out             |

### Attack Tags

Besides **Melee N**, **Range N**, and **damage type tags**, there are a few more attack tags that require special treatment:

- **Penetrating** - If the attack inflicts damage, then it bypasses Guard and hits Vitality directly. Note that attacks that deal Strain will not benefit from this tag, since Strain damage does not go through Guard.
- **Indefensible** - The attack cannot be mitigated by using **reactive defenses**. 
- **Imprecise** - This attack cannot be used to target specific hit locations. It can only target Mass. This means that an Imprecise attack cannot be used to attack a target that is behind Cover.
- **Seeking** - This attack is not affected by Cover.

### Area Attacks

Any attack that affects an area (including spells) automatically gains the **Imprecise** and **Seeking** tags.

In addition, any creatures that are within the area of effect are affected, even if they are **Hidden**. An area attack affects the space, not a chosen target.



## 5. Taking Damage

### Wounds

Whenever a character's Vitality is reduced to 0 or below:

- If you have **no Wound slot remaining**, you immediately gain the **Defeated** condition.

- Otherwise, you fill an empty Wound slot with a Wound and restore your Vitality back to maximum.

To determine the **severity** of the Wound that you receive, **test your luck** and refer to the below.

```
Wound Severity (minimum 1) = Number of Wound slots filled (including the Wound to be received) − Number of successes on luck roll
```

> Without any mitigation from the luck roll, by default the first Wound will be a **Flesh Wound**, the second a **Trauma Wound**, and the third a **Critical Wound**.

| Wound Severity | Description        | Effect                                                       |
| -------------- | ------------------ | ------------------------------------------------------------ |
| **1**          | **Flesh Wound**    | Gain the **Impaired N** condition, where N = number of Wound slots now filled (including this Wound). |
| **2**          | **Trauma Wound**   | **Roll 1d6:**<br />1-2: Choose one of your equipped gear; the gear becomes disabled until the Wound is removed. If you have no gear left to disable, roll again.<br />3: Gain the **Hindered 1** condition.<br />4: Gain the **Exhausted** condition.<br />5: Gain the **Slowed** condition.<br />6:  Gain the **Shrouded** condition. |
| **3+**         | **Critical Wound** | Gain the **Faltering 1** and **Broken** conditions.          |

> Conditions obtained from Wounds are cleared as per the normal rules for that condition.
>
> Called shots (see Hit Locations below) that result in a Wound, may have their Wound severity raised:
>
> - A **Edge** called shot attack that causes a Wound will result in a Wound severity **minimum of 2**.
> - A **Mark** called shot will result in a Wound severity **minimum of 3**.
>
> These severity floors apply regardless of the results of testing your luck.

### Burdens

Whenever a character's Strain reaches or exceeds Max Strain:

- If you have **no Burden slot remaining**, you immediately gain the **Lost** condition.

- Otherwise, you fill an empty Burden slot with a Burden and reset your Strain back to 0.

To determine the **severity** of the Burden that you receive, **test your luck** and refer to the below:

```
Burden Severity (minimum 1) = Number of Burden slots filled (including the Burden to be received) − Number of successes on luck roll
```

> Without any mitigation from the luck roll, by default the first Burden will be **Confusion**, the second an **Affliction**, and the third a **Breakdown**.
>

| Burden Severity | Description | Effect |
|---|---|---|
| **1** | **Confusion** | Gain the **Impaired N** condition, where N = number of Burden slots now filled (including this Burden). |
| **2** | **Affliction** | **Roll 1d6** on the table below and gain an **affliction** that persists until the Burden is removed. If you roll an affliction that you already have, roll again. |
| **3+** | **Breakdown** | Gain the **Unraveling 1** condition and **roll 1d6** to gain an **affliction** that persists until the Burden is removed. If you roll an affliction that you already have, roll again. |

> Conditions obtained from Burdens are cleared as per the normal rules for that condition.
>

| 1d6 | Affliction | Effect |
|---|---|---|
| 1 | **Paranoid** | You cannot voluntarily end your turn adjacent to an ally. |
| 2 | **Reckless** | You cannot use **Brace**, or any **reactive defenses**, or take the **Shift** maneuver. The GM may also adjudicate that other reactions or maneuvers be included as well. |
| 3 | **Obsessed** | The GM names a fixation on the battlefield (either a combatant, an object, or a place). Each turn, your first maneuver must either move you closer to, or attack, the fixation, if possible. |
| 4 | **Terrified** | You cannot voluntarily move toward any combatant that has damaged you this combat; if you begin your turn adjacent to one, your first maneuver must be to move away, if possible. |
| 5 | **Withdrawn** | You cannot attack a combatant unless it has damaged you or an ally this combat. |
| 6 | **Bloodthirsty** | Each turn, your first attack must target the nearest combatant to you, regardless whether it's an ally or enemy. |

### Excessive Damage

When damage reduces Vitality to 0 or below, a Wound is taken, and Vitality refills. If there is any **excess damage** after reducing Vitality to 0, it carries over onto the refilled Vitality bar. For example, an unhurt character with a Max Vitality of 10 and no Wounds takes 15 damage from an attack. He will end up with 1 Wound and only 5 Vitality after the attack.

The same applies to Strain; when it **reaches or exceeds Max Strain**, a Burden is taken, Strain resets, and if there is **excess Strain**, the character will have to take it.

It is therefore possible for a single huge attack to cause multiple Wounds (or Burdens) at once, if the excess damage/Strain is large enough.

### Defeat and Loss

- When a character becomes **Defeated**, their Vitality is set to **0**. Defeated characters are essentially out of the combat until the Defeated condition can be removed.
- When a character becomes **Lost**, their Strain resets to **0**. Lost characters are still in combat, but lose some player agency and must follow the GM's commands until the Lost condition can be removed.

### Healing Wounds and Burdens

Wounds and Burdens persist after combat. They can be healed via **downtime**, **story events**, or by **spending Resolve** during **interludes**:

- Removing **Trauma Wounds** will restore disabled gear.
- Removing Burdens will remove any afflictions that are tied to that Burden.



## 6. Hit Locations

There are three abstract hit locations that can be targeted:

- **Mass** - This is the default hit location for all attacks that does not specifically target a hit location. This usually represents the torso, center, or bulk of the target.
- **Edge** - This represents an appendage or limb of the target.
- **Mark** - This represents the command center, critical organ, or weak point of the target.

When making an attack, the attacker may declare a hit location *before* they roll:

| Hit Location | Targeting Penalty | Effect |
|---|---|---|
| Mass | none | No additional effect. |
| Edge | −2d penalty | If the attack results in a Wound, it will result in a Wound severity **minimum of 2**. |
| Mark | −3d penalty | The defender gains **weakness** to the attack. If the attack results in a Wound, it will result in a Wound severity **minimum of 3**. |

All player characters will have Mass, Edge, and Mark locations. Every creature must always have a Mass. Some creatures may not have Edge or Mark locations. Individual enemy stat blocks may declare additional valid targets or restrictions.

Attacks that deal Strain will generally have no additional benefit from hit locations.



## 7. Conditions and States

A **condition** is a status applied to a creature that can later be removed. Every condition is either **stackable** or **non-stackable** and has one of three **clear types**.

### Stacking

A **stackable** condition is written **Condition N**, where N is the number of stacks (e.g. **Impaired 3**). Stacks of the same condition are cumulative, up to the max limit. For example, if a character has **Impaired 1** and receives **Impaired 2** from an incoming attack, then now the character has **Impaired 3**.

**All stacked conditions cap at 3 stacks.** The only exception is **Faltering** and **Unraveling**, which are uncapped.

Unless a condition's effect states that the effect scales per stack, additional stacks do not intensify the effect; they only prolong it.

### Clear Types

There are three clear types for conditions. Note that for clearing purposes, a **non-stackable condition counts as having 1 stack.**

- **Auto-clear** - At the end of the affected combatant's turn, lose 1 stack of the condition. The condition is fully cleared when the number of stacks reach 0.

- **Roll-to-clear** - At the end of the affected combatant's turn, **make a roll** using the specified attribute, and remove a number of stacks equal to the **number of successes**. The condition is fully cleared when the number of stacks reach 0.

- **Persistent** - Does not clear on its own. The condition is only removed by specific means specified within the condition description.

Conditions may also be cleared via special abilities or maneuvers. For example, the **Shake It Off** maneuver can automatically clear stacks of the **Hindered** or **Exhausted** conditions.

### List of Conditions

Here are the list of general conditions. Special abilities, archetypes, or masteries may also define other unique conditions.

| Condition | Stackable? | Clear Type |
|---|---|---|
| Broken | no | auto-clear |
| Cursed | no | persistent |
| Defeated | no | persistent |
| Exhausted | no | roll-to-clear (POW) |
| Faltering | yes (uncapped) | persistent |
| Frightened | no | roll-to-clear (PRE) |
| Hindered | yes (max 3) | roll-to-clear (POW or AGI) |
| Impaired | yes (max 3) | auto-clear |
| Lost | no | persistent |
| Provoked | no | auto-clear |
| Shrouded | no | roll-to-clear (INS) |
| Slowed | no | roll-to-clear (AGI) |
| Surprised | no | auto-clear |
| Unraveling | yes (uncapped) | persistent |
| Vulnerable | yes (max 3) | persistent |
| Wracked (Damage Type) | yes (max 3) | auto-clear |

```
[CONDITION] Broken
Stackable: no
Clear Type: auto-clear

Effect: You may not take any maneuvers or reactions, except for the free Move maneuver during your turn.
```

```
[CONDITION] Cursed
Stackable: no
Clear Type: persistent

Effect: When you test your luck, it always results in 0 successes.
```

```
[CONDITION] Defeated
Stackable: no
Clear Type: persistent

Effect: You are out of the combat. You no longer take any turns, maneuvers, or reactions. When you receive the Defeated condition, your Vitality is set to 0, and any stacks of the Faltering condition are cleared.

When the Defeated condition is removed, your Vitality is restored to 1, and you may immediately spend 1 Resolve for a free Catch Your Breath maneuver that is resolved immediately, and has no Vigor cost.
```

```
[CONDITION] Exhausted
Stackable: no
Clear Type: roll-to-clear (POW)

Effect: Refresh only half your Vigor at the beginning of each turn (minimum 1).

Special: For enemies or creature that do not track Vigor, if they gain the Exhausted condition, they instead lose one maneuver and one reaction per turn while they have the condition.
```

```
[CONDITION] Faltering
Stackable: yes (unlimited)
Clear Type: persistent

Effect: At the end of your turn, roll a single 1d6. If you roll less than your number of Faltering
stacks, you immediately gain the Defeated condition; otherwise, add 1 to your Faltering stack.

The Faltering condition is cleared if the Critical Wound that caused the condition is healed.
```

```
[CONDITION] Frightened
Stackable: no
Clear Type: roll-to-clear (PRE)

Effect: You cannot voluntarily move toward, or melee attack, the source of the fear (ranged attacks against the source are allowed). The source of the fear is assigned (with GM adjudication) at the moment the Frightened condition is inflicted.
```

```
[CONDITION] Hindered
Stackable: yes (max 3)
Clear Type: roll-to-clear (POW or AGI)

Effect: Your SPD is halved (minimum 1). You apply a -1d penalty on all attacks, and all attacks against you gain a +1d bonus. You cannot take the Shift maneuver, or take the Dodge reaction.
```

```
[CONDITION] Impaired
Stackable: yes (max 3)
Clear Type: auto-clear

Effect: You take a -1d penalty per stack on all rolls, including attacks (except when you test your luck, which is exempt from all modifiers).
```

``` 
[CONDITION] Lost
Stackable: no
Clear Type: persistent

Effect: You remain on the battlefield, but your will is no longer your own. When you receive the Lost condition, your Strain is reset to 0, and any stacks of the Unraveling condition are cleared. While you are Lost, you cannot gain Strain from any source, including voluntarily.

At the start of your turn, the GM gives you a one-sentence command; you must act toward it, although the choice of tactical execution (e.g., choosing which maneuver to use, and which weapon to attack with, etc.) remains yours. You may attempt to resist the GM's command: make a PRE roll, and if you get 3+ successes, you instead take no maneuvers during that turn. The players can choose when within the round they want a Lost character to take its turn.

Special: If a combatant that is already under the GM's control gains the Lost condition, they gain the Defeated condition instead.
```

```
[CONDITION] Provoked
Stackable: no
Clear Type: auto-clear

Effect: You are fixated on this condition's source (your provoker). You take a -2d penalty on attacks and other hostile action rolls against any target other than your provoker. If you gain Provoked from a new source, the newest provocation replaces the old.
```

```
[CONDITION] Shrouded
Stackable: no
Clear Type: roll-to-clear (INS)

Effect: Your senses are degraded. All creatures beyond 1 square of you are treated as obscured to you, and your SEN value is effectively 1 for the purposes of spellcasting or ranged attacks.
```

```
[CONDITION] Slowed
Stackable: no
Clear-Type: roll-to-clear (AGI)

Effect: You may take your turn in a round only after every non-Slowed combatant on every side has already taken all their turns. If you can take multiple turns per round, you can only take your turns after all of the non-Slowed combatants have taken theirs.
```

```
[CONDITION] Surprised
Stackable: no
Clear-Type: auto-clear

Effect: While you have this condition, you also have the Slowed condition, and you cannot take reactions. When the Surprised condition is cleared, the attached Slowed condition is also cleared.
```

```
[CONDITION] Unraveling
Stackable: yes (unlimited)
Clear Type: persistent

Effect: At the end of your turn, roll a single 1d6. If you roll less than your number of Unraveling stacks, you immediately gain the Lost condition; otherwise, add 1 to your Unraveling stack.

The Unraveling condition is cleared if the Breakdown that caused the condition is healed.
```

```
[CONDITION] Vulnerable
Stackable: yes (max 3)
Clear Type: persistent

Effect: The first attack that targets you next gains +1d per stack of the Vulnerable condition. All stacks of the Vulnerable condition are cleared once the attack has been resolved.
```

```
[CONDITION] Wracked (Damage Type)
Stackable: yes (max 3)
Clear Type: auto-clear

Effect: The Wracked condition is always accompanied by a damage type when applied. At the end of your turn, take 2 damage per stack of the specified damage type. This damage is considered Penetrating (bypasses Guard), and it is taken before the stack is reduced by 1 from auto-clear.

Wracked (Bleeding) is a special kind of Wracked condition. Mechanically, it is treated as a combination of both the Piercing and Slashing damage types. Thus, if the target has any resistances or weaknesses to either Slashing or Piercing damage, it would apply to the damage from the Wracked (Bleeding) condition.
```

### List of States

States are not conditions that can be applied and removed, but are instead derived from the character's present state. States may be referenced by different special abilities.

| State    | Definition                                                   |
| -------- | ------------------------------------------------------------ |
| Crisis   | A creature is in **Crisis** if they have either the **Faltering** or **Unraveling** conditions, or if they have **no Wound slots** or **no Burden slots** remaining. |
| Stressed | A creature is **Stressed** if their Strain is at least **half of their Max Strain** (rounded down). Example, if a character has a Max Strain of 7, they are considered Stressed if they have 3 or more Strain. |



## 8. Vision, Lighting and Cover

### Visibility

| Visibility | Description | Attack roll penalty |
|---|---|---|
| Visible | Target can be clearly seen and observed. | none |
| Obscured | Location of the target is known, but imprecise. | -2d penalty |
| Hidden | Location of the target is unknown. | cannot target |

### Environmental Lighting

| Environmental Lighting | Effect |
|---|---|
| Bright Light | All combatants are considered visible |
| Dim Light | Combatants up to the character's SEN range are visible; obscured beyond that |
| Darkness | Combatants adjacent to the character are obscured; hidden beyond that |

Certain ancestry archetypes may grant special vision abilities to mitigate poor environmental lighting:

- **Low-Light Vision** - Characters with Low-Light Vision can treat **Dim Light** as **Bright light**, and **Darkness** as **Dim Light** for vision and targeting purposes.
- **Darkvision** - Characters with Darkvision can treat both **Dim Light** and **Darkness** as **Bright Light** for vision and targeting purposes.

### Cover

Cover is a relationship between attacker and target; the target is behind something that shields part of their body. **A creature with Cover cannot have their Mass targeted by a ranged attack** (the attacker can only attempt an Edge or Mark attack).

If the target offers no valid Edge or Mark (e.g., a creature that is all Mass), it simply cannot be hit by a ranged attack from that angle.

Melee attacks ignore cover entirely.

### Invisibility

Certain abilities may grant the Invisibility condition.

```
[CONDITION] Invisible
Stackable: no
Clear-Type: persistent

Effect: You are always hidden to all other combatants. Combatants that are capable of locating invisible creatures will treat you as obscured instead.
```

### Hiding

Combatants may hide in combat by taking the **Hide** maneuver.

```
[MANEUVER] Hide (Vigor 1)

Effect: You can attempt to hide from any enemies that you are obscured from or have cover from. Roll an AGI action roll (+2d bonus if trained in Stealth skill).
- 0s: You do not become hidden. Your obscured or cover status doesn't change.
- 1s: You become hidden to the affected enemies until the start of your next turn.
- 2+: You become hidden to the affected enemies.

If at any time you voluntarily show yourself, make an attack, or are otherwise no longer obscured or have cover, then you are immediately no longer hidden to the affected enemies.
```

### Attacking while Hidden

Attacks made by a hidden attacker gain **+2d bonus to the attack roll** against the affected target. (Attacks made by an obscured attacker has no bonus.)

After the attack, the character is no longer hidden, although if conditions are still valid, they may still be obscured or have cover and thus can immediate take the **Hide** maneuver again to become **Hidden**.



## 9. Spellcasting

Spellcasting in Mantle is constructed at the moment of casting from two components:

- **Art** (the verb)
- **Resonance** (the noun)

The caster can also shape the spell across three spell dimensions: **range**, **duration**, and **area**.

The same Art works differently with each Resonance; the same Resonance produces radically different effects across different Arts. A small set of Arts combined with a growing set of Resonances yields hundreds of expressible spells.

### Casting a Spell

To cast a spell, the caster uses the **Cast a Spell** maneuver:

1. **Names an Art and a Resonance they have access to** - The Resonance must support the chosen Art (as specified in the Resonance description; if it doesn't have an entry for the Art, the combination is invalid).
2. **Decides how to further shape the spell** - i.e., upgrade the spell's range, duration, or area beyond the Art's **basic shape**.
3. **Pays the total Vigor cost** - The Art's base cost plus all spell-shaping upgrades.
4. **Make a spellcasting roll** - Roll using the caster's archetype-specified attribute (REA for Scholars, INS for Channelers, and so forth). Apply any penalties to the roll based on the chosen area shape.
5. **Resolve the spell effect based on the number of successes**.

### Arts and Resonances

Every spell is a combination of one **Art** and one **Resonance**:

- **Arts** provide the **structure**: base Vigor cost, basic shape (default range, duration, and area), defines shapeable dimensions, and the general effect bands (what each band of successes produces).
- **Resonances** provide the **substance**: how the spellcasting roll resolves, what damage type or attack tags the spell carries, what conditions it applies, and any other *reshaping* of the Art's default behavior to suit the Resonance's fiction.

A Resonance lists each Art it supports as a separate entry in its stat block. If a Resonance does not have an entry for an Art, that combination cannot be cast.

There are **10 Arts** in total:

| Art       | Type        | Mastery Slots | Description                                                  |
| --------- | ----------- | ------------- | ------------------------------------------------------------ |
| Rend      | Attack      | 1             | **Direct, instantaneous harm** - the bolt, lash, or jet of the Resonance's power. |
| Afflict   | Attack      | 1             | **A curse that takes root in the target** - the condition is the point; direct harm is incidental. |
| Bolster   | Utility     | 1             | **A transient boon** - protection, power, or insight, shaped by the Resonance. |
| Mend      | Restoration | 1             | **Restore what the Resonance's nature can undo** - knitting Vitality, unspooling Strain. |
| Imbue     | Utility     | TBD           | **The Resonance invested into a thing** - enchanted arms, warded doors, animated servants. |
| Compel    | Attack      | TBD           | **Will imposed upon a creature** - commanded, bound, or driven against its own intent. |
| Impel     | Attack      | TBD           | **The Resonance as force** - pushing, pulling,  lifting, or anchoring a body or object through space. |
| Conjure   | Utility     | TBD           | **The Resonance made manifest** - matter or creature called into being where nothing was. |
| Scry      | Utility     | TBD           | **Perception extended beyond the senses** - the distant, the hidden, the yet-to-come. |
| Transform | Utility     | TBD           | **Form remade** - a body or object reshaped in the Resonance's image. |

Here are some **sample Resonances**:

| Resonance | Mastery Slots | Description                                                  |
| --------- | ------------- | ------------------------------------------------------------ |
| Ignis     | 1             | **Fire and flame** - heat, hunger, transformation through consumption. Ignis takes; Ignis reveals. |
| Lux       | 2             | **Light made manifest** - banishing darkness, revealing truth, scouring corruption. Certainty wielded against shadow. |
| Mens      | 1             | **The realm of thought, will, and perception** - no armor guards the mind; only the mind itself does. |
| Tempus    | 2             | **The flow of moments themselves** - hastening, slowing, revealing. The rarest Resonance; every act has its proper instant. |
| Terra     | 1             | **The stubborn weight of the world** - pressing, crushing, grounding. Immovable, until something stronger moves it. |

### Spell-shaping

Every Art has a **basic shape**, its default range, duration, and area when casting the spell at the Art's base Vigor cost. The caster may upgrade any dimension that the Art lists as **Shapeable**, paying additional Vigor per step.

### Range Shaping

| Step     | Range                     |
| -------- | ------------------------- |
| 1        | Self                      |
| 2        | Touch (Melee 1)           |
| 3        | SEN                       |
| 4        | 2x SEN                    |
| 5        | 4x SEN                    |
| Every +1 | Double the previous range |

The range value represents the maximum number of squares that the spell can reach. Most Arts will start with a basic range shape at either step 1 or 2. Every step up adds **+1 to the Vigor cost** of the spell.

### Duration Shaping

| Step     | Duration                |
| -------- | ----------------------- |
| 1        | 1 round / instantaneous |
| 2        | 2 rounds                |
| Every +1 | +1 round                |

At the beginning of a caster's **first turn each round**, the duration values of all their spells are reduced by 1. If that reduces the duration to **0 rounds**, then the **spell is ended**.

Most Arts will start with a basic duration shape at step 1. Every step up adds **+1 to the Vigor cost** of the spell. If the caster wishes to sustain a spell for a prolonged duration, it's easier to do so with the **Sustained Casting** mastery that allows extending an active spell's duration and paying the Vigor cost incrementally round-by-round, rather than committing all of the Vigor spend at casting time.

Note that a caster can always elect to end a spell early as a free action on their turn, even if there is still duration remaining.

### Area Shaping

| Step | Area                                                         | Roll Penalty |
| ---- | ------------------------------------------------------------ | ------------ |
| 1    | Single target                                                | none         |
| 2    | Area 1 (3x3 squares, or one square in every direction from the center) | -1d penalty  |
| 3    | Area 2 (5x5 squares)                                         | -2d penalty  |
| 4    | Area 3 (7x7 squares)                                         | -3d penalty  |

Most Arts will start with a basic area shape at step 1. Every step up adds **+1 to the Vigor cost** of the spell. Unlike range and duration shaping, area shaping is capped at step 4. As the area gets bigger, the attack roll gets increasing penalties as well.

When an Art is cast as an Area spell, the **attack is rolled separately for each target** within the area, against each target's defenses individually. **Every target in the effective area is affected by the spell**, regardless whether it's friend or foe. Area spell attacks automatically gain the **Imprecise** and **Seeking** tags.

How area shaping interacts with range shaping:

- If the **Range** is either **Self** or **Touch**, then the area is represented as an **emanation** that radiates outward from the caster (the caster is considered the center, and is not impacted by the spell effect).

- If the **Range is greater than 1**, then the area is represented as a **blast** with a center chosen by the caster that is within range. The caster must have line of sight to the chosen center square.

### Special Area Shapes

Instead of area shaping emanations and blasts as described above, spellcasters with certain masteries can instead deploy a few special area shapes:

| Area Shape | Vigor Cost | Roll Penalty | Description                                                  |
| ---------- | ---------- | ------------ | ------------------------------------------------------------ |
| Salvo N    | +N         | none         | Only applies if the Range of the spell is at least Touch, and the basic area shape is at step 1 (single target). You can target up to N additional targets within Range. |
| Cone N     | +N         | -1d penalty  | Only applies if the Range of the spell is at least Touch. Draw a triangle with the apex adjacent to the caster, that is N squares deep and N squares wide at the base, with the cone pointing in a chosen direction. |
| Wall N     | +N         | -1d penalty  | Only applies if the Range of the spell is at least 2 squares. Draw a line of N x 2 squares that all have to be adjacent and with one of the squares within Range. The line doesn't need to be straight. |
| Line       | +2         | -1d penalty  | Only applies if the Range of the spell is at least 2 squares. Draw a straight line originating from the caster that is 2 squares wide and extends a number of squares in a chosen direction up to the Range of the spell. |

### Grazing with a Spell

When a spellcasting roll produces **0 successes**, the caster takes **1 Strain**. If the caster has performed spell-shaping on the spell beyond the spell's basic shape, they take **2 Strain** instead. Note that the *graze* effect for the spell still applies.

### When a Caster is Defeated

If a spell still has remaining duration, the spell **ends immediately if its caster becomes Defeated**. The persistent magic was sustained by the caster's conscious effort; without the caster acting, the spell dissolves. Note that this doesn't automatically apply to **Lost** characters, although the GM may instruct the Lost player to drop a sustained spell during their turn.

### Spells as Attacks

If the spell is an attack, it follows all of the standard rules for attacks, including allowing reactive defenses to interact with it, unless the attack is tagged as **Indefensible**.

By default, spell attacks can target Edge/Mark hit locations, unless the attack is tagged as **Imprecise**, in which case it can only target Mass. Similarly, spell attacks are affected by cover, unless the attack is tagged as **Seeking**. Any spells that affects an area automatically gains the **Imprecise** and **Seeking** tags.

Some spells will state that they are **Opposable**, in which case the target can oppose the spell using an opposition roll. Opposing is free: it is not a reaction and costs no Vigor. Spells that are both **Indefensible** and **Opposable** have the opposition roll as their only defense.

### Special Spellcasting Maneuvers

There are two notable maneuvers related to spellcasting that are worth highlighting:

| Maneuver                         | Vigor Cost | Description                                                  |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| Push the Craft (Scholar ability) | Free       | When you **cast a spell**, before rolling, you may **take Strain** voluntarily up to **MIND**; each Strain taken grants **+1d bonus on the spellcasting roll**. |
| Sustained Casting (mastery)      | 1          | If you have a spell with a duration that ends after the current round, you can **extend the spell's duration by 1 round**. If the caster has multiple duration spells active at the same time, Sustained Casting must be paid separately for each different spell. |

### List of Arts and Resonances

For a full list of Arts and Resonances, refer to the separate document: `Mantle — Spellcasting Catalog`.



## 10. Valor and Limit Breaks

**Valor** is the party's shared heroic momentum. It's a single team resource that swells as the heroes seize the initiative and fuels their most powerful maneuvers, **Limit Breaks**.

### Valor

Valor is a pooled resource shared by the whole party. It starts at 0 up to a maximum value determined by the following:

```
Max Valor = Sum of every party member's SOUL + number of party members
```

For the purposes of calculating Valor, only party members that belong to players are counted; NPC allies are not.

For example, if a party has 4 members, and they have SOUL scores of `1`, `0`, `3`, and `3`, then their max Valor is 11.

Valor is earned through **significant achievements** and lost through **genuine disasters.** Glory comes from worthy foes and turning points. However, Valor can never rise above the maximum value, or be reduced below 0.

Valor **persists across Interludes** within a mission and is **reset to 0 at downtime.**

> **Design note:** Having Valor persist between combats encourages players to push on instead of frequently taking full rests by going into downtime.

### Gaining Valor

| Achievement                                                  | Valor              |
| ------------------------------------------------------------ | ------------------ |
| Defeat a **Grunt** or **Regular** enemy                       | none               |
| Defeat an **Elite** enemy                                    | +1                 |
| Defeat a **Champion** enemy                                  | +2                 |
| Defeat a **Nemesis** enemy                                   | +3                 |
| Finish an encounter by achieving the **main encounter objective** | +3                 |
| Achieve a **side encounter objective** (i.e., encounter challenge) | +1                 |
| Perform a **cinematic or heroic act** that swings the combat in the Allies' favor | +1 (GM discretion) |
| Inflict the **Broken** condition on an enemy                 | +1                 |
| Remove the **Defeated** or **Lost** condition from an ally   | +1                 |

Other archetype abilities or masteries may also grant additional ways to gain Valor.

### Losing Valor

| Disaster                                               | Valor                    |
| ------------------------------------------------------ | ------------------------ |
| A player character or ally is **Defeated** or **Lost** | -1                       |
| Fail to achieve the **main encounter objective**       | -3                       |
| Any other **significant setback or disaster** occurs   | -1 to -3 (GM discretion) |

### Spending Valor

Valor can be spent during combat to support allies and shift the momentum of battle against the enemy.

| Spending Valor                                               | Valor               |
| ------------------------------------------------------------ | ------------------- |
| **Limit Break** - Perform a Limit Break maneuver.            | 3                   |
| **Heroic Fortune** - When a character is about to take a Wound or Burden, downgrade the severity of the Wound or Burden by 1. This can only be applied once per Wound or Burden. | 2                   |
| **Heroic Feat** - Add successes to any ally's roll. The character can decide to apply this after the roll is made. Up to 3 successes can be added in this manner on a single roll. This cannot be applied when testing your luck. | 1 per success added |

### Limit Breaks

A Limit Break is a signature ultimate maneuver. Performing a Limit Break is a **full-turn maneuver.**

Every character may **equip** a number of Limit Breaks based on the **tier of play**:

| Tier of Play          | Limit Break Slots |
| --------------------- | ----------------- |
| Novice (Ranks 3-8)    | 1                 |
| Seasoned (Ranks 9-14) | 2                 |
| Veteran (Ranks 15-20) | 3                 |
| Paragon (Ranks 21+)   | 4                 |

Limit Breaks come in two categories, with a uniform access rule:

- **General Limit Breaks** are gated by **core minimums** (e.g., BODY 2). Any character who meets the prerequisite may equip them.
- **Archetype Limit Breaks** (path, specialist, and ancestry alike) unlock when that archetype is **realized**. They carry no attribute or core prerequisites.

You may equip any Limit Break whose prerequisites you meet. A character who doesn't qualify for any Limit Breaks may simply hold an empty Limit Break slot until they qualify. Equipped Limit Breaks may be retrained during downtime, like masteries.

A Limit Break can be activated in one of two ways:

- A character can spend **3 Valor.** There is no additional Vigor cost.
- If a character is in **Crisis**, they can perform a Limit Break without spending Valor. There is no additional Vigor cost, but the character gains the **Exhausted** condition immediately after the Limit Break is resolved. This option can only be used **once per combat** (refreshes at the next Interlude).

Here is an example Limit Break:

```
[LIMIT BREAK] Inazuma Crash
Prerequisite: Warrior Realized

Effect: Double your SPD for this turn. Choose one equipped melee weapon. For every enemy that enters your weapon's melee range during your turn, make one Basic Attack against it; on 3 or more successes the enemy disregards the attack's normal effects and instead takes a Wound. Each enemy can only be struck once this turn in this manner.
```

### List of Limit Breaks

For a full list of Limit Breaks, refer to the separate document: `Mantle — Limit Breaks Catalog`.



## 11. Rest and Recovery

Mantle uses two rest periods: **interlude** (in between encounters within a mission) and **downtime** (in between missions).  There are no fixed durations for these periods, and the GM can narratively specify the duration as required by the story.

### Interlude

Any non-combat period within an active mission. The pause between encounters; the moment the party catches its breath.

During an interlude:

- Vigor and Guard get restored to their usual maximum. Any Over-Guard is lost.
- All Strain clears.
- **All combat-scoped conditions clear**, including Defeated and Lost.
- **Narrative-anchored conditions do NOT clear automatically.** Cursed and similar conditions persist until the narrative source is resolved (a quest completed, a relic destroyed) or a specific ability removes them. The GM may also rule that an otherwise combat-scoped condition persists for narrative reasons (e.g., a Defeated character fatally stabbed, or a Lost character runs off and abandons the party).

- Player characters can choose to spend 1 Resolve to fully restore their Vitality.

- Player characters can choose to spend their Resolve to heal Wounds or Burdens. The amount of Resolve it costs to heal each Wound or Burden is equal to the severity. Players can choose which Wounds or Burdens to clear.

> Note that disabled equipment can only be restored if the corresponding **Trauma Wound** is healed, and afflictions can only be removed if the corresponding Burdens are healed.
>
> Also, **Faltering** and **Unraveling** conditions are not cleared, but are paused. During interlude, the characters do not need to make Faltering and Unraveling checks. However, if another combat begins and the corresponding **Critical Wound** or **Breakdown** are not healed, then the character will start combat with Faltering 1 or Unraveling 1 respectively.

- Equip any gear or wondrous items, that the characters can find.
- Restock at least 1 consumable point (up to the character maximum, usually 2) and potentially more if the GM adjudicates so.

### Downtime

The mission-level rest, taken between missions, or voluntarily mid-mission if needed. Voluntary downtime spends at least **one beat** of the **mission clock** and **resets the party's Valor**.

During downtime:
- Vitality is fully restored.
- Strain is fully cleared.
- All Wounds and Burdens are healed, **except** those with a narrative reason to persist based on GM adjudication (e.g., cursed Wounds, magic-bound Burdens, maladies requiring a quest to clear).
- Resolve is restored to maximum.

- Valor for the party is reset to 0. (The party will be awarded **merit** if their Valor at the time of entering downtime, is high enough.)

- Player characters can bank their earned merits for character advancement.

- Player characters can retrain their mastery loadout.
- Players can perform other downtime activities as allowed by the GM.



## 12. Outside of Combat

### Narrative Rolls

Outside of combat (during interludes and downtime), the GM may ask players for **action rolls** or to **test their luck** in order to narratively resolve non-combat challenges. In these situations, the GM needs to determine the difficulty of the roll:

- **Routine Roll** - Carries some risk, but most characters can handle it without much trouble.
- **Tricky Roll** - Comes with a chance of failure, and while most characters can succeed, it often comes at a cost.
- **Daunting Roll** - Poses a higher risk of failure, with most characters likely facing some hardship in the process of completing the task.

And also choose which **attribute** the player will need to use for the roll, and adjudicate whether any **trained skills** are applicable (+2d bonus).

The players can choose to spend **Valor** for a **Heroic Feat** to influence the outcome of the roll.

| Successes | Routine Roll      | Tricky Roll       | Daunting Roll        |
| --------- | ----------------- | ----------------- | -------------------- |
| 0         | Success at a Cost | Failure           | Catastrophic Failure |
| 1         | Success           | Success at a Cost | Failure              |
| 2         | Success           | Success           | Success at a Cost    |
| 3         | Success           | Success           | Success              |

### Success with a Bonus

All characters will by default have the **Success with a Bonus** pattern that can be applied for every narrative action roll or luck roll.

```
[PATTERN] Success with a Bonus (Double)
Applies to: Non-combat narrative action rolls or luck rolls

Effect: If the result of the roll is "Success", then it turns into "Success with a Bonus" instead.
```

### Roll Outcomes

| Outcome              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| Catastrophic Failure | Besides failing at the task at hand, the character or party suffers an additional impactful setback as determined by the GM. |
| Failure              | The character fails to do whatever they set out to do.       |
| Success at a Cost    | The character succeeds, but with an added cost as determined by the GM. |
| Success              | The character succeeds at whatever they set out to do.       |
| Success with a Bonus | Not only does the character succeed, but they also receive an extra benefit or boon as determined by the GM. |

### Retrying Rolls

In many cases when you fail a roll, you can't attempt the roll again unless the circumstances of the roll change. The GM will determine when the circumstances have changed enough.



# ARC 2 — CREATING A CHARACTER



## 13. Character Creation Steps

### Determine Starting Rank

**Step 0** - The GM will decide what is the **starting rank** of the party. Most standard "Heroic" campaigns will start at **Rank 3**.

### Determine Cores and Attributes

**Step 1** - A starting Rank 3 character will have **4 attribute points** that can be freely distributed among the **three cores** of BODY/MIND/SOUL.

> **Example:** We will try to build Mira, the Half-Elf skirmisher. Since Mira is going to be a martial, we will allocate 3 attribute points to her BODY core, and 1 attribute point to her MIND core.
>
> So she will have BODY 3, MIND 1, and SOUL 0.

**Step 2** - For each core, further **allocate the attribute points** across the two attributes for that core. **No single attribute may exceed 3** at character creation.

> **Example:** Mira is going for the mobile warrior concept, so she allocates her attributes as follows:
>
> | Core   | Attribute | Attribute |
> | ------ | --------- | --------- |
> | BODY 3 | POW 0     | AGI 3     |
> | MIND 1 | REA 0     | INS 1     |
> | SOUL 0 | PRE 0     | LUCK 0    |

### Equilibrium Rule

A being's body, mind, and soul are bound to one another. Pull one too far ahead and the others must rise to anchor it.

Therefore, the equilibrium rule states that the difference between your **highest** and **lowest** core (BODY, MIND, SOUL) **cannot exceed 4**.

For example, a character can have BODY 6, MIND 2, SOUL 3. But they will not be able to have their BODY increased to 7 unless they increase their MIND to 3 first. And once they reach BODY 7, MIND 3, SOUL 3, they will not be able to increase their BODY to 8 unless they first increase both MIND and SOUL to 4 first.

### Determine Archetypes

**Step 3** - Every character must **choose an ancestry archetype**. Their ancestry archetype will take up at least one of their 3 starting ranks. The ancestry archetype will determine their SPD, SEN, and SIZE stats.

> **Example:** We choose the **Half-Elf** ancestry archetype for Mira, which suits her skirmisher concept. She has a SPD of 5, SEN of 10, and SIZE of 1M.

**Step 4** - For the remaining 2 starting ranks, the character can freely distribute them across any **path archetypes**. The 2 ranks can be invested into a single path archetype (rank 2), or split among two path archetypes (rank 1 each). Or, they can also be invested into further ranking up their ancestry archetype. Any combination is legal, as long as all of their starting archetype ranks add up to their starting rank of 3.

> **Example:** Mira wants to dedicate herself to martial combat, so she spends her 2 additional starting ranks into the **Warrior** path archetype.
>
> Mira's final archetypes: Half-Elf R1, Warrior R2

### Choose Masteries

**Step 5** - The character has a number of mastery slots that can be filled with masteries (special abilities, boons, or features). See below for the full rules on masteries.

> **Example:** Based on her Core values, she has the following number of mastery slots based on **mastery type** - 3 body mastery slots, 1 mind mastery slot, and 0 soul mastery slots. In addition, she has 1 wildcard mastery slot that can be used to slot masteries of any type. Total of 5 slots.
>
> Since she is a Half-Elf and a Warrior, she can pick her masteries from the following **mastery domains**: General, Human, Elf, Martial, Warrior
>
> She picks the following masteries:
>
> - Body mastery slots (3) - **Lightning Reflexes** (Body/General), **Combat Reflexes** (Body/Martial), **Bloodlust** (Body/Martial)
> - Mind mastery slots (1) - **Overwatch** (Mind/Warrior)
> - Wildcard mastery slot (1) - **Visualization** (Mind/Warrior)

### Choose Equipment

**Step 6** - The character can pick gear to fill out their 3 starting gear slots. The gear that they can choose is based on what their chosen archetypes provide access to.

> **Example:** For Mira's 3 gear slots, she will choose two weapons - a **Rapier** and a **Shortbow**, and a **Chain Shirt** armor for protection.

### Choose Narrative Skills

**Step 7** - The character can pick narrative skills that are granted by their chosen archetypes (both ancestry and path).

> **Example:** Mira's R1 in Half-Elf archetype grants her **4 narrative skills** from **any skill group**. Her R2 in Warrior archetype grants her an additional **2 narrative skills** from either the **Athletics or Subterfuge skill groups**.
>
> She picks the following narrative skills: **Climbing** (Athletics), **Stealth** (Subterfuge), **Tracking** (Fieldcraft), **Bestiary** (Knowledge), **Seduction** (Influence), **Navigation** (Fieldcraft).

### Finishing Touches

**Step 8** - Calculate all of your character's derived stats, including Max Vitality, Max Strain, Max Vigor, Max Guard, and so forth.

> **Example:** For Mira, here are her character stats:
>
> | Stat                           | Value                                  | Calculation                                                  |
> | ------------------------------ | -------------------------------------- | ------------------------------------------------------------ |
> | Max Vitality                   | 21                                     | (BODY + 3) x 3<br />+1 from R1 Half-Elf<br />+1 from R1 Warrior<br />+1 from R2 Warrior |
> | Max Strain                     | 5                                      | MIND + SOUL + 3<br />+1 from R1 Half-Elf                     |
> | Wound Slots                    | 3                                      | Default starting value                                       |
> | Burden Slots                   | 3                                      | Default starting value                                       |
> | Resolve                          | 6                                      | SOUL + 6                                                     |
> | Max Vigor                      | Max Vigor: 7<br />Regain (per turn): 4 | Max Vigor = default starting value of 7<br />Regain (per turn) = 3 + (BODY / 2) |
> | Max Guard                      | 4                                      | +2 from Chain Shirt<br />+1 from R1 Warrior<br />+1 from R2 Warrior |
> | SPD                            | 5                                      | From Half-Elf ancestry archetype                             |
> | SEN                            | 10                                     | From Half-Elf ancestry archetype                             |
> | SIZE                           | 1M (takes up 1 square)                 | From Half-Elf ancestry archetype                             |
> | Gear Slots                     | 3                                      | Default starting value                                       |
> | Wondrous Item Slots            | 0                                      | SOUL                                                         |
> | Consumable Points              | 2                                      | Default starting value                                       |
> | Languages Known (excl. Common) | 1                                      | REA + 1                                                      |



## 14. Archetypes

A character is a collection of archetypes, and your **character rank (CR) is the sum of all of your archetype ranks (R)**. Players that focus their character build on breadth (having ranks in many archetypes) will widen their options (more abilities, more mastery domain access), and players who focus on depth (taking an archetype to its maximum rank) unlock capstone abilities and the most powerful abilities.

Every archetype rank you hold is always considered active, no matter whether you only have one or two archetypes, or a bunch of them.

### Types of Archetypes

| Type | Examples | Description |
|---|---|---|
| **Ancestry Archetype** | Human, Dwarf, Half-Elf, Elf | This represents your species, which is chosen at character creation. A character can only have one ancestry archetype. Most ancestry archetypes are **capped at 3 ranks** (although exotic ancestries may have a higher cap). |
| **Basic Path Archetype** | Warrior, Scholar, Rogue, Barbarian, Channeler | These represent your basic starting professions and classes. They may have attribute prerequisites, but they will always be obtainable by a starting character. Basic path archetypes are always **capped at 3 ranks**. |
| **Specialist Path Archetype** | Magic Knight, Ninja | These are advanced archetypes with steeper prerequisites - usually requiring higher attribute minimums and one or more basic path archetypes **realized**. Specialist path archetypes may have a **cap of 3 or more ranks**. |

### Realizing an Archetype

An archetype at its **maximum rank** is considered as **realized**. Realizing an archetype unlocks its most powerful capstone abilities, and qualifies you to equip its Limit Breaks, as well as satisfy any specialist path archetypes that requires it as a prerequisite.

### List of Archetypes

For a full list of archetypes, refer to the separate document: `Mantle — Archetypes Catalog`.



## 15. Masteries

Masteries represent special abilities, boons, or other beneficial effects that characters can equip. They are organized across two dimensions:

- **Mastery type** - Either **body**, **mind**, or **soul**, corresponding to the three cores.
- **Mastery domain** - Access to masteries in different domains are granted by the character's archetypes.

Masteries are slotted into **mastery slots**. Mastery slots can only contain masteries of the corresponding type. Wildcard mastery slots can contain masteries of any type.

```
Body mastery slots = BODY
Mind mastery slots = MIND
Soul mastery slots = SOUL
Wildcard mastery slots = 1, +1 per full 5 character ranks
```

### Multi-slot Masteries

Most masteries take up 1 slot. Some particularly powerful masteries cost more than 1 slot. When a mastery costs more than 1 slot:

- The slot cost must be paid **entirely within a single type board** - e.g., all body, all mind, all soul, or all wildcard.
- The slot cost **cannot be split** across boards (e.g., a 2-slot body mastery cannot pay 1 body + 1 wildcard).

> **Design note:** This keeps multi-slot masteries as *concentrated* investments. Taking a powerful mastery means dedicating an unusual share of one board to it, not stitching small contributions together.

### Bonus Mastery Slots

Some archetype or equipment abilities grant you bonus mastery slots. These bonus slots will usually come with restrictions on what kind of masteries can be equipped.

### Mastery Sets

Masteries may belong to **mastery sets**. If a character has equipped **all of the masteries** in a mastery set, they will also gain additional benefits provided by that mastery set.

### Retraining Masteries

During **downtime**, players can rearrange their mastery loadouts freely. If required, the GM will work with the player on a narrative reason as to why the character's abilities have changed.

By default, **masteries in bonus mastery slots can also be retrained**, unless explicitly specified, and also as long as the restrictions from the bonus mastery slots are satisfied.

### List of Masteries

For a full list of masteries and mastery sets, refer to the separate document: `Mantle — Masteries Catalog`.



## 16. Narrative Skills

Narrative skills (or just skills) are mostly used out of combat during interludes and downtime, but some skills may also have in-combat uses as well. Skills are binary - you are either **trained** in a skill or you are not.

When performing an **action roll**, if the GM deems that a skill you are trained in is applicable, you get **+2d bonus to the roll**. For every action roll, you can at most apply one trained skill to the roll, and only apply the +2d bonus once.

The GM may decide that certain actions can only be attempted if you are trained in a certain skill (this could be overriden by the **Improviser** mastery).

Skills are organized into **skill groups**: Knowledge, Fieldcraft, Athletics, Artisanry, Subterfuge, and Influence.

### Knowledge

These are skills that represent academic understanding, and recalling and reasoning about facts and systems.

| Group     | Skill        | Description                                                  |
| --------- | ------------ | ------------------------------------------------------------ |
| Knowledge | History      | The record of past ages: dynasties, wars, migrations, and how the present world came to be. |
| Knowledge | Religion     | The gods and their faiths — doctrines, rites, holy orders, and the shape of the divine cosmos. |
| Knowledge | Magic Theory | The workings of magic itself: Resonances, Arts, enchantments, and why a spell behaves as it does. |
| Knowledge | Esoterica    | Hidden and forbidden lore — cults, curses, omens, spirits, and the truths most people are safer not knowing. |
| Knowledge | Bestiary     | The kinds, habits, and vulnerabilities of monsters and wild creatures: what a thing is and how it can be felled. |
| Knowledge | Nature       | The living world understood rather than survived: plants, animals, seasons, and how an ecosystem fits together. |
| Knowledge | Engineering  | How structures and mechanisms are designed, raised, and brought down — architecture, machinery, and siegecraft. |
| Knowledge | Politics     | Courts, laws, factions, and bloodlines, and a working sense of where real power actually rests. |

### Fieldcraft

These are skills that help a character live and operate in the wild.

| Group      | Skill           | Description                                                  |
| ---------- | --------------- | ------------------------------------------------------------ |
| Fieldcraft | Tracking        | Following trails and reading the signs creatures and people leave behind — prints, spoor, broken brush, cold ashes. |
| Fieldcraft | Foraging        | Taking sustenance and raw material from the land: edible plants, clean water, fishing, and snaring small game. |
| Fieldcraft | Bushcraft       | Making the wild livable — fire, shelter, improvised tools, and weathering hostile terrain and climate. |
| Fieldcraft | First Aid       | Mundane, hands-on treatment of injury: binding Wounds, stanching blood, setting bone, and stabilizing the badly hurt. |
| Fieldcraft | Herbalism       | Identifying and preparing wild plants for remedy — poultices, tonics, antidotes (the medicine kit, not the cookpot). |
| Fieldcraft | Animal Handling | Calming, training, directing, and earning the cooperation of living beasts. |
| Fieldcraft | Animal Mimicry  | Imitating animal calls and natural sounds to lure game, signal allies, or deceive a listener. |
| Fieldcraft | Navigation      | Keeping your bearings and finding your way by star, sun, landmark, and map — in wilderness or open water. |

### Athletics

These are skills that represent what a trained body can physically do.

| Group     | Skill      | Description                                                  |
| --------- | ---------- | ------------------------------------------------------------ |
| Athletics | Climbing   | Scaling walls, cliffs, ropes, and sheer or treacherous surfaces. |
| Athletics | Swimming   | Moving through water, diving, fighting currents, and holding breath under pressure. |
| Athletics | Endurance  | Raw stamina against sustained hardship: forced marches, long labor, sleeplessness, and bodily Strain. |
| Athletics | Acrobatics | Balance, tumbling, and contortion — keeping a footing on a ledge, rolling through a fall, slipping through a tight gap. |
| Athletics | Jumping    | Clearing distance and height: leaping chasms, vaulting obstacles, and springing to reach a far hold. |
| Athletics | Lifting    | Feats of raw strength: hauling, hoisting, forcing doors, and shifting what should not move. |
| Athletics | Riding     | Controlling a living mount at speed and staying seated through difficulty. |
| Athletics | Vehicles   | Driving and piloting built conveyances — wagons, chariots, boats — through hazard and at speed. |

### Artisanry

These are skills that involve the skilled making of goods.

| Group     | Skill        | Description                                                  |
| --------- | ------------ | ------------------------------------------------------------ |
| Artisanry | Smithing     | Working metal at the forge into weapons, armor, tools, and fittings. |
| Artisanry | Alchemy      | Brewing potions, tinctures, acids, and reagents through mundane chemistry. |
| Artisanry | Cooking      | Turning raw ingredients into nourishing or remarkable food and drink, fermenting and brewing included. |
| Artisanry | Tanning      | Curing hides and furs into leather goods.                    |
| Artisanry | Stonemasonry | Cutting, carving, dressing, and laying stone — masonry and sculpture alike. |
| Artisanry | Carpentry    | Working wood into structures, furniture, hafts, and frames.  |
| Artisanry | Lapidary     | Cutting, polishing, and setting gemstones, and judging the worth of a cut stone. |
| Artisanry | Tinkering    | Building and repairing small mechanisms and gadgets — clockwork, locks, and intricate contrivances. |
| Artisanry | Tailoring    | Making garments, rope, sailcloth, and other goods from cloth and fiber. |

### Subterfuge

These are skills that help the character act unseen, unheard, or unsuspected.

| Group      | Skill           | Description                                                  |
| ---------- | --------------- | ------------------------------------------------------------ |
| Subterfuge | Stealth         | Moving silently and keeping out of sight, shadow to shadow.  |
| Subterfuge | Sleight of Hand | Quick, deceptive handwork: picking pockets, palming, planting, and manual misdirection. |
| Subterfuge | Disguise        | Altering appearance, bearing, and voice to pass as someone — or something — you are not. |
| Subterfuge | Lockpicking     | Defeating the locks and mechanisms that secure doors, chests, and bindings. |
| Subterfuge | Traps           | Setting, spotting, and disarming traps, and rigging or wrecking mechanical devices. |
| Subterfuge | Forgery         | Faking documents, seals, signatures, and craftwork well enough to pass as genuine. |
| Subterfuge | Surveillance    | The tradecraft of watching and listening unnoticed: shadowing a mark, eavesdropping, reading lips. |
| Subterfuge | Poisons         | Preparing, concealing, and covertly administering toxins and venoms — and their antidotes. |
| Subterfuge | Streetwise      | Knowing how the underworld runs: fences, safe houses, gangs, contraband, and who to bribe. |
| Subterfuge | Escape Artist   | Slipping bonds, manacles, nets, and cells through contortion, dislocation, and concealed tools. |

### Influence

These are skills that move people through word, presence, or performance.

| Group     | Skill       | Description                                                  |
| --------- | ----------- | ------------------------------------------------------------ |
| Influence | Charm       | Winning warmth, liking, and goodwill through grace, wit, and easy likability. |
| Influence | Coercion    | Bending someone to your will through threat, menace, pressure, or sheer force of presence. |
| Influence | Guile       | Deceiving in the moment: lies, cons, false fronts, and verbal misdirection. |
| Influence | Read People | Sensing a person's mood, motive, and honesty from how they speak and carry themselves. |
| Influence | Seduction   | Drawing someone in through romantic or sexual allure.        |
| Influence | Performance | Holding an audience through music, acting, oratory, dance, or storytelling. |
| Influence | Etiquette   | Navigating manners, rank, and custom to move through formal society without misstep. |



## 17. Equipment

### Gear

All characters start out with **3 gear slots**. Additional gear slots may be granted by archetype abilities or masteries. Gear slots can be used to equip **weapons**, **armor**, or **spell foci** (for spellcasting archetypes that grant access to it). Characters can freely choose the combination of gear they want to equip, but they can only equip **one armor** at a time.

The kind of weapons, armor, or spell foci that a character can equip will be dependent on the archetypes that they have. By default, characters only have access to **Light weapons**, and **Standard armor**.

### Weapons

Weapons are gear that are used for attacking in combat. All weapons follow the following general template:

```
[WEAPON] Weapon Name (Tags)
Weight Class: Light / Medium / Heavy / Superheavy
Attribute: POW, AGI, POW/AGI, or others

Effect:
- 0s: damage effect
- 1s: damage effect
- 2s: damage effect
- 3+: damage effect
```

Example weapon:

```
[WEAPON] Mace (Crushing, Melee 1)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 7 damage
- 2s: 13 damage
- 3+: 20 damage
```

Weapons take up a **number of gear slots** depending on their **weight class**:

- **Light**, **Medium** and **Heavy** weapons - Takes **1 gear slot** to equip.
- **Superheavy** weapons - Takes **2 gear slots** to equip.

### Weapon Tags

| Tag | Description |
|---|---|
| Slashing | This weapon does slashing (i.e., cutting) physical damage. |
| Piercing | This weapon does piercing (i.e., pointed, impaling) physical damage. |
| Crushing | This weapon does crushing (i.e., bludgeoning, blunt) physical damage. |
| Melee N | This weapon can be used to do melee attacks, and has a reach of N squares. |
| Range N | This weapon can be used to do ranged attacks, and has a maximum range of N squares. |
| Deflect | This weapon can be used to perform the **Deflect** reaction. You can only deflect attacks if the **weight class** of the deflecting weapon is equal or greater than the attacking weapon's weight class. |
| Shield | This weapon is a shield and can be used to perform the **Deflect** reaction. There is no weight class restriction on the attacking weapon. |
| Reflexive | This weapon can be used to make a **Forestall** reaction. |
| Penetrating | This weapon **bypasses Guard** and hits Vitality directly. |
| Indefensible | This weapon cannot be mitigated by **reactive defenses**. |
| Imprecise | This weapon **cannot target hit locations**. It can only target Mass. This means that an Imprecise ranged weapon cannot be used to attack a target that is behind cover (Melee weapons are not affected by cover). |
| Seeking | This weapon is **not affected by cover**. |
| Cumbersome | Attacks with this weapon cost **3 Vigor** instead of 2. This includes reactive attacks like **Forestall**, **Intercept**, and **Counterattack**. |
| Combo | This weapon is part of a **combination weapon**, and it must be equipped with its other part(s). Together, the combination weapon costs **one fewer gear slot than the sum of its parts (minimum 1)**. |

### Multiple Damage Types

Some weapons may have their damage type tag listed as **X/Y**. This means that for every attack, the weapon may either be of damage type X or damage type Y, but never both at the same time. The choice is made by the attacker when the attack is being made.

Example: A magical rapier of fire may have its damage type listed as **Slashing/Piercing, Fire**. This means that for every attack, the attacker can decide whether the attack should be a Slashing attack or a Piercing attack. Regardless, the attack will always carry the Fire damage type.

### Combination Weapons

A combination weapon is two or more weapon parts that share the **Combo** tag and must be equipped together. Each part is a full weapon (with its own weight class, tags, attribute, and effect) and can be used to attack independently. The assembled combination weapon occupies **one fewer gear slot than the sum of its parts (minimum 1)**.

Example: A combination weapon (e.g., "Gun-Sword") consists of two medium parts, each of which will usually cost 1 gear slot by themselves. Together, a character can equip this combination weapon using only 1 gear slot. If a combination weapon (e.g., "Cannon-Sword") consists of a superheavy part (costs 2 slots) + a medium part (costs 1 slot), then the combination weapon can be equipped with only 2 gear slots.

The individual parts of a combination weapon can be disabled separately.

### Improvised Weapons

If the character wants to use an improvised weapon, the GM will assign a weapon profile that best matches the nature of the improvised weapon. However, attacking with the improvised weapon takes a **-1d penalty**, and the weapon will deal **half damage** (minimum 1). Every character can at most only have one improvised weapon at a time, but it does not take up any gear slots. **Superheavy weapons** profiles cannot be used for improvised weapons.

### Unarmed Attack

By default, all characters will have the **Unarmed Attack** weapon always equipped. This does not take up any gear slots.

```
[WEAPON] Unarmed Attack (Crushing, Melee 1)
Weight Class: Light
Attribute: POW/AGI

Effect:
- 0s: 1 damage
- 1s: 3 damage
- 2s: 6 damage
- 3+: 9 damage
```

### Armor

Armor is gear that is used for protection. All characters can only **equip at most one armor** at a time, no matter how many gear slots they have. All armor follows the following general template:

```
[ARMOR] Armor Name (Standard / Martial)

Effect: protection effect
Penalty: penalty, if any
```

Example armor:

```
[ARMOR] Chain Shirt (Martial)

Effect: +2 Guard
Penalty: none
```

All characters have access to Standard armor. Martial armor requires certain path archetypes (e.g., Warrior) to access.

### Spell Focus

Spellcasting archetypes (e.g., Scholar and Channeler) can use their gear slots to equip a **spell focus** (plural: spell foci). This represents a trinket or gadget that helps the spellcaster with casting spells. It can take the shape of a wand, staff, amulet, crystal, spell book, holy symbol, tattoo, etc. - the flavor can be player chosen, but they share the same mechanics.

There is no limit to the number of spell foci that a character can equip, as long as they have enough gear slots. The effects of all equipped spell foci apply simultaneously. However, a character can benefit from only one copy of any given type of spell focus.

If a spellcaster attempts to cast a spell without a spell focus equipped (e.g., if it is lost, disabled, stolen, or deliberately removed), the spellcasting roll takes a **-1d penalty**.

All spellcasting archetypes will receive a **basic spell focus** with no special abilities; it simply enables casting at full effectiveness.

### Wondrous Items

Wondrous items are unique, magical items that grant the wielder special abilities or bonuses. Wondrous items are unlike normal gear, and need to be equipped into a **wondrous item slot**. A character has a number of wondrous item slots equal to their SOUL value.

### Consumables

Consumables are **single-use items** that can be used for healing, buffing, de-buffing, or even attacking. It is assumed that adventurers are generally well prepared and always in possession of a good mix of consumables for most situations. In Mantle, we do not track individual consumables, but instead use **consumable points**.

To use a consumable, a character will mark off a consumable point, and they can apply the effect of any of the consumables that are on the common consumables catalog. It is assumed that adventurers will have access to all of the common consumables.

As the characters go on adventures, they may discover and gain access to special and rare consumables that they can use.

### Other Equipment

Standard adventuring gear is not tracked on the character sheet. It is assumed that every character has reasonable access to any piece of mundane adventuring gear, and thus it doesn't have to be accounted for on the character's stat block.

Similarly, players who receive McGuffins, maps, or other plot-specific items are assumed to just be carrying them without needing to be accounted for on the character's stat block.

### List of Equipment

For a full list of equipment, refer to the separate document: `Mantle — Equipment Catalog`.



## 18. Languages

All characters are assumed to know **Common**, which represents the prevalent language that almost everyone speaks in the world. In addition, a character may know **one or more additional languages** depending on their REA value.

Special languages could also be granted from archetypes or masteries. These special languages do not count towards the number of additional languages known.

Action rolls that require clear language understanding may suffer a penalty if the GM adjudicates that there is some kind of language barrier in place.

| Barrier                                            | Penalty                        |
| -------------------------------------------------- | ------------------------------ |
| Partial barrier                                    | -1d                            |
| Full barrier                                       | -2d                            |
| Language-bound task without any language knowledge | GM may rule task as impossible |



## 19. Character Advancement

Characters earn **merits** throughout their adventures by completing missions and objectives. Merits can be **banked during downtime** to exchange for a **new character rank**. When a character receives a new character rank, they can deploy the rank onto one of their existing archetypes to improve it, or spend the rank to acquire R1 on a new archetype.

As character ranks increase, attributes, mastery slots, and Vigor will also increase:

- **Attribute increase** - At **every even rank from character rank 4**, the character can choose to gain **+1 to an attribute** of their choice. This will also raise the core value, increase the number of mastery slots, as well as update any stats that are derived from the attribute/core increase. This can cause an individual attribute to exceed the limit of 3 during character creation, but the equilibrium rule needs to be applied here.
- **Wildcard slots** - At **each multiple of 5 character ranks**, gain **+1 wildcard mastery slot**.
- **Bonus Vigor** - Starting from character rank 7, and for each multiple of 7 character ranks, gain **+1 Vigor cap**.

This table summarizes all the different advancements at each character rank. Bolded cells mark "new at this rank."

| Character Rank (CR) | Tier of Play | Attribute +1      | Wildcard slots | Vigor cap     |
| ------------------- | ------------ | ----------------- | -------------- | ------------- |
| 3                   | Novice       |                   | 1              | 7             |
| 4                   | Novice       | ✓                 | 1              | 7             |
| 5                   | Novice       |                   | **2**          | 7             |
| 6                   | Novice       | ✓                 | 2              | 7             |
| 7                   | Novice       |                   | 2              | **8**         |
| 8                   | Novice       | ✓                 | 2              | 8             |
| 9                   | **Seasoned** |                   | 2              | 8             |
| 10                  | Seasoned     | ✓                 | **3**          | 8             |
| 11                  | Seasoned     |                   | 3              | 8             |
| 12                  | Seasoned     | ✓                 | 3              | 8             |
| 13                  | Seasoned     |                   | 3              | 8             |
| 14                  | Seasoned     | ✓                 | 3              | **9**         |
| 15                  | **Veteran**  |                   | **4**          | 9             |
| 16                  | Veteran      | ✓                 | 4              | 9             |
| 17                  | Veteran      |                   | 4              | 9             |
| 18                  | Veteran      | ✓                 | 4              | 9             |
| 19                  | Veteran      |                   | 4              | 9             |
| 20                  | Veteran      | ✓                 | **5**          | 9             |
| 21                  | **Paragon**  |                   | 5              | **10**        |
| 22+                 | Paragon      | +1 every other CR | +1 every 5 CR  | +1 every 7 CR |



# ARC 3 — RUNNING THE GAME



## 20. Campaign Structure

Mantle is a **mission-structured** game. A campaign proceeds as a series of missions, with each mission involving a handful of combats and narrative scenes. Characters advance by completing **mission objectives**, not by solely defeating enemies.

### Mission Arcs, Objectives, and Clock

The GM frames each mission as a **mission arc** - a set of objectives the party may pursue, with full agency over **which** they take on and **in what order**. Every mission arc has:

- One or more **main mission objective** - This is the spine of the mission, and usually directly references and advances the campaign plotline.
- A number of optional **side mission objectives** - These are optional objectives that can be pursued by the players, but is not critical for the mission's success.
- An optional **mission clock**, measured in **beats** - A beat is an abstract unit of mission progress, and is not intended to represent a fixed duration of time, like a calendar day. The clock indicates the total number of beats available before the situation turns for the worse.
- A **minimum beat cost** per objective - If the mission clock is in play, then pursuing each objective will cost a certain number of beats as determined by the GM (minimum 1).
- A **merit** reward per objective, paid on completion.

> **Example:** The party members arrive at Grimland, and meet with the king, who told them that the princess was kidnapped and brought to the cave in the north. At the same time, the city has been suffering from famine due to a mysterious creature that has been destroying their crops. With this premise, the GM sets up the mission arc as follows:
>
> Mission Arc: Grimland
>
> - Objectives:
>   - [Main] Rescue the princess (2 beats, +3 merits)
>   - [Side] Help find food for the city (1 beat, +1 merit)
>   - [Side] Find out what has been destroying the city's crops (1 beat, +1 merit)
> - Clock: 6 beats

### Spending the Mission Clock

- Pursuing objectives (both main and side) spends beats. Every objective will have a beat cost.
- Voluntarily taking **downtime** also costs **one beat**.

**Running out the clock results in degraded outcomes, not failure.** An exhausted mission clock does not erase the objectives; it *worsens* them. Any objective completed **after** the clock runs out only pays **half its merit reward**, and the GM narrates the consequence or cost. The clock provides players with urgency, but it is not a game-over timer. A mission arc with no mission clock simply applies no time pressure; the push-on tension then rests on the combat economy alone.

> **Design note:** The clock is a budget that the party manages. Parties can decide if they want to attempt everything and risk running short of clock, or focus on only what matters and bank it safely.

### Encounter Objectives

Combat encounters are a key part of gameplay. Every encounter will have:

- A **main encounter objective** - This is the key set of conditions that must occur for the players to complete the encounter successfully. Encounter objectives may include defeating all enemies, but it doesn't always have to be. Completing a main encounter objective may be required for a **mission objective** to be achieved.
- A number of optional **side encounter objectives** - These are also known as *encounter challenges*. Achieving encounter challenges help the party gain Valor.

### Campaign Difficulty

There are three default **campaign difficulty levels** in Mantle - The GM can choose which difficulty level to use for their campaign. Most games are on the standard "Heroic" difficulty level. Difficulty levels will impact starting rank, rate of advancement, and encounter building guidelines.

| Campaign Difficulty | Feel   | Starting Character Rank (CR) | Rate of Advancement |
| ------------------- | ------ | ---------------------------- | ------------------- |
| "Cinematic"         | Easy   | 5                            | 4 merits / rank     |
| "Heroic"            | Medium | 3                            | 5 merits / rank     |
| "Ultra"             | Hard   | 3                            | 7 merits / rank     |

> **Design note:** In Mantle, the default difficulty level is "Heroic", and all of the balance, encounter building, and adventure pacing are based on that. As a general pacing guide, at "Heroic" difficulty level, a party should clear roughly **one tier of play (six character ranks) for every four missions**, or about 1.5 character ranks per mission.

### Merits

**Merits** are Mantle's coarse, event-based advancement currency, awarded on **objective completion**. Merits accumulate across the entire mission, and are converted to ranks for character advancement.

| Ways to earn merits                                          | Amount     |
| ------------------------------------------------------------ | ---------- |
| Achieving a main mission objective                           | 2-3 merits |
| Achieving a side mission objective                           | 1 merit    |
| Entering downtime with Valor greater or equal to half the party's Valor cap (minimum 1) | 1 merit    |
| Discretionary reward for extraordinary play (GM discretion)  | 1 merit    |

Merits can be banked for character advancement during **Downtime**. The number of merits needed to add one rank is based on the campaign's difficulty level. For a standard "Heroic" campaign, it takes 5 merits / rank.

### Tiers of Play

Mantle organizes 18 ranks of play (CR3 to CR20) plus open-ended Paragon play (CR21+) into four tiers of play:

| Tier of Play | Character Ranks | Party Identity                                               | Typical Attack Pool |
| ------------ | --------------- | ------------------------------------------------------------ | ------------------- |
| Novice       | CR3 to CR8      | Adventuring rookies. Distinct archetype identities; modest combat tools. | 3-5 dice            |
| Seasoned     | CR9 to CR14     | Veterans of multiple campaigns. Builds matured; signature combos online. | 5-6 dice            |
| Veteran      | CR15 to CR20    | Renowned heroes. Multi-archetype mastery; legendary-tier challenges. | 6-7 dice            |
| Paragon      | CR21+           | Mythic figures. Open-ended progression; the system's high-end stress test. | 7+ dice             |

> **Design note:** The **typical attack pool** is design guidance targeted for each tier; it is not a specific rule or constraint for character builds.



## 21. Encounter Building

In Mantle, combat encounters are won by **completing their objectives**, and not by killing everything on the map. Sometimes the objective *is* to "defeat them all," but the moment it's anything else (e.g., protect the cart, hold the door, reach the ritual before it finishes, etc.), the fight changes shape, because the party can no longer solve it by focusing fire on one enemy at a time. Encounter difficulty in Mantle is an **attention economy**: rosters set the price, but objectives decide how the party is allowed to pay. Losing doesn't mean a TPK, but it usually means the objective died while the heroes lived, and they have to accept the consequences of the failure to the overall mission, as well as their Valor.

### "The Encounter Card"

Build out every encounter by filling out five lines:

| Line                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| **Difficulty**      | Trivial / Standard / Challenging / Boss                      |
| **Roster**          | Composition and setup of enemies (including anchors and fillers), and at which challenge classes |
| **Behavior**        | One line per enemy group describing how they behave and fight in the combat |
| **Main Objective**  | What "winning" means, and how durable / urgent that thing is |
| **Side Objectives** | 0 or more secondary objectives (i.e., encounter challenges) for the players to try and accomplish throughout the course of combat; these challenges may not necessarily impact the main objective, but achieving them could provide allies a narrative advantage or benefit somewhere down the line |

### Encounter Difficulty

| Difficulty      | Main Objective Success | Average Rounds | Expected Party Cost  | Downed Ally |
| --------------- | ---------------------- | -------------- | -------------------- | ----------- |
| **Trivial**     | ~100% chance           | 2–3            | ≤1 Wound             | rare        |
| **Standard**    | ~85% chance            | 3–5            | ≤2 Wounds + Burdens  | ~20% chance |
| **Challenging** | ~65% chance            | 4–6            | 2–3 Wounds + Burdens | ~30% chance |
| **Boss**        | per design             | 5–7            | 3–5 Wounds + Burdens | >50% chance |

### The Four Dials

1. **Composition** - Anchor + filler. The anchor (Elite or above) creates spike damage and the loss tail; filler creates tempo and attrition. Starting enemy rosters for a party of four Novices:

| Difficulty      | Roster                                                      |
| --------------- | ----------------------------------------------------------- |
| **Trivial**     | 2–3 Regulars, or 1–2 Grunt squads (4 Grunts per squad)      |
| **Standard**    | 1 Elite + 2–3 Regulars, or 4-5 Regulars                     |
| **Challenging** | 1 Elite + 4–5 Regulars, or 1 Champion + 2-3 Regulars        |
| **Boss**        | 1 Champion or Nemesis + support, with an authored objective |

> **Design note:** Defeating enemies only grants Valor at Elite and above. For combats with all Regulars and Grunts, consider adding side objectives to give the party opportunities to earn Valor.

2. **Behavior** - Identical rosters may vary up to 6x in number of Wounds dealt depending on how the enemies target. *Spread targeting* ("harries whoever is closest") is merciful; *focus targeting* ("finishes whoever is bleeding") is cruel. Write the Behavior line deliberately. It is a difficulty dial, not flavor. Every enemy stat block comes with a default behavior, but feel free to override freely. Multi-turn enemies (Champion and above) that focus every turn on one character are the deadliest version of this dial; use with intent.

3. **Objective Shape** - "Kill" objectives collapse under focus fire; tension comes from objectives that **forbid focus**; i.e., protect something a filler enemy is attacking, holding two points on the map, extraction under pressure, etc. Split attention is a good way to make an otherwise Standard encounter into a Challenging one.

4. **Objective Durability** - For protection objectives, give the protected thing roughly **7–8 Vitality per filler enemy** that will attack it. Less makes the fight desperate; more makes it safer.

### Reskinning Enemies

Feel free to reskin any enemy in the pre-generated enemy catalog. To turn the **Bandit Thug** into a **Dockside Bruiser**: rename it, change Cudgel to *Boathook (Piercing, Melee 1)* with the same damage ladder, and give its Behavior line an update ("drags victims toward the water"). Same math, new enemy, thirty seconds. To make it scarier, apply a challenge class template; to make it *specific*, add one signature maneuver and one hit-location row. Numbers are calibrated; fiction is free.

### Example Encounters

| ENCOUNTER       | THE TOLL ROAD                                                |
| --------------- | ------------------------------------------------------------ |
| Difficulty      | Standard                                                     |
| Roster          | 1x Bandit Captain (Elite)<br />2x Bandit Thugs (Regular)     |
| Behavior        | Captain duels the strongest PC and telegraphs his Swing; Thugs (sharpened by his Commander aura) focus whoever is already bleeding. |
| Main Objective  | Defeat them all - the road must be opened!                   |
| Side Objectives | -                                                            |

> ⚖ *Sim-stamped:* with 3 Thugs this measures ~4.7 rounds, ~2.6 Wounds, a PC down in half of all fights — the Challenging variant. Two Thugs is the Standard evening.

| ENCOUNTER       | THE RELIQUARY CART                                           |
| --------------- | ------------------------------------------------------------ |
| Difficulty      | Challenging                                                  |
| Roster          | 1x Bandit Captain (Elite)<br />5x Bandit Thugs (Regular)     |
| Behavior        | The Thugs ignore the party and hack at the cart; the Captain pins the rescuers, focusing on the wounded. |
| Main Objective  | The reliquary cart (**Vitality 40**) must survive. If it reaches 0 Vitality, the fight may continue, but the objective is lost. |
| Side Objectives | Challenge 1 - The party defeats all of the bandits<br />Challenge 2 - The reliquary cart manages to emerge combat unscathed (without damage) |

> ⚖ *Sim-stamped:* ~75% objective success, ~5.8 rounds, ~2.3 Wounds, a PC down in 38% of fights. Drop the cart to 35 Vitality for a crueler night (~63%).

### List of Enemies

For a full list of pre-generated enemies, refer to the separate document: `Mantle — Pre-Generated Enemies`. Additional rules on running enemies are also there.