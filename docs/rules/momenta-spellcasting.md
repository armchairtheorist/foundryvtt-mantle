# Momenta — Spellcasting Catalog

**Version:** 0.31

Momenta is a tactical, cinematic fantasy TTRPG built around modular archetypes and slottable masteries. This catalog contains the Art and Resonance stat blocks. It is intended to be used with the `Momenta - Quick Start Guide` document, which contains the core rules of Momenta.

All of the catalog examples are a *sample of the design space*, and not to be considered an exhaustive list.



## Arts

An Art stat block declares the *structure* of casting it — the cost, the default shape, what dimensions can be shaped, and the band ladder for effect resolution. It does NOT carry damage types, conditions, or defense classifications — those come from the Resonance.

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

**The Art list is closed; Resonances are the open surface.** The Arts above are the load-bearing frame of the magic system — the shaping economy, the type table, and the tag grammar all hang off them, so modifying an Art cascades through everything. Resonances, by contrast, are structurally inert to add: invent freely, price access at 1 mastery slot (2 for rare and powerful ones), and ship each new Resonance with its access mastery.

The standard Art template:

```
[ART] Art Name (Type)
Base Cost: X Vigor
Basic Shape:
- Range: X (Shapeable / Fixed)
- Duration: X (Shapeable / Fixed)
- Area: X (Shapeable / Fixed)

Description: [evocative line(s) on the Art's fiction]

Effect:
- 0s: effect. Caster takes Strain from grazing.
- 1s: effect.
- 2s: effect.
- 3+: effect.
- OF: Overflow - any additional effects per additional success above 3.

[any Art-specific universal mechanics]
```



### Rend

```
[ART] Rend (Attack)
Base Cost: 2 Vigor
Basic Shape:
- Range: SEN (Shapeable)
- Duration: instantaneous (Fixed)
- Area: single target (Shapeable)

Description: Channels the raw power of the applied Resonance into direct harm against a foe. The bolt, lash, or jet of damage - instantaneous and singular.

Rend has two effect ladders - one for Vitality and one for Strain. The Resonance's Rend entry will specify which ladder applies.

Effect (Vitality):
- 0s: 2 damage. Caster takes Strain from grazing.
- 1s: 5 damage.
- 2s: 10 damage + 1 stack of [Resonance-defined condition].
- 3+: 16 damage + 3 stacks of [Resonance-defined condition].
- OF: +6 damage / success

Effect (Strain):
- 0s: 1 Strain. Caster takes Strain from grazing.
- 1s: 2 Strain.
- 2s: 3 Strain + 1 stack of [Resonance-defined condition].
- 3+: 5 Strain + 3 stacks of [Resonance-defined condition].
- OF: +2 Strain / success

If the [Resonance-defined condition] is non-stackable, the condition will just be applied at 2 and 3+ successes.

Default attack tags: "Melee 1" when delivered at Touch, otherwise "Range N" (N = spell range); "Imprecise" + "Seeking" if area effect.
```



### Afflict

```
[ART] Afflict (Attack)
Base Cost: 2 Vigor
Basic Shape:
- Range: Touch (Shapeable)
- Duration: 1 round (Shapeable)
- Area: single target (Shapeable)

Description: Channels the Resonance into a curse that takes root in the target. The affliction is the point, direct harm is incidental.

Effect:
- 0s: 1 damage. Caster takes Strain from grazing.
- 1s: 1 stack of [Resonance-defined condition].
- 2s: 2 stacks of [Resonance-defined condition].
- 3+: 3 stacks of [Resonance-defined condition].
- OF: +2 damage / success

While an Afflict spell is still active on the target, if the condition inflicted on a target is reduced (either through auto-clear or roll-to-clear) - for each stack removed, the caster may take 1 Strain to restore it.

If the [Resonance-defined condition] is non-stackable, the condition will just be applied at 1+ successes.

Afflict ends immediately if the caster is Defeated.

Default attack tags: "Melee 1" when delivered at Touch, otherwise "Range N" (N = spell range); "Imprecise" + "Seeking" if area effect.
```



### Bolster

