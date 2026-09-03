# Momenta — Archetypes Catalog

**Version:** 0.31

Momenta is a tactical, cinematic fantasy TTRPG built around modular archetypes and slottable masteries. This catalog contains the archetype stat blocks. It is intended to be used with the `Momenta - Quick Start Guide` document, which contains the core rules of Momenta.

All of the catalog examples are a *sample of the design space*, and not to be considered an exhaustive list.



## Ancestry Archetypes



### Human

| SIZE | SPD  | SEN  | Mastery Domains |
| ---- | ---- | ---- | --------------- |
| 1M   | 5    | 10   | General, Human  |

> **RANK 1**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities:**
>   - **Versatile** - Gain an additional **1 wildcard mastery slot**.
>   - **Human Experience** - Gain **one additional Thread**.

> **RANK 2**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities**:
>   - **Mental Resilience** - When you take the **Steady Yourself** maneuver, you can spend 1 Resolve to **clear one Burden**.

> **RANK 3**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities**:
>   - **Last Stand** - While you are in **Crisis**, you gain **+1d bonus** on all attacks and reactive defense rolls.



### Half-Elf

| SIZE | SPD  | SEN  | Mastery Domains     |
| ---- | ---- | ---- | ------------------- |
| 1M   | 5    | 10   | General, Human, Elf |

> **RANK 1**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities:**
>   - **Low-Light Vision**

> **RANK 2**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities**:
>   - **Elven Memories** - Whenever a situation calls for having knowledge about a subject matter, you can spend **1 Strain** to upgrade your knowledge level by one step - from **Unfamiliar to Familiar**, or from **Familiar to Expert**. Only 1 Strain can be spent in this manner for each situation, and it only lasts for the duration of the current situation.

> **RANK 3**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Strain
> - **Abilities**:
>   - **Cultural Fluency** - Gain a **+1d bonus** for all action rolls that involve performance, influence, intimidation, or persuasion as long as it either involves Humans, Elves, or Half-Elves (GM adjudicates).
>   - **Adaptability** - During an Interlude, you may **retrain one equipped mastery** for another mastery that you qualify for.



### Elf

| SIZE | SPD  | SEN  | Mastery Domains |
| ---- | ---- | ---- | --------------- |
| 1M   | 6    | 15   | General, Elf    |

> **RANK 1**
>
> - **Bonuses:** +2 Max Strain
> - **Abilities:**
>   - **Low-Light Vision**
>   - **Elven Memories** - Whenever a situation calls for having knowledge about a subject matter, you can spend **1 Strain** to upgrade your knowledge level by one step - from **Unfamiliar to Familiar**, or from **Familiar to Expert**. Only 1 Strain can be spent in this manner for each situation, and it only lasts for the duration of the current situation.

> **RANK 2**
>
> - **Bonuses:** +2 Max Strain
> - **Abilities**:
>   - **Dauntless Mind** - You cannot gain the **Frightened** condition.

> **RANK 3**
>
> - **Bonuses:** +2 Max Strain
> - **Abilities**:
>   - **Magic Initiate** - You gain access to the **Magic mastery domain**.
>   - **Innate Spellcasting** - You may **cast spells**, using **PRE as your casting attribute**. You gain **1 bonus mastery slot** that has to be filled with a **Resonance mastery** (this mastery slot cannot be retrained once the Resonance is taken). You may not take additional Resonances unless you have a path archetype that grants spellcasting. You **don't gain any Arts** for free; to actually cast a spell you must acquire at least one Art using your mastery slots. You also **don't gain access to spell foci**, so your spells will always suffer the **-1d penalty** for not having a spell focus equipped (this can be mitigated with the **Inner Focus** mastery).



### Dwarf

| SIZE | SPD  | SEN  | Mastery Domains |
| ---- | ---- | ---- | --------------- |
| 1M   | 4    | 12   | General, Dwarf  |

> **RANK 1**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities:**
>   - **Darkvision**

> **RANK 2**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities**:
>   - **Tremorsense** - You can sense the location of all creatures touching the ground within (SEN / 2) squares of you, regardless of environmental lighting or cover. Sensed creatures are considered as **visible** to you for targeting purposes. Flying or otherwise not grounded creatures are unaffected.

