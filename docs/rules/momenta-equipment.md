# Momenta — Equipment Catalog

**Version:** 0.31

Momenta is a tactical, cinematic fantasy TTRPG built around modular archetypes and slottable masteries. This catalog contains the stat blocks for gear (weapons, armor, and spell foci). It is intended to be used with the `Momenta - Quick Start Guide` document, which contains the core rules of Momenta.

All of the catalog examples are a *sample of the design space*, and not to be considered an exhaustive list.



## Gear

Gear includes **weapons**, **armor**, and **spell foci**.



### Weapons

Weapons take up a **number of gear slots** depending on their **weight class**:

- **Light**, **Medium** and **Heavy** weapons - Takes **1 gear slot** to equip.
- **Superheavy** weapons - Takes **2 gear slots** to equip.

Weapons are also assigned various weapon tags that describe the traits of the weapon:

| Tag          | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Slashing     | This weapon does slashing (i.e., cutting) physical damage.   |
| Piercing     | This weapon does piercing (i.e., pointed, impaling) physical damage. |
| Crushing     | This weapon does crushing (i.e., bludgeoning, blunt) physical damage. |
| Melee N      | This weapon can be used to do melee attacks, and has a reach of N squares. |
| Range N      | This weapon can be used to do ranged attacks, and has a maximum range of N squares. |
| Deflect      | This weapon can be used to perform the **Deflect** reaction. You can only deflect attacks if the **weight class** of the deflecting weapon is equal or greater than the attacking weapon's weight class. |
| Shield       | This weapon is a shield and can be used to perform the **Deflect** reaction. There is no weight class restriction on the attacking weapon. |
| Reflexive    | This weapon can be used to make a **Forestall** reaction.    |
| Penetrating  | This weapon **bypasses Guard** and hits Vitality directly.   |
| Indefensible | This weapon cannot be mitigated by **reactive defenses**.    |
| Imprecise    | This weapon **cannot target hit locations**. It can only target Mass. This means that an Imprecise ranged weapon cannot be used to attack a target that is behind cover (melee weapons are not affected by cover). |
| Seeking      | This weapon is **not affected by cover**.                    |
| Cumbersome   | Attacks with this weapon cost **3 Vigor** instead of 2. This includes reactive attacks like **Forestall**, **Intercept**, and **Counterattack**. |
| Combo        | This weapon is part of a **combination weapon**, and it must be equipped with its other part(s). Together, the combination weapon costs **one fewer gear slot than the sum of its parts (minimum 1)**. |

> **Design Note:** The **Deflect** and **Shield** tags mark weapons *capable* of deflecting. The **Deflect reaction** itself must be granted by an ability (e.g., Warrior Rank 1) — the tag alone does not grant it.



#### Unarmed Attack

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



#### Light Weapons

```
[WEAPON] Dagger (Slashing/Piercing, Melee 1, Range 5)
Weight Class: Light
Attribute: POW/AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage
- 2s: 8 damage
- 3+: 12 damage

Special: When used as a ranged weapon, the damage type is always Piercing.
```

```
[WEAPON] Stiletto (Piercing, Melee 1, Penetrating)
Weight Class: Light
Attribute: POW/AGI

Effect:
- 0s: 1 damage
- 1s: 3 damage
- 2s: 6 damage
- 3+: 9 damage
```

```
[WEAPON] Rapier (Slashing/Piercing, Melee 1, Deflect)
Weight Class: Light
Attribute: AGI

Effect:
- 0s: 1 damage
- 1s: 5 damage
- 2s: 10 damage
- 3+: 15 damage
```

```
[WEAPON] Sling (Crushing, Range 10)
Weight Class: Light
Attribute: POW/AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage
- 2s: 8 damage
- 3+: 12 damage
```

```
[WEAPON] Chakram (Slashing, Range 10, Seeking)
Weight Class: Light
Attribute: AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage
- 2s: 8 damage
- 3+: 12 damage
```

```
[WEAPON] Whip (Slashing, Melee 2, Reflexive)
Weight Class: Light
Attribute: AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage
- 2s: 8 damage
- 3+: 12 damage
```

```
[WEAPON] Buckler (Crushing, Melee 1, Shield)
Weight Class: Light
Attribute: POW/AGI

Effect:
- 0s: 1 damage
- 1s: 3 damage
- 2s: 6 damage
- 3+: 9 damage
```



#### Medium Weapons

```
[WEAPON] Longsword (Slashing/Piercing, Melee 1, Deflect)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 11 damage
- 3+: 17 damage
```

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

```
[WEAPON] Warpick (Piercing, Melee 1, Penetrating)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 10 damage
- 3+: 15 damage
```

```
[WEAPON] Spear (Piercing, Melee 2, Reflexive)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 11 damage
- 3+: 17 damage
```

```
[WEAPON] Shortbow (Piercing, Range 20)
Weight Class: Medium
Attribute: AGI

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 11 damage
- 3+: 17 damage
```

```
[WEAPON] Light Crossbow (Piercing, Range 30, Cumbersome)
Weight Class: Medium
Attribute: AGI

Effect:
- 0s: 2 damage
- 1s: 7 damage
- 2s: 13 damage
- 3+: 20 damage
```

```
[WEAPON] Heater Shield (Crushing, Melee 1, Shield)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 4 damage
- 2s: 7 damage
- 3+: 11 damage
```



#### Heavy Weapons

```
[WEAPON] Greataxe (Slashing, Melee 1)
Weight Class: Heavy
Attribute: POW

Effect:
- 0s: 3 damage
- 1s: 9 damage
- 2s: 17 damage
- 3+: 25 damage
```

```
[WEAPON] Warhammer (Crushing, Melee 1)
Weight Class: Heavy
Attribute: POW

Effect:
- 0s: 3 damage
- 1s: 9 damage
- 2s: 17 damage
- 3+: 25 damage
```

```
[WEAPON] Greatsword (Slashing/Piercing, Melee 1, Deflect)
Weight Class: Heavy
Attribute: POW

Effect:
- 0s: 3 damage
- 1s: 8 damage
- 2s: 15 damage
- 3+: 22 damage
```

```
[WEAPON] Halberd (Slashing/Piercing, Melee 2)
Weight Class: Heavy
Attribute: POW

Effect:
- 0s: 3 damage
- 1s: 8 damage
- 2s: 15 damage
- 3+: 22 damage
```

```
[WEAPON] Longbow (Piercing, Range 40)
Weight Class: Heavy
Attribute: POW/AGI

Effect:
- 0s: 3 damage
- 1s: 8 damage
- 2s: 15 damage
- 3+: 22 damage

Special: If using POW as the attribute, the weapon gains the Imprecise tag.
```

```
[WEAPON] Heavy Crossbow (Piercing, Range 60, Cumbersome)
Weight Class: Heavy
Attribute: AGI

Effect:
- 0s: 3 damage
- 1s: 9 damage
- 2s: 17 damage
- 3+: 25 damage
```

```
[WEAPON] Tower Shield (Crushing, Melee 1, Shield)
Weight Class: Heavy
Attribute: POW

Effect:
- 0s: 3 damage
- 1s: 5 damage
- 2s: 9 damage
- 3+: 13 damage

Special: While this shield is equipped, you have cover as long as you have not attacked since the start of your most recent turn. The moment you make an attack, the cover is lost.
```



#### Superheavy Weapons

```
[WEAPON] Great Maul (Crushing, Melee 1, Cumbersome, Imprecise)
Weight Class: Superheavy
Attribute: POW

Effect:
- 0s: 6 damage
- 1s: 16 damage
- 2s: 28 damage
- 3+: 40 damage
```

```
[WEAPON] Zambato (Slashing, Melee 2, Cumbersome)
Weight Class: Superheavy
Attribute: POW

Effect:
- 0s: 6 damage
- 1s: 14 damage
- 2s: 24 damage
- 3+: 34 damage
```

```
[WEAPON] War Scythe (Slashing, Melee 1, Imprecise)
Weight Class: Superheavy
Attribute: POW

Effect:
- 0s: 6 damage
- 1s: 10 damage
- 2s: 19 damage
- 3+: 28 damage
```

```
[WEAPON] Greatlance (Piercing, Melee 2, Cumbersome)
Weight Class: Superheavy
Attribute: POW

Effect:
- 0s: 6 damage
- 1s: 14 damage
- 2s: 24 damage
- 3+: 34 damage
```



#### Combination Weapons

A combination weapon is two or more weapon parts that share the **Combo** tag and must be equipped together.

```
[WEAPON] Gunsword Blade (Slashing, Melee 1, Deflect, Combo)
Weight Class: Medium
Attribute: POW

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 11 damage
- 3+: 17 damage

Special: Combination weapon with Gunsword Barrel.
```

```
[WEAPON] Gunsword Barrel (Piercing, Range 20, Combo)
Weight Class: Medium
Attribute: AGI

Effect:
- 0s: 2 damage
- 1s: 6 damage
- 2s: 11 damage
- 3+: 17 damage

Special: Combination weapon with Gunsword Blade.
```



### Armor

Armor is gear that is used for protection. All characters can only equip at most one armor at a time, no matter how many gear slots they have. A character with no armor equipped is assumed to be wearing plain clothes or explorer's clothing with no damage mitigation.

Armor is classified as either **Standard** or **Martial**.



#### Standard Armor

```
[ARMOR] Leather Armor (Standard)

Effect: +1 Max Guard
Penalty: none
```

```
[ARMOR] Armored Cloak (Standard)

Effect: +2 Max Guard
Penalty: -1d on all AGI action rolls
```



#### Martial Armor

```
[ARMOR] Chain Shirt (Martial)

Effect: +2 Max Guard
Penalty: none
```

```
[ARMOR] Plate Armor (Martial)

Effect: +3 Max Guard
Penalty: -1d on all AGI action rolls
```

```
[ARMOR] Great Plate (Martial)

Effect: +4 Max Guard
Penalty: -2d on all AGI action rolls
```



### Spell Focus

