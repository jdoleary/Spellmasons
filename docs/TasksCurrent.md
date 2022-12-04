- wsPie: isolate errors that occur in a given room to that room, ensure that if one room crashees it won't cause others to lock up
    - see 4c56954a for example of error that could crash room
- UX: Zoom in is faster than zoom out
- Bug: When I quit it prompted brad to pick new spells
- make music play in menu

- build: remove unneeded nuget package from build output?
- Uncommon cards are showing up on level 1 when you don't have near the mana to cast them
- make build and test steam cloud saves and new install directory
---
- Build: Log to local file
- Nice camera
    - exciting akira moment
- Make gameplay video with Brad, add it to Steam and YouTube
    - Bugs
    - Send out Demo
- Rethink next trailer
    - Lead with "fun"
    - Remove "dead time"
    - get into the action fast
    - Communicate the big idea
# Nov Week 5 / Dec Week 1
    - Add explain gifs for new units
    - Test Cloud Saves
    - Steam SDK
        - Default wizard name to steam name if connected to steam
        - Steam Achievements
            - https://github.com/node-ffi/node-ffi
            - https://partner.steamgames.com/doc/features/achievements/ach_guide
        - User id should match steam id?
    - Add sentry errors to electron node files
# Bugs / Cleaning
- pieUrl is stored wrong in browser search bar so if you copy it after connecting it'd double encoded
- target cone doesn't draw a circle around the first guy
- during cinematic introduction your health bars remain from the last level
- res markers don't show if the unit is alive but will be killed and then resurrected
- **critical** vamp miniboss got stuck where he has stamina and a path (with no points), but wont move; i think it's because i summoned an archer and the archer was part way in liquid but didn't show it and so he didn't have a path to the archer
- handle loading a save file where the player has not spawned in yet.  see 87374022
- Hide disconnected players in game screen but not in the lobby
- Fix: should not broadcast latency warning for a message that fails with a rejected promise
- If you try to join a multiplayer game in two tabs on the same browser you get an infinite spinner even tho there is an error in console
- archer still had freeze modifier listed in tooltip even after the freeze disappeared naturally on the next turn
    - freeze is behaving weird in Russell's playtest, it's not ticking down as it should
        - maybe it has to do with it being triggered off of chain? he also had bloat on
- **critical** miniboss vampire was able to move without playing walking animation during the ranged unit turn phase and then continue walking on his own

- **important** push + radius*2 + connect + damage isn't damaging the connected units (note, the pushed unit ends up in lava)
    - This is because the unit died when it fell in the lava so connect didn't connect it to other living units
---
- (e) in multiplayer, when one player leaves and window is not focused the camera spazzes out
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
- A way to "sell spells to get to choose a new one"
- Need a restart screen after a team wipe on multiplayer
- should allow spell prediction even while an action is taking place - this not being here causes friction in multiplayer
- **important**Allow multiplayer game restart after wipe
    - All players return to lobby after 10 seconds
    - cleans up underworld
    - Currently it just lets you exit to main menu but if you rejoin the game it still exists with everyone dead in it
- how to show how much damage a queued spell will do
- cooldown instead of mana multiplier scaling
- Add cooldown to "Expanding"
## Prediction issues
- prediction should factor in standing on pickups
    - this can be reproduced by standing on health pot and queuing up just enough slash spells to kill you and triggering it.  You will see that it predicts that you will die but you don't because as soon as you first take damage the health pot triggers
# Content
- Make Youtube short audio louder
# Optimization
- Optimize: targeting spells seem pretty slow in prediction
- optimize: Ihave duplicate units, pickups, and doodads in save due to serailizeForSaving having them in the underworld and extracting them to the top level too

## Stretch Content
- Trap Soul / Capture: Instantly traps an enemy's soul in your possesion removing them from the board.  When you release their soul they are restored to their last form but on your faction.  Requires low health to work.
- Mind Control: Changes the faction of an enemy
- **contender** Content: "Orge" enemies that get stronger for every ally of theirs that dies
- **contender** Idea: A spell to sacrifice ally unit immediately
- **contender** destroy a corpse for mana
- **contender** grow a barrier
- **contender** Feature: "Soul bind" - bound units share applied effects (or maybe just damage)
- **contender** set fires on board that spreads that does damage on turn start if you're standing near
---
- juice: ultra badass spell should put in wide-screen black bars and take over the camera
    - and he could crouch and gather enegery
- unlimited range (also target yourself)
- Idea: "oh shit button": double the amount of mana you have this level but it reduces by half next level. " Break glass in case of emergency. Deal with the devil
- Idea: Amplify spell: makes "multicast"
- Add `cooldown` to spells rather than expense scaling
    - Add a spell that resets cooldowns
    - Add a curse that increases cooldowns
- h: "Heat seeking" enemy or spell
- idea: spell that triggers onDeath effects "Playdead"
- Liquid: blood could apply a curse when you fall in, like slowed movement
- I need better targeting spells
    - Target by proximity with no limit?
        - Quantum link
- thought: Spellmasons should have some element of risk/reward like 50% chance to double damage of next spell or something like that.  Think of my experience with slice and dice where I got a dice side that did 24 damage and affected the guy below.  If you could always have that it's no fun, too easy but because you can only sometimes get it when you're lucky is what makes it exciting.
    - also one-use spells could work well
- add ghost archer
- confuse spell
- what attributes of a spell could be modified by other cards?
    - already: targets, quantity
    - new: radius, amount
- Feature: perks
- perk: long range cast only
- perk: Swap your max health and max mana
- Idea: "overwatch" where some archers can shoot even not on their turn if you walk in their LOS
- Content: Time crystal releases something when it breaks
- An enemy that consumes allies to get stronger
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome
- Card: An attack range minimum but not a maximum so you CAN"T attack if they are too close
- idea: summoner spells like elden ring
    - they split your stats
- enemy that debuffs blessings
- "heat seaking" missle unit, explodes on contact
- Card: Mind Control (changes faction temporarily)
- A spell that saves 40% of your current mana for next turn
- A spell where you can save some of your health, mana, stamina in a potion
- What if monsters that go through portal come to next level with you, but you don't get more mana after the portal spawns
- totems
- auras
- ricotche
- task: Spell to trade mana for stamina
- eagle eye
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