```
[ART] Bolster (Utility)
Base Cost: 2 Vigor
Basic Shape:
- Range: Self (Shapeable)
- Duration: 1 round (Shapeable)
- Area: single target (Shapeable)

Description: Channels the Resonance to grant the target a transient boon - protection, power, Vigor, or insight - shaped by the Resonance that powers it.

Effect:
- 0s: Apply the [Resonance-defined bolster effect] for 1 round only,
      regardless of the duration shape. Caster takes Strain from grazing.
- 1s: Apply the [Resonance-defined bolster effect] for the duration.
- 2s: Apply the [Resonance-defined bolster effect],
      and target gains +1d to all [Resonance-defined qualifying rolls] for the duration.
- 3+: Apply the [Resonance-defined bolster effect],
      and target gains +2d to all [Resonance-defined qualifying rolls] for the duration.
- OF: +2 Guard / success.

Bolster ends immediately if the caster is Defeated.
```



### Mend

```
[ART] Mend (Restoration)
Base Cost: 2 Vigor
Basic Shape:
- Range: Touch (Shapeable)
- Duration: instantaneous (Fixed)
- Area: single target (Shapeable)

Description: Channels the Resonance to restore - knitting Wounds, unspooling stress, releasing accumulated harm. The mage's hands carry the Resonance into the target's body or mind, undoing damage the Resonance's nature can undo.

Mend has two effect ladders - one for Vitality and one for Strain. The Resonance's Mend entry will specify which ladder applies. Some Resonances support only one ladder, and some may support both.

Effect (Vitality):
- 0s: Target gains +5 Guard. Caster takes Strain from grazing.
- 1s: Target recovers Vitality equal to half their maximum.
      Caster or target spends 1 Resolve (caster's choice).
- 2s: Target recovers Vitality to full.
      Caster or target spends 1 Resolve (caster's choice).
- 3+: Target recovers Vitality to full and gains the [Resonance-defined bonus effect]
      Caster or target spends 1 Resolve (caster's choice).
- OF: +3 Guard / success.

Effect (Strain):
- 0s: Target clears 1 Strain. Caster takes Strain from grazing.
- 1s: Target clears 2 Strain.
- 2s: Target clears 3 Strain.
- 3+: Target clears 5 Strain and gains the [Resonance-defined bonus effect]
- OF: +2 additional Strain cleared / success.
```



## Resonances

A Resonance stat block describes the *substance* of casting, the Resonance's fiction, then lists each supported Art with that combination's specific resolution, tags, conditions, and any reshape of the Art's default behavior.

| Resonance | Mastery Slots | Description                                                  |
| --------- | ------------- | ------------------------------------------------------------ |
| Ignis     | 1             | **Fire and flame** - heat, hunger, transformation through consumption. Ignis takes; Ignis reveals. |
| Lux       | 2             | **Light made manifest** - banishing darkness, revealing truth, scouring corruption. Certainty wielded against shadow. |
| Mens      | 1             | **The realm of thought, will, and perception** - no armor guards the mind; only the mind itself does. |
| Tempus    | 2             | **The flow of moments themselves** - hastening, slowing, revealing. The rarest Resonance; every act has its proper instant. |
| Terra     | 1             | **The stubborn weight of the world** - pressing, crushing, grounding. Immovable, until something stronger moves it. |

The standard Resonance template:

```
[RESONANCE] Resonance Name

Description: [evocative line(s) on the Resonance's fiction]

[Art Name]
Describe the specific effects and interactions with the Art.

[Art Name]
Describe the specific effects and interactions with the Art.

...
```

Arts not listed in a Resonance are *not castable* with that Resonance. The combination is refused by fiction.



### Ignis

```
[RESONANCE] Ignis

Description: Flames, heat, transformation through consumption. The most volatile of the elemental Resonances - quick to apply, quick to consume itself. Ignis takes; Ignis reveals.

[Rend]
Deals Vitality damage. Bonus damage +2. Additional attack tags: "Fire". Condition: Wracked (Fire).

[Afflict]
Additional attack tags: "Fire", "Indefensible", "Imprecise", "Seeking". Condition: Wracked (Fire). Opposable by POW action roll.

[Bolster]
Bolster Effect: +2 Fire damage on melee weapon attacks. Qualifying rolls: Melee weapon attacks.

[Mend]
Heals Vitality. Bonus Effect: The caster may further choose to spend 1 Resolve to heal one Wound on the target. The Resolve cost may be paid by the caster or the target (caster's choice). The target then gains the Wracked 3 (Fire) condition.
```



### Lux

```
[RESONANCE] Lux

Description: The light made manifest - banishing darkness, revealing truth, scouring corruption. Lux insists where Ignis transforms and Tempus distorts. To channel Lux is to wield certainty against shadow.

[Rend]
Deals Vitality damage. Bonus damage +2. Additional attack tags: "Radiant", "Indefensible", "Imprecise". Condition: Shrouded. Opposable by PRE action roll.

[Afflict]
Additional attack tags: "Radiant", "Indefensible", "Imprecise". Condition: Shrouded. Opposable by PRE action roll.

[Bolster]
Bolster Effect: All weapon attacks made by the target gain the "Radiant" tag. The target is immune to becoming Frightened (any existing Frightened condition on the target is cleared immediately when the Bolster takes effect). Qualifying rolls: None.

[Mend]
Can heal either Vitality or Strain (caster choice).
- Vitality Bonus Effect: All stackable conditions on the target that are auto-clear or roll-to-clear are immediately cleared, regardless of stack count.
- Strain Bonus Effect: All non-stackable conditions on the target that are auto-clear or roll-to-clear are immediately cleared.
```



### Mens

```
[RESONANCE] Mens

Description: The realm of thought, will, and perception. Mens reaches past flesh and bone to act directly on consciousness. No armor guards the mind; only the mind itself does.

[Rend]
Deals Strain damage. Additional attack tags: "Mental", "Indefensible", "Imprecise", "Seeking". Condition: Frightened. Opposable by INS action roll.

[Afflict]
Additional attack tags: "Mental", "Indefensible", "Imprecise", "Seeking". Condition: Frightened. Opposable by INS action roll.

[Bolster]
Bolster Effect: +2d on REA and INS rolls made to oppose another roll. Qualifying rolls: All other REA and INS rolls.

[Mend]
Heals Strain. Bonus Effect: The target is cleansed of the Frightened condition. The caster may further choose to spend 1 Resolve to heal one Burden on the target. The Resolve cost may be paid by the caster or the target (caster's choice).
```



### Tempus

```
[RESONANCE] Tempus

Description: The rarest of Resonances - the flow of moments themselves. Tempus does not destroy; it accelerates, retards, or reveals. Those who touch Tempus learn that every act has its proper instant.

[Rend]
Deals Vitality damage. Additional attack tags: "Cosmic", "Indefensible", "Imprecise", "Seeking", "Penetrating". Condition: Slowed. Opposable by a luck roll. Damage manifests as accelerated decay - flesh ages, edges dull, materials brittle.

[Afflict]
Additional attack tags: "Cosmic", "Indefensible", "Imprecise", "Seeking", "Penetrating". Condition: Slowed. Opposable by a luck roll.

[Bolster]
Bolster Effect: If the target starts a turn with less than 3 Vigor after refresh, their Vigor is set to 3. Qualifying rolls: Any roll made as part of a reaction.

[Mend]
Not Supported.
```



### Terra

```
[RESONANCE] Terra

Description: The stubborn weight of the world made into a weapon or a shield. Terra presses, crushes, grounds; it is the slowest of the elements and the most enduring. Where Ignis burns and Tempus decays, Terra simply is immovable until something stronger moves it. Magically channeled, Terra becomes the spell of force applied to the body: hammering blows, pinning weight, stone-skin defenses.

[Rend]
Deals Vitality damage. Bonus damage +1. Additional attack tags: "Earth", "Crushing". Condition: Impaired.

[Afflict]
Additional attack tags: "Earth", "Imprecise", "Seeking". Condition: Impaired.

[Bolster]
Bolster Effect: Target gains +2 Max Guard. Qualifying rolls: All POW rolls.

[Mend]
Heals Vitality. Bonus Effect: Target gains +2 Guard.
```