Spellcasting archetypes (e.g., Scholar and Channeler) can use their gear slots to equip a **spell focus** (plural: spell foci). This represents a trinket or gadget that helps the spellcaster with casting spells. It can take the shape of a wand, staff, amulet, crystal, spell book, holy symbol, tattoo, etc. - the flavor can be player chosen, but they share the same mechanics.

There is no limit to the number of spell foci that a character can equip, as long as they have enough gear slots. The effects of all equipped spell foci apply simultaneously. However, a character can benefit from only one copy of any given type of spell focus.



#### Basic Spell Focus

```
[FOCUS] Basic Spell Focus

Effect: none
```

> All spellcasting archetypes will receive a **basic spell focus** with no special abilities; it simply enables casting at full effectiveness.



#### Exotic Spell Focus

Exotic spell foci are found, crafted, rewarded, or otherwise acquired. They may grant specific bonuses (and sometimes penalties) beyond the Basic Spell Focus.

```
[FOCUS] Ignis Crown
Description: A circlet of bronze-laid garnet, warm to the touch. Worn by the last fire-priests of the Sundered Order. Found, rarely sold.

Effect: +1d to all spellcasting rolls using the Ignis Resonance.
```

```
[FOCUS] Whispering Locket
Description: A small silver locket that hums faintly when worn near sleeping minds. The whispers inside it are never quite intelligible.

Effect: +2d to all spellcasting rolls using the Mens Resonance. -1d to all other spellcasting rolls using any other Resonance.
```

```
[FOCUS] Mender's Sigil
Description: A worn brass seal pressed with the image of a closed eye. Field-chirurgeons and battle-priests prize it above gold.

Effect: +1d to all spellcasting rolls casting the Mend Art.
```

```
[FOCUS] Reliquary of the Dawn
Description: A sliver of gilded bone in a sunburst case. It grows warm at dawn, wherever it is kept.

Effect: For Lux Resonance spells you cast, reduce the Vigor cost for spell-shaping by 1 (minimum total spell-shaping cost 1)
```

```
[FOCUS] Deadman's Choker
Description: A band of blackened silver, cold as a grave. Power answers instantly to the one who wears it — and luck abandons them utterly.

Effect: +3d to all spellcasting rolls. While this spell focus is equipped, you have the Cursed condition. The Cursed condition ends when you unequip the spell focus.
```



## Wondrous Items

Wondrous items are unique, magical items that grant the wielder special abilities or bonuses. Wondrous items are unlike normal gear, and need to be equipped into a **wondrous item slot**. A character has a number of wondrous item slots equal to their MIND value.

```
[WONDROUS] Pathfinder's Compass
Description: A brass compass whose needle points not north, but home.

Effect: +1d to action rolls that apply to situations where navigation or tracking are involved.
```

```
[WONDROUS] Spider-Grip Gloves
Description: Supple leather gloves stitched with a faint, tacky resin that never seems to wear away.

Effect: When climbing in combat, the wearer is considered as having the Athlete mastery. In addition, while climbing, every square is not treated as difficult terrain, but as normal terrain instead.
```

```
[WONDROUS] Pendant of the Ox
Description: A soapstone ox on a leather cord, worn smooth by generations of labourers' thumbs.

Effect: The character gains Resistance (Slashing), but suffers a -1 to SPD.
```



## Consumables

Consumables are **single-use items** that can be used for healing, buffing, de-buffing, or even attacking. It is assumed that adventurers are generally well prepared and always in possession of a good mix of consumables for most situations. In Momenta, we do not track individual consumables, but instead use **consumable points**.

To use a consumable, a character will mark off a consumable point, and they can apply the effect of any of the consumables that are on the common consumables catalog. It is assumed that adventurers will have access to all of the common consumables.



### Common Consumables

```
[CONSUMABLE] Restoration Balm
Target: Self, Adjacent Ally

Effect: The target spends 1 Resolve and restores Vitality equal to half their maximum Vitality.
```

```
[CONSUMABLE] Energy Drink
Target: Self, Adjacent Ally

Effect: Restore the target's Vigor by 3.
```

```
[CONSUMABLE] Alchemist's Fire (Fire, Range 5, Seeking, Imprecise)
Weight Class: Light
Attribute: AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage
- 2s: 8 damage, target gains Wracked 1 (Fire)
- 3+: 12 damage, target gains Wracked 1 (Fire)
```

```
[CONSUMABLE] Smoke Bomb
Target: Self

Effect: Target becomes Obscured from all enemies until the start of their next turn.
```



### Exotic Consumables

```
[CONSUMABLE] Phoenix Ember
Target: Adjacent Ally

Effect: Remove the target's Defeated condition.
```

```
[CONSUMABLE] Lightning in a Bottle (Shock, Range 5, Seeking, Imprecise)
Weight Class: Light
Attribute: AGI

Effect:
- 0s: 1 damage
- 1s: 4 damage, target gains Wracked 1 (Shock)
- 2s: 8 damage, target gains Wracked 2 (Shock)
- 3+: 12 damage, target gains Wracked 3 (Shock)
```