> **RANK 3**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities**:
>   - **Stone Will** - When you would gain the **Broken** condition from any source other than your own **Brace** reaction, you may **test your luck**. On **1+ success**, you do not gain the Broken condition.



## Basic Path Archetypes



### Barbarian

| Prerequisites | Mastery Domains    |
| ------------- | ------------------ |
| POW 2         | Martial, Barbarian |

> **RANK 1**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities:**
>   - **Martial Training** - You may equip **Medium**, **Heavy**, and **Superheavy** weapons, and **Martial** armor.
>   - **Enter Frenzy** - You have access to the **Enter Frenzy** maneuver to gain the **Frenzy** condition. Your maximum number of Frenzy stacks cannot exceed 1 (this limit can be increased with the **Berserk** mastery).

```
[MANEUVER] Enter Frenzy (Vigor 1, 1/turn)

Effect: Gain 1 stack of the Frenzy condition.
```

```
[CONDITION] Frenzy
Stackable: yes (max 3)
Clear Type: Persistent

Effect: The character is in a state of mounting battle-rage. While Frenzied...
- You gain +1d bonus per stack on all melee weapon attacks. This also applies to reactive attacks.
- You gain a +1 to your SPD.
- You cannot Brace, or use any reactive defenses.
- At the end of your turn, you take Strain equal to your current number of Frenzy stacks.

The Frenzy condition is cleared when you take the Steady Yourself maneuver.
```

> **RANK 2**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities:**
>   - **Relentless** - Your melee weapon attacks deal +2 damage for every stack of Frenzy.
>   - **Adrenaline** - While Frenzied, you can perform the **Surge** maneuver using BODY instead of MIND. All other rules for Surge remain the same, including taking 2 Strain for each point of Vigor gained. A character with BODY 0 cannot Surge using Adrenaline.

> **RANK 3**
>
> - **Bonuses:** +2 Max Vitality
> - **Abilities:**
>   - **Indomitable** - While Frenzied, you can choose to auto-clear one stack of the **Exhausted**, **Hindered**, or **Slowed** conditions at the end of your turn, instead of rolling to clear.
>   - **Dauntless Frenzy** -  You cannot gain the **Frightened** condition while Frenzied.



### Warrior

| Prerequisites | Mastery Domains  |
| ------------- | ---------------- |
| BODY 2        | Martial, Warrior |

> **RANK 1**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Guard
> - **Abilities:**
>   - **Martial Training** - You may equip **Medium**, **Heavy**, and **Superheavy** weapons, and **Martial** armor.
>   - **Deflect** - You have access to the **Deflect** reactive defense.

> **RANK 2**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Guard
> - **Abilities:**
>   - **Counterattack** - You have access to the **Counterattack** reactive attack.
>   - **Focused Strike** - When you make a Basic Attack with a weapon, you can spend **+2 Vigor** to roll with a **+2d bonus**.

> **RANK 3**
>
> - **Bonuses:** +1 Max Vitality, +1 Max Guard
> - **Abilities:**
>   - **Veteran's Edge** - When you take the Brace reaction, you may pay **+1 Vigor** to gain **Impaired 1** instead of becoming Broken. You can do this as many times as you want as long as you have the Vigor to pay for it.
>   - **Endless Endurance** - When you spend your Resolve to heal a Wound or Burden, reduce its cost by 1 (minimum 1).



### Scholar

| Prerequisites | Mastery Domains |
| ------------- | --------------- |
| REA 2         | Magic, Scholar  |

> **RANK 1**
>
> - **Bonuses:** +1 Max Strain
> - **Abilities:**
>   - **Spellcasting** - You may perform the **Cast a Spell** maneuver, and use REA as the spellcasting attribute.
>   - **Starting Repertoire** - You get **3 bonus mastery slots** that must be filled with **Resonances** and **Arts**. You must have at least 1 Resonance and 1 Art in those 3 slots.
>   - **Spell Focus** - You may use your gear slots to equip spell focus. Attempting to cast a spell without a spell focus equipped will incur a **-1d penalty** on the spellcasting roll.

> **RANK 2**
>
> - **Bonuses:** +1 Max Strain
> - **Abilities:**
>   - **Detect Magic** - You have access to the **Detect Magic** maneuver.
>   - **Push the Craft** - When you cast a spell, you may take up to MIND Strain. For each Strain taken, the cast gains +1d bonus. This has to be declared *before* rolling.
>   - **Magic Study** - Gain **1 additional bonus mastery slot** that must be filled with **Resonances** and **Arts**.

```
[MANEUVER] Detect Magic (Vigor 2)

Effect: Make a REA action roll to sense magic within SEN squares.
- 0s: Sense the presence of magic, if any exists within range.
- 1s: Sense the Resonance and Art of detected magic, but ONLY for Resonances and Arts you yourself know.
- 2+: Sense the Resonance and Art of any detected magic.
```

> **RANK 3**
>
> - **Bonuses:** +1 Max Strain
> - **Abilities:**
>   - **Long Casting** - When casting a spell, you may spread the Vigor cost of the spell across two turns: half on the current turn, and half at the start of your next turn (if the Vigor cost is odd, the one extra Vigor is spent on this turn). The spell resolves with its spellcasting roll on the second turn when the full Vigor cost is paid. During the holding period, you cannot take reactions (your concentration is locked on the casting), but you may take maneuvers if you have enough Vigor. If for some reason the full Vigor cost cannot be paid, or if you cannot take maneuvers at the start of the second turn, the spell fizzles out, and the Vigor spent in the previous turn is wasted.
>   - **Magic Expertise** - Gain **1 additional bonus mastery slot** that must be filled with **Resonances** and **Arts**.



### Channeler

| Prerequisites | Mastery Domains  |
| ------------- | ---------------- |
| INS 2         | Magic, Channeler |

> **RANK 1**
>
> - **Bonuses:** +1 Resolve
> - **Abilities:**
>   - **Spellcasting** - You may perform the **Cast a Spell** maneuver, and use INS as the spellcasting attribute.
>   - **Starting Repertoire** - You get **3 bonus mastery slots** that must be filled with **Resonances** and **Arts**. You must have at least 1 Resonance and 1 Art in those 3 slots.
>   - **Spell Focus** - You may use your gear slots to equip spell focus. Attempting to cast a spell without a spell focus equipped will incur a **-1d penalty** on the spellcasting roll.

> **RANK 2**
>
> - **Bonuses:** +1 Resolve
> - **Abilities:**
>   - **Patron's Aura** - You project an aura of divine protection covering all squares within 5 squares of you. You also have access to the **Helping Hand** reaction.
>   - **Patron's Will** - When you cast a spell, you may **bypass the spellcasting roll** entirely and declare a number of successes by paying Strain. **Every success costs 2 Strain**. Since there was no roll, no bonuses and penalty modifiers apply, and no patterns apply. Patron's Will must be used before the roll is made, and the caster must declare how many successes they want to pay for before resolving any opposed rolls.

```
[REACTION] Helping Hand (variable cost)
Trigger: An ally within your Patron's Aura is targeted by an attack.

Effect: You can cast a Mend Art spell on that ally immediately. The spell resolves before the triggering attack's damage applies. You must be able to pay the Vigor cost of the spell, including the necessary Range Shaping upgrades to reach the ally with your spell.
```

> **RANK 3**
>
> - **Bonuses:** +1 Resolve
> - **Abilities:**
>   - **Patron's Aegis** - When you would take a Wound from incoming damage, you may **spend 1 Resolve** to **prevent the Wound** entirely. The damage is absorbed by your patron's intervention. All of the other damage rules apply; your Vitality is restored to full as if a Wound was inflicted, even if no Wound was actually inflicted. This ability can only be used once per combat encounter.
>   - **Patron's Gift** - Patron's Will has a reduced cost: 1 success costs 1 Strain; 2 successes costs 2 Strain; beyond that, every extra success costs 2 Strain as per normal.



## Specialist Path Archetypes

