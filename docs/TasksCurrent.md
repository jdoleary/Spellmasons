# Priority
- bug: I heard priest cast but he didn't (he was out of range of the corse)
    - priest shows that it will attack even when it's out of range
- Make status page for app running headless server so I can tell how many users are connected, etc and historical info

# To be Triaged
- IMPORTANT: The "push" from the bloat explosion seems to be causing a location desync
    - This is because the push happens onDeath event and that's not awaited.
    - To reproduce, queue up a Bloat + slash to kill an enemy with another in the blast radius and end your turn before the spell has finished animating
- bug: loaded from quicksave in multiplayer and got "CAnnot choose upgrade, from player is undefined"
    - This is because save doesn't yet work in multiplayer
- Ghost archer doesn't come closer??
- Make summoner summon units to random places
- poisoner moves too close instead of casting
- Potential issue when both players are alt-tabbed and server restarts, the chrome one got the disconnected message but the other was on the "resume" menu screen and when I resumed it's stuck because it has the old game data but the server restarted (chrome player started a new game of the same name), and so firefox player has old game state and also cannot ready up because they are already in game.
- Retro playthrough:
    - font it too small on cards
    - last will didn't work when he was near water 5:35
    - got 2 spells instead of 1
    - improve the UI
    - rarity label is missing on cards now
    - push push dash combo is weird
    - connect push to self is not obvious what it does, same with connect swap
    - idea for coop: classes so some wizards can specialize
    - bug: music is only coming out of the left ear??
    - "target cone" lock on is an issue when targeting self unintentionally
    - "protection" should work for enemies casters such as poisoner and priestb
# Tasks
- Game is too easy right now, I think due to the perks
- Need something to protect like the towers in into the breach, something to draw you out and make you take risks
- Way to control Ally faction units, like follow me. Or go get them.
- is burst too cheap??
- Don't change music until the biome changes
- fix slow copy "maxStamina"
- Add game log so you can both resume games and see your previous progress
    - Stats: object
    - Duration 
    - Victory
    - Kills
    - Resume?
- Server Browser
- Pushing an enemyh into lava (and they die) then casting connect on them won't connect to other living enemies
- Make magic color and robe color separately customizable
- verify `UI zoom` restored from settings in electron app (due to 63643c06)
- How to visually stack modifiers such as blood_curse and debilitate
    - On hover?
- Invent new loop biomes by colorizing old biome tiles for looping
# Bugs / Cleaning
- IMPORTANT: HOW DOES DIFFICULTY SCALE WITH A TON OF PLAYERS
- IMPORTANT: Fix music only coming out of one channel
    - itshallnotfindme sounds soft in the right ear
- lava abyss color is off
- blood golem / blood archer / green glop / ghost archer / sand vamp explain is a broken image
    - but ghost archer does show up locally
- If an enemy lines up perfectly with another and the direction it's going it can push the enemy.  Try to set up a ranged unit that pushes a melee unit closer and see if the melee unit hits you
- even in singleplayer you can go negative mana if you queue it up while another spell is casting (and you still have the mana from before the current spell takes it)
- bug: by alt-tabbing during enemy turn they didn't move visually.  Then when I came back and ended my turn again they slid to where they would've been had they moved during their turn (without animate walking) and then walked another turn's distance and bit me without warning
- bug: Prediction is wrong for potions dropped by last will because in non prediction is waits a moment before dropping them
- bug: Player on firefox is missing gold circle after death
- bug: when one player went into a portal and the other had already ended their turn and the left over player died from ai (portal was spawned via admin menu), it correctly went to the next level but it generated 2 levels (skipping right to level 3)
- pieUrl is stored wrong in browser search bar so if you copy it after connecting it'd double encoded
- res markers don't show if the unit is alive but will be killed and then resurrected
- **critical** vamp miniboss got stuck where he has stamina and a path (with no points), but wont move; i think it's because i summoned an archer and the archer was part way in liquid but didn't show it and so he didn't have a path to the archer
- Fix: should not broadcast latency warning for a message that failsc with a rejected promise
- archer still had freeze modifier listed in tooltip even after the freeze disappeared naturally on the next turn
    - freeze is behaving weird in Russell's playtest, it's not ticking down as it should
        - maybe it has to do with it being triggered off of chain? he also had bloat on
- **critical** miniboss vampire was able to move without playing walking animation during the ranged unit turn phase and then continue walking on his own
- **important** push + radius*2 + connect + damage isn't damaging the connected units (note, the pushed unit ends up in lava)
    - This is because the unit died when it fell in the lava so connect didn't connect it to other living units
- sync issue: golem moving through frozen guys jumped back
- (m) You're able to cast into negative mana in multiplayer
- "All targets" copy is confusing if player doesn't understand targeting
- Find a way to make randomness fixed (like in spell "Displace" so that it doesn't get different random results on other people's screens and so that it wont change after another player casts)
- This save file is giving me critical errors `saveFile-with-errors.json`
- (h) Sometimes it tries to path around things and wastes stamina if there isn't a straight line path
- (h) sometimes when you walk you get stuck on a wall and it wastes stamina
- (h) bug: In multiplayer: target similar, damage x3 on 2 draggers made their position go to null null
- h: bug: saw +0 mana when he tried to mana steal from me; desync bug; i moved when he cast.
    - this is a race condition because I'm still able to move freely after his cast triggers
- Multiplayer: other players can't spawn in while another player is casing a spell
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

# Localization
- All tooltip info
- Spell descriptions
- Explain prompts - see stash "add i18n to explain prompts"
- i18n: Press 'z' to make camera follow you
# Features
- should allow spell prediction even while an action is taking place - this not being here causes friction in multiplayer
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
- Spell: "Target Nearby" - Like what stomp used to be
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
    - Or just spells that travel in the direction you send them
- A way to "sell spells to get to choose a new one"
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
- Russell Boss idea:
```
hrm, ok here's a WILD idea. how about a non-moving boss that has a number of "tentacles" or some other non-moving bits around the map that you have to take care of before you can hit the boss?
say like stationary spawning towers that spawn a dude every few turns
i feel like a good final boss will bring a new mechanic to the game
or maybe the separate tendrils give the boss different abilities each turn like self-casting heal or protection, having additional damage, having additional cast range, multi-attack, etc 
so "hey let's kill the 'heal' tendril first!" "no! we have to get rid of the summon ones before we're overrun!"
and i still like the idea of some spell cards or upgrade cards being "locked" until you achieve something in a run to unlock them
i'm thinking of mechanics from like Slay the Spire here
did you have a spell book from the main menu to show all available spells?
also not related but it would be nice to be able to click enemies during the "pick your starting spot" time for when you can't remember the difference between a poisoner and a puller or the different archers
but overall a boss with multiple "stages" or "parts" would be cool
```
- Boss:
    - maybe the boss could have multiple phases
    - Russell: A good boss introduces a new mechanic
    - Maybe casts whatever spells you cast back at you? Jakes idea

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