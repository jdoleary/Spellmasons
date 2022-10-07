- bug: pickups and doodads don't get tinted when targeted with movement spells because of how they are assocaited with the real one
    - either use ids or pass a reference to the real when copying to a prediction one
- refactor spells to work on doodads, pickups, and units just like Connect now does
    - push.ts is next
## Brad playtest
    - bug: saw +0 mana when he tried to mana steal from me; desync bug; i moved when he cast.
    - add footstep sfx
    - Fix unit sync, when the summoner summoned random units it synced but the units' image didn't change and was wrong
    - Brad couldn't see top of inventory due to resolution
        - maybe add pages?
        - UI: Inventory should show up on the left side
---
- Spell text should be centered (see contaminate in your toolbar)
- fix archers having infinite range
- notify with floating text when AI units are out of mana
    - maybe rework AI mana so that they get the full amount they need every turn just like you do as a player
- credits page
- bug: had an incorrect push prediction, see footage
- bug: after loading game I get these errors:
    Cannot show upgrades, no globalThis.player Underworld.ts:1823:14
    Missing subsprite data for imageName null Image.ts:329:14
    Unable to init modifier with key Blood Curse
- bug: got ` Uncaught TypeError: animationSprite2.parent is null` after triggering a pickup and quickly going through a portal before theanimation could finish

## Trailer work
- Film multiplayer
- Add motion
- Add title cards
- copy: "Each spell influences the next"
## next up
- melee prediction is still off
- attack range shouldn't be red when explosion radius is red
- bug: Brad got "invalid target" when trying to cast on the top of a wall but he was using "expand" so it shoul've been valid cause there were targets in the radius
- Improve out of range targeting: if any part of a unit is in range, then targeting it must be allowed
- small bugs:
    - Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
    - when your main mana bar has 0 mana left it doesn't show the diagonal lines
    - sometimes when you walk you get stuck on a wall and it wastes stamina
# Bugs
- bug: too many pushes or too fast can result in the unit clipping through walls.
- Permanently fix liquid
    - weird liquid : 0.5211362200270263
- chain through pickups?
- bug: **important** pressing 'alt' in chrome deselects the window and makes it stop accepting input
    - This doesn't happen in fullscreen
    - Test in windowed mode on Electron

# Long Term
- How does endgame scale now that strength doesn't depend on the levelIndex?
- What if cards could cost you things other than mana, like health, or even speed?? 0.o
- Make pickups destructable (even portal - which could spawn in at another location if you destroy it - aim to plesantly suprise players)
- Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)

## Stretch Content
- add ghost archer
- what attributes of a spell could be modified by other cards?
    - already: targets, quantity
    - new: radius, amount
- Feature: perks
- Ghost archers: Arrow only hits target, no piercing
- Piercing arrows as default for archers
- perk: long range cast only
- perk: Start each level with 2x mana overfill
- Idea: Level up spells along with perks
    - Leveling up could auto increase quantity / lower mana cost / speed mana recovery
- Idea: "overwatch" where some archers can shoot even not on their turn if you walk in their LOS
- What if potions drop from slain enemies instead of being just pickups on the ground, it would be more exciting if you needed one and it dropped.
- whole bodies of liquid should be selectable so that they can be frozen
    - freezable liquid to walk over
- Cannot be combined with other spells
    - card to temporarily increase cast range
- Content: Time crystal releases something when it breaks
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- An enemy that consumes allies to get stronger
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome
- Card: An attack range minimum but not a maximum so you CAN"T attack if they are too close
- Casting curses on liquid should change the liquid type (lava/hurt, purify/water, poison)
- Change AOE behavior so that it just expands radius
    - This radius expansion should work for ANY spell that uses a radius: vortex, bloat, chain, etc
    - Maybe it only modifies the spell directly after it
- idea: summoner spells like elden ring
    - they split your stats
- enemy that debuffs blessings
- juice: ultra badass spell should put in wide-screen black bars and take over the camera
    - and he could crouch and gather enegery
- "heat seaking" missle unit, explodes on contact

## New Spell Ideas
- Idea: A spell to sacrifice ally unit immediately
- Card: Mind Control (changes faction temporarily)
- Feature: "Soul bind" - bound units share applied effects
- Spell: A spell like AOE, but adds radius to existing spells
- Jump card- to jump over walls
- vortex card - to pull units in to a center location
- Content: A spell to destroy corpses
    - and grant you mana, or health, or stamina?
    - corpse as currency
- Spell: grappling hook (pulls your towards something)
- Spell: Range, like aoe and chain but extends your range
- Soul capture (1 use, like pokeball)
    - works for pickups too
- What if monsters that go through portal come to next level with you, but you don't get more mana after the portal spawns
- protection (targeting spell)
- totems
- auras
- ricotche
- task: Spell to trade mana for stamina
- eagle eye
- lance for targeting
- destroy a corpse for mana
- soul capture (like pokeball)
- generic summon (1 for each enemy, does bigger and better enemies depending on stack)
- explode a corpse (same as bloat?)
- split: like clone but each copy is smaller and has half of max stats (a curse so it can be undone)
- grow a barrier
- slow/ cripple: reduce max stamina
- set fires on board that spreads
- Displace: Teleports target to a random location
- damage spells:
    - Slice: basic / already have
    - Rend: Does more damage as it stacks
    - bleed: Does damage relative to how much health is missing
    - mana burn
    - suffocate: kill in 5 turns
    - drown: deal massive damage if unit is submerged in liquid
    - poison: dot
    - stomp: more damage the closer they are
- Tornado: Travells through the map throwing things around (maybe a good enemy ability)

## Multiplayer Enhancements / issues
- if you choose a spawn position while another player is casting it waits and then spawns where you clicked, which can be confusing because it still looks like you can choose where to spawn
- if you can MOVE_PLAYER while a super long cast is being triggered.
    - you cannot, find a way to handle this for multiplayer so it's communicated that you have to wait to cast until someone else has finished casting
    - IMPORTANT: Change the store description:  `Spellmasons uses innovative faction-based turns: You and your fellow mages can all move, cast and act simultaneously.` if needed
- If player joins mid enemy movement it will force reset them
    - this is still an issue: as of 2022-09-16
## Misc
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther