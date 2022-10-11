# 10/11/2022
- *: fix save /load unit spawn issue
    - bug: loading game files somehow results in units at 0,0
- e: limit split lower bound
- *: Add save/load to menu
- *: Test on different resolutions
    - *: fix inventory visibility on all resolutions
---
- h: piercing archers
- h: "Heat seeking" enemy or spell
- m: cooldown instead of mana multiplier scaling
- m: inventory should show current card cost and cooldown
- m: Balance dragger
- m: dragger cast animation
- larger enemies for variation
- fix liquid fall in
- Finish menu design according to Jake prompts
- Update twitter icon with brand guidelines
- Split sprite sheet for more efficient development
- Add server history

# Today
- bug: Need to be able to purify away multiple stacks of 'split'
    - also don't get smaller once you're at 1 health
    - scale down blood
- bug: Scaled down units (due to split) may render z-index on top of bigger units that are lower than them
- bug: clone / split yielded error: 'Failed to load player because cannot find associated unit with ID 0'
- This save file is giving me critical errors `saveFile-with-errors.json`
- bug: displaceX5 + vortex made me get stuck in a wall
- Expanding should take longer to return to base mana like resurrect and summon decoy do
- Find a way to make randomness fixed (like in spell "Displace" so that it doesn't get different random results on other people's screens
 and so that it wont change after another player casts)
- Add "+ radius" spell different from "Expand"?
    - Refactor radius so that repel and vortex both have a starting select radius
- See branch 'expand-to-additional-radius'
- Change protection from direct cast to a blessing so it's less confusing
- "Complex but not complicated"
# Brad playtest
- prediction should factor in standing on pickups, see video
- resurrect should take longer to return to base mana
    - this already is set but it didn't work in brad's playtest... hmm..
- bug: saw "this spell will damage you" after heal then end turn immediately
- **important**: completely destroy the underworld object between playthroughs rather than just cleaning it up
- Perks: the more dimentions you add the better!
    - Skill tree
    - Critical chances
    - Time challenges - beat the level in less than 3 turns
    - Make bets - risk / reward
        - even with the difficulty of the next level
    - pseudo class system
    - item that makes your stronger but it randomizes your spawn
# Content todo
- Rend
    - new sfx
    - new animation
- Bleed
    - new sfx
    - new animation
- Suffocate
    - new sfx
    - new animation
# Tasks
- Explain camera movement with persistant popup about recentering so players don't get stuck if they hit WASD on accident
---
- task: Start more zoomed in
- bug: I heard priest sfx but no animation and no effect occurred
- Integrate doodad behavior
    - Make doodads collidable (take up space)
    - Make doodads block arrows
    - fix fall in liquid so larger things (like rocks or vampires) fall in further so they don't overlap
- Add a fullscreen button to options
- Fix liquid glitches with prebuild liquid sets
- Update Expand to affect a radius property in EffectStatus so it can synergize with other spells like chain, bloat, vortex, (any spell that needs a radius);
---
- fix archers having infinite range
- bug: had an incorrect push prediction, see footage
- optimize: Ihave duplicate units, pickups, and doodads in save due to serailizeForSaving having them in the underworld and extracting them to the top level too
# Bugs
- Brad couldn't see top of inventory due to resolution
    - maybe add pages?
    - UI: Inventory should show up on the left side
- small bugs:
    - Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
    - sometimes when you walk you get stuck on a wall and it wastes stamina
- melee prediction is still off
    - simplest solution is just to make sure that units cannot do damage to the player if they aren't warning of damage incoming on the start of the turn
- bug: too many pushes or too fast can result in the unit clipping through walls.
- bug: **important** pressing 'alt' in chrome deselects the window and makes it stop accepting input
    - This doesn't happen in fullscreen
    - Test in windowed mode on Electron
- bug: saw +0 mana when he tried to mana steal from me; desync bug; i moved when he cast.
    - this is a race condition because I'm still able to move freely after his cast triggers

# Long Term
- How does endgame scale now that strength doesn't depend on the levelIndex?
- What if cards could cost you things other than mana, like health, or even speed?? 0.o
- Make pickups destructable (even portal - which could spawn in at another location if you destroy it - aim to plesantly suprise players)
- Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)

## Stretch Content
- Add `cooldown` to spells rather than expense scaling
    - Add a spell that resets cooldowns
    - Add a curse that increases cooldowns
- idea: spell that triggers onDeath effects "Playdead"
- thought: Spellmasons should have some element of risk/reward like 50% chance to double damage of next spell or something like that.  Think of my experience with slice and dice where I got a dice side that did 24 damage and affected the guy below.  If you could always have that it's no fun, too easy but because you can only sometimes get it when you're lucky is what makes it exciting.
    - also one-use spells could work well
- add ghost archer
- confuse spell
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
- What if you could hit enemies with your staff to do damage / bat them away
- Idea: A spell to sacrifice ally unit immediately
- Card: Mind Control (changes faction temporarily)
- Feature: "Soul bind" - bound units share applied effects
- Spell: A spell like AOE, but adds radius to existing spells
- Spell: "Last Will" unit drops a potion on death
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
        - number of turns relative to health
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
- Jake boss ideas:
```
Necromancer supreme. Conjura a bunch of guys to fight but is very fragile himself
Think of the spider boss from Bloodborne
A guy who wields a magical sword that can do ranged slices with it. Somewhat tankier I think. Maybe weak to electric stuff
A mimic! A copy of you. Has your spells and such
Dunno how well that'd work lol
Gotta be a dragon
Big slime? Keeps splitting into smaller slimes
Maybe the final boss could be something ambiguous? Like "The Final Spell"
And it's just ball of energy that can do weird stuff
```