TODO: Fill this out, for now it will store my ideas

Class-Specific Spells! Upgrades that you can only get as a character of the class
Maybe they should have a 100% probability of at least one showing up in level up choice

At the very least, implement one spell for each class to come with the initial PR
For existing class-types

Cleric:
Regenerate
Heal 5 hit points for every stack of the regenerate effect, stack decreases by 1 every round
Implementation: Use an effect for regenerate

Necromancer:

Dark bolt
Send a bolt of necromantic damage to an enemy, heal 50% of that damage, damage similar to an unupgraded arrow, helps with the health costs of raising dead
Implementation: Use a spell card is fine

Hex
Pairs well with decoy, enemy takes damage equal to the damage they deal for rounds equal to the stacks of the spell

Far-Gazer:
Sniping Stance
Adds % damage to first hit of the next attack equal to stamina expended / 10, encourages you to stay still, removes cap from Long Arrow/Shot/Whatever that spell is called
Implementation: Probably another effect, expires after a turn, listens for damage somehow. May be kinda hard to implement

Archer:
Pinning Shots
Any enemies hit by attacks with this modifier have their stamina reduced to 0 for a round


Witch:
Voodoo Doll
Deal half the damage dealt to this enemy once the effect expires, stacks increase how many turns the cumulative damage is stored for

Glacial Freeze [Freeze Upgrade]
Deals damage while frozen equal to number of curses * 10/max mana capped to max mana, increases vulnerability by 50%

Complex Bloat [Bloat Upgrade]
Can store a single spell in Complex Bloat by casting it before Bloat [Mainly for vortex], the spell is ignored when cast
Implementation: May be really hard to implement, if so maybe cut it for now

Gambler:
Roll The Dice
Randomly modify the damage of the next spell combo by anywhere between 50% and 200%

Lucky Shot
Ranged attack that deals variable damage, has a chance to ricochet to a nearby enemy

Shuffle The Cards
Randomize the targets health, mana and stamina (max health may turn into max stamina, max stamina may turn to max health etc)
Implementation: Store current values and make sure they remain consistent after shuffling, you don't want to instakill someone because they had 0 stamina and their health turned to stamina