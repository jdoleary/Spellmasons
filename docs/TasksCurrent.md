# Nov Week 4
    - fix dragger and poisoner and priest and summoner not using attackTargets in action()
        - will it work right in prediction??
        - refactor action's attackTargets and canAttackTarget which are often unused or overridden
    - Make gameplay video with Brad, add it to Steam and YouTube
        - Bugs
        - Send out Demo
    - Rethink next trailer
        - Lead with "fun"
        - Remove "dead time"
        - get into the action fast
        - Communicate the big idea
# Nov Week 5 / Dec Week 1
    - Test Cloud Saves
    - Steam SDK
        - Default wizard name to steam name if connected to steam
        - Steam Achievements
            - https://github.com/node-ffi/node-ffi
            - https://partner.steamgames.com/doc/features/achievements/ach_guide
    - Add sentry errors to electron node files
# Bugs / Cleaning
- why does it keep introducint golems over and over 
- save file "shove" guy went through wall
    - this is because the wall polys are missing entirely when liquids are stamped right up against the edge of the underworld
        - see stampLiquids
- summoners that summon while in water, their summons aren't "in water"
- handle loading a save file where the player has not spawned in yet.  see 87374022
- Hide disconnected players in game screen but not in the lobby
- Fix: should not broadcast latency warning for a message that fails with a rejected promise
- Add blood_archer.gif for explain
- If you try to join a multiplayer game in two tabs on the same browser you get an infinite spinner even tho there is an error in console
- archer still had freeze modifier listed in tooltip even after the freeze disappeared naturally on the next turn
    - freeze is behaving weird in Russell's playtest, it's not ticking down as it should
        - maybe it has to do with it being triggered off of chain? he also had bloat on
- **critical** miniboss vampire was able to move without playing walking animation during the ranged unit turn phase and then continue walking on his own

- push + radius*2 + connect + damage isn't damaging the connected units (note, the pushed unit ends up in lava)
    - This is because the unit died when it fell in the lava so connect didn't connect it to other living units
- (e) fix save/load  from menu screen, it needs to change the gameview
- (e) in multiplayer, when one player leaves and window is not focused the camera spazzes out
---
- sync issue: golem moving through frozen guys jumped back
- (m) You're able to cast into negative mana in multiplayer
- "All targets" copy is confusing if player doesn't understand targeting
- Find a way to make randomness fixed (like in spell "Displace" so that it doesn't get different random results on other people's screens and so that it wont change after another player casts)
- This save file is giving me critical errors `saveFile-with-errors.json`
- (h) Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
- (h) sometimes when you walk you get stuck on a wall and it wastes stamina
- (h) bug: In multiplayer: target similar, damage x3 on 2 draggers made their position go to null null
- (h) done?: melee prediction is still off
    - simplest solution is just to make sure that units cannot do damage to the player if they aren't warning of damage incoming on the start of the turn
- h: bug: saw +0 mana when he tried to mana steal from me; desync bug; i moved when he cast.
    - this is a race condition because I'm still able to move freely after his cast triggers
- resurrect should take longer to return to base mana
    - this already is set but it didn't work in brad's playtest... hmm..
- he can't spawn in while i'm casing a spell
    - same thing with casts, it waits
- futher investigate '  // Override ref since in prediction it makes a copy of the unit' from 06d754d2
- Turn phase testing:
    - if one player is portaled and the remaining player dies it should go to the next level
    - if no players are portaled and all players die and there are no ally npcs it should go to game over
    - if no players are portaled and all players die and there ARE npc allies it should run turn phases for NPCS
        - if NPC_ALLYs succeed it should go to next level
        - if NPC_Allys do not it should go to end game
- investigate: `// TODO will the stack just keep growing`
    - turn_phases should work on a queue not a stack (this is mostly relevant for singleplayer and when the NPCs are just hashing it out cause all the players are dead so it doesn't stack overflow)
    - Just make it a while loop that triggers/awaits the next AI turn until it's the players tuurn
- dragger x and y went to null after "target similar, slash slash"
# Pre playtest
- Multiplayer voting
- Adaptive difficulty
- What to do with disconnected players when it goes to the next level?
- Fix rejoining hack where people can just rejoin if they're dead to come back
# Localization
- All tooltip info
- Explain prompts - see stash "add i18n to explain prompts"
# Features
- Need a restart screen after a team wipe
- should allow spell prediction even while an action is taking place - this not being here causes friction in multiplayer
- EZ self cast, like alt clicking a spell self casts or something
- **important**Allow multiplayer game restart after wipe
    - All players return to lobby after 10 seconds
    - cleans up underworld
    - Currently it just lets you exit to main menu but if you rejoin the game it still exists with everyone dead in it
- how to show how much damage a queued spell will do
- cooldown instead of mana multiplier scaling
- Add cooldown to "Expanding"
## Prediction issues
- prediction should factor in standing on pickups, see video
# Content
- Make Youtube short audio louder
- SFX for when you pickup scroll
- Rend
    - new sfx
- Bleed
    - new sfx
- Suffocate
    - new sfx
# Optimization
- Optimize: targeting spells seem pretty slow in prediction
- optimize: Ihave duplicate units, pickups, and doodads in save due to serailizeForSaving having them in the underworld and extracting them to the top level too

## Stretch Content
- Target all (corpse, unit, or pickup based on first selection - but it also targets you)
- summon spells
- unlimited range (also target yourself)
- blood archer - fires 3 times (at different enemies if available)
- perk: increase attack range - cut health in half
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
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther