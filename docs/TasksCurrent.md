- bug: I'm getting a "this spell will damage you" popup during enemy turn because the unit syncs their perk health upgrade but not the prediction unit
- bug: when a new player joins if you're looking at the upgrade menu it regenerates them
- if you choose a spawn position while another player is casting it waits and then spawns where you clicked, which can be confusing because it still looks like you can choose where to spawn
- bug: collected scroll but it didn't show upgrade screen
- bug: multiplayer, when a dead player chooses resurrect they appear where they were when they died, they should portal instead
- choosing perks doesn't work `cannot choose another perk`
    - okay it did work but it didn't sync right away
---
- test if you can MOVE_PLAYER while a super long cast is being triggered.
    - you cannot, find a way to handle this for multiplayer so it's communicated that you have to wait to cast until someone else has finished casting
- bug: had a message come through where the fromPlayer wasn't set
```
 Handle ONDATA 10 CHOOSE_UPGRADE 
Object { type: 8, upgrade: {…} }
​
type: 8
​
upgrade: Object { title: "Expanding", type: "card", thumbnail: "images/spell/spellIconExpanding.png", … }
​
<prototype>: Object { … }
networkHandler.ts:136:12
09:00:50.844
Cannot choose upgrade, either the caster or upgrade does not exist undefined 
Object { title: "Expanding", type: "card", description: description(), thumbnail: "images/spell/spellIconExpanding.png", maxCopies: 1, effect: effect(player), probability: 10, cost: {…} }
```
## next up
- melee prediction is still off
- archer LOS is drawn under walls which looks weird if it's under a wall but still gets to you because its the front of the wall
- attack range shouldn't be red when explosion radius is red
- do a playtest myself and record for trailer footage
- Make the trailer

- implement jakes UI icons
## To fix from Brad playtest
- bug: he got "invalid target" when trying to cast on the top of a wall but he was using "expand" so it shoul've been valid cause there were targets in the radius
- brad has two poisons on his spellbar
## Tasks 
- Improve out of range targeting: if any part of a unit is in range, then targeting it must be allowed
## Low hanging fruit
- small bugs:
    - Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
    - when your main mana bar has 0 mana left it doesn't show the diagonal lines
    - sometimes when you walk you get stuck on a wall and it wastes stamina
# Bugs
- Permanently fix liquid
    - weird liquid : 0.5211362200270263
- chain through pickups?
## Tasks
- art: Spell Modifier effects visual representation to stay on units
    - debilitate
    - blood curse
- If player joins mid enemy movement it will force reset them
    - this is still an issue: as of 2022-09-16
- Ensure hurt is presented in first spell picks
- game slows down when there's a lot of blood on the screen and it's painint more
- How does endgame scale now that strength doesn't depend on the levelIndex?
- bug: Aoe + many hurt: the hurt sound effect only plays once, it's as if the many damage sound effects from the many targets clears it or something

## Stretch Content
- use card background for upgrades with different colors depending on rarity
- Card: Mind Control (changes faction temporarily)
- Feature: perks
- Feature: "Soul bind" - bound units share applied effects
- Ghost archers: Arrow only hits target, no piercing
- Piercing arrows as default for archers
- perk: long range cast only
- Heavy damage spell: rend
- Idea: Level up spells along with perks
    - Leveling up could auto increase quantity / lower mana cost / speed mana recovery
- Idea: "overwatch" where some archers can shoot even not on their turn if you walk in their LOS
- Spell: A spell like AOE, but adds radius to existing spells
- Upgrade: Start each level with 2x mana overfill (think of new upgrade "perks")
- What if potions drop from slain enemies instead of being just pickups on the ground, it would be more exciting if you needed one and it dropped.
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- whole bodies of liquid should be selectable so that they can be frozen
    - freezable liquid to walk over
- Cannot be combined with other spells
    - Jump card- to jump over walls
    - card to temporarily increase cast range
- vortex card - to pull units in to a center location
- Content: Time crystal releases something when it breaks
- Content: An enemy that pulls you into danger
    - a blue poisoner
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses
- task: Spell to trade mana for stamina
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome
- Leave blood trails behind for dead units that are force pushed
- Card: An attack range minimum but not a maximum so you CAN"T attack if they are too close
- Casting curses on liquid should change the liquid type (lava/hurt, purify/water, poison)
- More "Quantity" implementations for spells beyond hurt
- Spell: grappling hook (pulls your towards something)
- Change AOE behavior so that it just expands radius
    - This radius expansion should work for ANY spell that uses a radius: vortex, bloat, chain, etc
    - Maybe it only modifies the spell directly after it
- Spell: Range, like aoe and chain but extends your range


## Misc
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther