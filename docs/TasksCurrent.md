# Low hanging fruit
- inventory should show current card cost and cooldown
- Steam description is too wordy, just tell 'em why it's awesome
- h: **important**: completely destroy the underworld object between playthroughs rather than just cleaning it up
    - for now you can tell because lastUnitId isn't reset
# Brad playtest 2:
- futher investigate '  // Override ref since in prediction it makes a copy of the unit' from 06d754d2
- dragger x and y went to null after "target similar, slash slash"
- he can't spawn in while i'm casint a spell
    - same thing with casts, it waits
- spawning on top of a stamina or mana potion doesn't overfill in multiplayer
- EZ self cast, like alt clicking a spell self casts or something
- melee prediction not working? See footage
- should allow spell prediction even while an action is taking place - this not being here causes friction in multiplayer
- sync issue: golem moving through frozen guys jumped back
---
- make spell text scrollable
- You're able to cast into negative mana in multiplayer
---
## Instructions for playtest
- If you see "Lost connection to server" just refresh and rejoin the game
---
- missing gold circle on player 2's feet
- I dashed and then ended my turn immediately and I got reset to before where i dashed
- headless server executed should count time, not loops to detect issue
# Brad Playtest
- multiple portal bug
- when in full screen escape leaves full screen in addition to opening menu
    - https://stackoverflow.com/questions/72248081/preventing-electron-to-exit-fullscreen-on-escape
- pathing prediction messed up, see video
- out of range circle stuck up  with no spell
# 2022-10-25
## Priorities
- Fix underworld cleanup so no state carries over
- **important**Allow multiplayer game restart after wipe
    - All players return to lobby after 10 seconds
    - cleans up underworld
    - Currently it just lets you exit to main menu but if you rejoin the game it still exists with everyone dead in it
## All
- fixed?
    - bug: in multiplayer games units are spawning out of bounds
    - bug: when player rejoins a game the map is different
        - This might be fixed once I fully GC underworld between uses
- Turn phase testing:
    - if one player is portaled and the remaining player dies it should go to the next level
    - if no players are portaled and all players die and there are no ally npcs it should go to game over
    - if no players are portaled and all players die and there ARE npc allies it should run turn phases for NPCS
        - if NPC_ALLYs succeed it should go to next level
        - if NPC_Allys do not it should go to end game
- Handle GCing underworld by making a container object through which all functions that need access to it access it through
    - Then on cleanup, the container will just reassign a new underworld.
- somehow changing servers resulted in the old underworld's state still hanging around in lobby
- investigate: `// TODO will the stack just keep growing`
    - turn_phases should work on a queue not a stack (this is mostly relevant for singleplayer and when the NPCs are just hashing it out cause all the players are dead so it doesn't stack overflow)
    - Just make it a while loop that triggers/awaits the next AI turn until it's the players tuurn
# Pre playtest
- Need a restart screen after a team wipe
- Hide disconnected players in game screen but not in the lobby
- Multiplayer voting
- Adaptive difficulty
- What to do with disconnected players when it goes to the next level?
- Fix rejoining hack where people can just rejoin if they're dead to come back
# Features
- In marketing, emphasize that it's turn based
    - Why this game might not be for you
- how to show how much damage a queued spell will do
- Permanent "you died" screen.
- cooldown instead of mana multiplier scaling
- Expanding should take longer to return to base mana like resurrect and summon decoy do
    - Do this with cooldowns
- Add server history
- Add save/load to menu
- Feature request: UI Scaling
# Bugs / Cleaning
- UI: Allow inventory to scale on smaller resolutions
- bug: In multiplayer: target similar, damage x3 on 2 draggers made their position go to null null
- fix save/load  from menu screen, it needs to change the gameview
- if screen is too thin, hover card covers inventory
- in multiplayer, when one player leaves and window is not focused the camera spazzes out
- "All targets" copy is confusing if player doesn't understand targeting
- Find a way to make randomness fixed (like in spell "Displace" so that it doesn't get different random results on other people's screens and so that it wont change after another player casts)
- This save file is giving me critical errors `saveFile-with-errors.json`
- Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
- sometimes when you walk you get stuck on a wall and it wastes stamina
- done?: melee prediction is still off
    - simplest solution is just to make sure that units cannot do damage to the player if they aren't warning of damage incoming on the start of the turn
- h: bug: **important** pressing 'alt' in chrome deselects the window and makes it stop accepting input
    - This doesn't happen in fullscreen
    - Test in windowed mode on Electron
- h: bug: saw +0 mana when he tried to mana steal from me; desync bug; i moved when he cast.
    - this is a race condition because I'm still able to move freely after his cast triggers
- Fix liquid tile glitches with prebuild liquid sets
- resurrect should take longer to return to base mana
    - this already is set but it didn't work in brad's playtest... hmm..
## Prediction issues
- prediction should factor in standing on pickups, see video
# Content
- Make Youtube short audio louder
- Rend
    - new sfx
- Bleed
    - new sfx
- Suffocate
    - new sfx
    - new animation
# Optimization
- QuerySelectorAll -> UpdateCardBadges is taking a lot of CPU
- Optimize: targeting spells seem pretty slow in prediction
- optimize: Ihave duplicate units, pickups, and doodads in save due to serailizeForSaving having them in the underworld and extracting them to the top level too
- Test early exit (infinite loop protection) for headless gameloop

## Stretch Content
- feature: secondary spellbar
- Idea: "oh shit button": double the amount of mana you have this level but it reduces by half next level. " Break glass in case of emergency. Deal with the devil
- Idea: Amplify spell: makes "multicast"
- Add `cooldown` to spells rather than expense scaling
    - Add a spell that resets cooldowns
    - Add a curse that increases cooldowns
- h: piercing archers
- h: "Heat seeking" enemy or spell
- idea: spell that triggers onDeath effects "Playdead"
- Liquid: blood could apply a curse when you fall in, like slowed movement
- Spell to slow movement
- I need better targeting spells
    - Target by proximity with no limit?
        - Quantum link
    - Target ALL units with ... some unifying feature
- Late game version of lobber: moves and casts in the same turn.  Make sure to get prediction right
- Idea: Blessing that blocks all damage for one turn. "Fortify"
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
- What if you could hit enemies with your staff to do damage / bat them away
- Idea: A spell to sacrifice ally unit immediately
- Card: Mind Control (changes faction temporarily)
- Feature: "Soul bind" - bound units share applied effects
- A spell that saves 40% of your current mana for next turn
- A spell where you can save some of your health, mana, stamina in a potion
- Content: A spell to destroy corpses
    - and grant you mana, or health, or stamina?
    - corpse as currency
- What if monsters that go through portal come to next level with you, but you don't get more mana after the portal spawns
- totems
- auras
- ricotche
- task: Spell to trade mana for stamina
- eagle eye
- destroy a corpse for mana
- soul capture (like pokeball)
    - works for pickups too
- generic summon (1 for each enemy, does bigger and better enemies depending on stack)
- explode a corpse (same as bloat?)
- grow a barrier
- slow/ cripple: reduce max stamina
- set fires on board that spreads
- Tornado: Travells through the map throwing things around (maybe a good enemy ability)
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