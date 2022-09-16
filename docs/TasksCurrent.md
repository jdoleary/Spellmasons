
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
- Write script for voice over and order
- melee prediction is still off
- archer LOS is drawn under walls which looks weird if it's under a wall but still gets to you because its the front of the wall
- attack badge shouldn't show if unit doesn't have enough mana to cast
- attack range shouldn't be red when explosion radius is red
- do a playtest myself and record for trailer footage
- Make the trailer

- implement jakes UI icons
## To fix from Brad playtest
- Don't play turn end sound fx if you've already ended yoru turn
- bug: after dying, quitting to main menu and starting new run, Brad kept his old spells
- bug: he got "invalid target" when trying to cast on the top of a wall but he was using "expand" so it shoul've been valid cause there were targets in the radius
- trap radius too big
- "targeting self" comes up when using steal mana which is true but confusing
- I can see him at 0,0 when he's choosing spawn and if he queues up a spwll it draws the green line
- brad has two poisons on his spellbar
- when portals spawned on us both we didn't get the spell pickup
## Tasks 
- Improve out of range targeting: if any part of a unit is in range, then targeting it must be allowed
---
- Standalone server backlog
    - When does stand alone server remove a room?
        - it appears that when all players leave, if one rejoins it's a new game
- decrease player unit move speed?
## Low hanging fruit
- small bugs:
    - Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
    - when your main mana bar has 0 mana left it doesn't show the diagonal lines
    - if you pull something into you and you're standing on the edge of liquid you take damage as if you fell in the liquid (on blood level)
    - sometimes when you walk you get stuck on a wall and it wastes stamina
# Bugs
- push bloat hurt prediction resulted in weird prediction lines
- Permanently fix liquid
    - weird liquid : 0.5211362200270263
- chain through pickups?
- fix AOE
## Tasks
- Need UI sound interactions
    - Think of warcraft 3 frozen throne
    - **not** for hover states
    - button clicks
    - left click
    - spells
    - book opening for inventory
    - a "you died" (gta wasted)
    - quieter end turn in multiplayer
    - sounds that lets you know everyone is waiting on you
    - warnings: out of stamina, no target, out of range (see breath of the wild)
    - missing sfx for vulnerable/debilitate
    - summoner cast sfx
    - missing vampire hurt noise (when you push them into lava)
- Feature: perks
- Feature: "Soul bind" - bound units share applied effects
    - Use PIXI.SimpleRope https://pixijs.download/dev/docs/PIXI.SimpleRope.html
- use card background for upgrades with different colors depending on rarity
- rework expand, it's predictions are often way off.  Maybe it would do better to just increase the radius of all spells?
- art: Spell Modifier effects visual representation to stay on units
    - debilitate
    - blood curse
- If player joins mid enemy movement it will force reset them
- on refresh (with only 1 client in room) the server reseeded level but my position stayed the same
- rework exp
- bug: when i quit a game and start over it gives me the resurrect optoin
    - or it maintains some state, like all the spells in my inventory
- Ensure hurt is presented in first spell picks
- game slows down when there's a lot of blood on the screen and it's painint more
- How does endgame scale now that strength doesn't depend on the levelIndex?
- bug: Aoe + many hurt: the hurt sound effect only plays once, it's as if the many damage sound effects from the many targets clears it or something

## Stretch Content
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