- player unit's position seems to be rounding to whole number on server
- new networked trigger pickup makes a unit pushed into a trap have the trap
  trigger immediately instead of when they touch it on multiplayer only
- a bunch of errors:
  `wsPie Error: Cannot send data to room, not currently connected to web socket server`
  when the server disconnects but the player does not
- chain choice can be messed up because a recursive chain could see only a unit
  of another kind as an option where there are other options available earlier
  in the recursion
- post on itch.io
- Plan modding
- Demo
- look into Russian Ruble price discrepancy
- More requests for hotseat multiplayer
- idea: Change name color
- last will + clone allows infinite mana
- mana refunded but not really (see MacgyverTheDiver's video on discord)
- unreproduced: dash to scroll in lava didn't hurt player but they still got the
  scroll
- when you have all spells you stop getting perks?
- Connect is targeting self when there is another enemy available, see Reyna's
  picture in #general
- left off at "(sorry for my bad english i'm french) if you skip your turn
  before placing your character it will do the mob turn and after some skip you
  will die.")
- Add Amsterdam server after you fix multiplayer
- Deleted saves get restored (maybe because of duplicate names?)
- Experienced the following bugs in multiplayer both local and on the community
  server: Enemies would sometimes revive if killed, seems to do it consistent if
  hit with the bleed attack, if you somehow disconnect there is no way to
  reconnect and the runs has been lost. At last this isn’t a bug, but at the
  current state focusing hp is too powerful and will make you able to one turn
  every level (targets spell + manasteal)
- hotbar rebinding doesn't reflect in the UI

- ## i18n / copy:
  - "suffocated!"
  - fortify: add "for one turn"

## Unanswered questions:

- How is it possible that the particle emitters didn't get cleaned up? How did
  castCards not finissh??

## Validation for 1.1.0

- Validate "how to host your own server" button link works

# Community ideas:

- Reyna: Would really appreciate the capability of viewing the map while picking
  a spell, maybe just minimizing the selector until I'm sure what will be able
  to help
- J'in: Suggestion: when losing a run, return to lobby instead of leaving game
- WellaWeiss — Today at 3:11 AM Really liking the game as well, can definitely
  agree with those suggestions, I also wish the we could directly control
  summons
- icecloud12: I think we need more spells that interupts enemies

## Notify people when languages get finalized:

- Japanese
  - @Char_841 via twitter

## outstanding small bugs

- multiplayer bug it was hard to get in and a portal and an image of one of us
  sspawned outside the map
- if an arrow kills a unit and you don't move your curser and it had an
  attention marker it will still have an attention marker until you move your
  cursor
  - this is just with arrow
- forcePush gets an extra false line if pushing into water

## Brad Playtest

He doesn’t think saving a loading is a good idea Overflow health is buggy? It
said he had health but he died unexpectedly After randoming he got 3 spell
choices again. “Pick your second spell” Text overflow on capture soul and plus
radius Advice: how do Pokémon cards work. Could represent damage or other info
differently Disable Ctrl zoom Test on 4k or 8k monitor Font size at 1024x768 is
too small Changing resolution permanently makes text smaller Stamina doesn’t
restore properly after a load Add visual or audio effect when perk procs Archer
pathing is messed up when there are walls in between Perks should show in your
spell book Killing himself, with no enemies, live, and an ally sent him two
levels ahead After casting a spell that kills himself and res himself in the
same spell, he has been able to go massively negative mana “Pick a
spell/upgrade”/“choose a place to spawn” isn’t translated Perks aren’t
translated

- UX: doesn't like the cinematic

---

## Brad playtest

- he moved and sync died issue at the beginning
- decoy spell copy overflows on small resolution
- some spells are lowercase in player tooltip
- if you die to poison "your turn" + "you died" overlap
- poisoner miniboss should do more quantity when poisoning
- displace desync - cast on wrong guy??
  - he was right next to him
- too many dark summoners
- bossmason purifying himself doesn't remove the animated poison
  - Server issue??
- resurrected sand vamp still had poison animation
- bossmason particles should go out when he dies

---

- add mana refunds for more spells (like slash)

---

    - plus radius overflows on 1920 x 1080 resolution full screen
    - Improve difficulty scaling with over 4 players
    - Check volume defaults
    - test all spells on multiplayer
    - bug: player 2 doesn't get cinematic
    - "waiting" book comes out too early

## 2023.01.11

- bug: Got "you cannot move while casting" but I was able to move anyway
- mention c.a.geary1@gmail.com in comments if he helps with copy

# Desired Schedule

- Bossmason is missing explain gif
- Restore dragger behavior? watch out for sync issues
- word wrap on spells that are too long looks off
- January 1/8-1/14
  - Test on different resolutions
  - Menu: Fix overflow for all pages rather than the one-off fixes I've been
    doing.
  - Add refunds to as many spells as possible if they have no effect
- January 1/22-1/28
  - Prepare to ship
    - [Release Demo](https://partner.steamgames.com/doc/store/application/demos)
    - Accessability / Localization Language Support / Spellcheck
    - Establish Minimum System Requirements and update Steam Page
    - Add sentry errors to electron node files
    - Achievements?
    - Accessability option to make text more readable
  - Final QA
    - Manually test all spells for desync issues (in multiplayer)
    - Test for desyncs on multiplayer
    - Bulletproof Updating and Error Reporting
- Other
  - 2nd algorithm for generating levels
    - see branch 2nd-level-algorithm
  - [Submit demo to IGN](https://corp.ign.com/submit-a-game)

---

- **Important** How close am I to 5mb limit for save files? what to do if I go
  over?
- menu: Skip tutorial button in settings doesn't go away once clicked
- (fixed?) early levels are too big, later levels are too small
- fix hover styling for perk reroll button
- single player game overscreen should offer to restart at checkpoint
- music is too soft relative to sfx
- Brad playtest
  - blood golem too powerful? shouldn't be able to do kill damage? or introduce
    later
  - explain graphic for summoner icon
  - debilitate cheaper and less effective
  - Easy to not grow your max mana, maybe get some by default each level? (and
    for health)
  - maybe perks should do concrete amounts instead of %s
  - weird line coming off of units that you pull into liquid on death
  - turn off target snapping when your first spell is a targeting spell for
    convenience
  - spellbook animation is showing up in singleplayer
    - but you still need it when you yourself are casting multiple at once
  - levels can be way too big
  - leaderboard
  - maybe target circle should makes the spells that come after it tick up in
    how long they have to restore
  - it is unclear which spells have what cooldowns
  - **important** AOE should have max targets just like "Connect"
  - increase radius for connect and fix faction targeting so it doesn't hit you

- 80% mana at the start of a level perk is too much

# Priority

- summoner too much health?
- bug: Card copy text overflow
- multi url was saved
  weird:`http://localhost:3000/?pieUrl=ws%3Alocalhost%3A8080&game=a`
- bug: if I start a game, quit to main menu, go back to multiplayer I can't edit
  the server url field, until I alt tab and come back
- What happens if you press multiplayer 'connect' twice while it's still
  connecting
- bug: vampire stopped moving after being pushed
  - after being pushed hard into a corner
- (fixed?) bug: server freaks out after players leave (when they're dead)
  - somehow got inconsistent maps; one client must've been holding on to an
    instance

# To be Triaged

- UI bug: toolbar is jumping around when you hover spell in toolbar
- missing decoy gif
- There should be 2-3 spots where no enemies are allowed to spawn,
  - end game maps are too crowded
- Remove "update" code in golems-menu
- bug: loaded from quicksave in multiplayer and got "CAnnot choose upgrade, from
  player is undefined"
  - This is because save doesn't yet work in multiplayer
- Potential issue when both players are alt-tabbed and server restarts, the
  chrome one got the disconnected message but the other was on the "resume" menu
  screen and when I resumed it's stuck because it has the old game data but the
  server restarted (chrome player started a new game of the same name), and so
  firefox player has old game state and also cannot ready up because they are
  already in game.
- Retro playthrough:
  - font it too small on cards
  - last will didn't work when he was near water 5:35
  - got 2 spells instead of 1
  - connect push to self is not obvious what it does, same with connect swap
  - idea for coop: classes so some wizards can specialize
  - "protection" should work for enemies casters such as poisoner and priestb
- May have prediction errors with ranged units since they don't use
  canAttackTarget in their action(). See ac2c0b1f for more. For now, we're safe
  since ranged units only ever move OR attack not both.

# Tasks

- Need something to protect like the towers in into the breach, something to
  draw you out and make you take risks
- is burst too cheap??
- Don't change music until the biome changes
- fix slow copy "maxStamina"
- Server Browser
- Make magic color and robe color separately customizable
- verify `UI zoom` restored from settings in electron app (due to 63643c06)
- Invent new loop biomes by colorizing old biome tiles for looping

# Bugs / Cleaning

- bug: Getting "host app version doesn't match client version" on SOLOMODE
- arrow spell always shoots towards the center of the unit that it's going to
  hit which can look odd visually if you are targeting multiple units and one is
  in the way and intercepts it
- UI: health bars render over player thought
- save file truncates if it contains '-'
- bug: by alt-tabbing during enemy turn they didn't move visually. Then when I
  came back and ended my turn again they slid to where they would've been had
  they moved during their turn (without animate walking) and then walked another
  turn's distance and bit me without warning
- bug: Prediction is wrong for potions dropped by last will because in non
  prediction is waits a moment before dropping them
- **important** bug: when one player went into a portal and the other had
  already ended their turn and the left over player died from ai (portal was
  spawned via admin menu), it correctly went to the next level but it generated
  2 levels (skipping right to level 3)
- pieUrl is stored wrong in browser search bar so if you copy it after
  connecting it'd double encoded
- **critical** vamp miniboss got stuck where he has stamina and a path (with no
  points), but wont move; i think it's because i summoned an archer and the
  archer was part way in liquid but didn't show it and so he didn't have a path
  to the archer
- Fix: should not broadcast latency warning for a message that failsc with a
  rejected promise
- archer still had freeze modifier listed in tooltip even after the freeze
  disappeared naturally on the next turn
  - freeze is behaving weird in Russell's playtest, it's not ticking down as it
    should
    - maybe it has to do with it being triggered off of chain? he also had bloat
      on
- **critical** miniboss vampire was able to move without playing walking
  animation during the ranged unit turn phase and then continue walking on his
  own
- **important** push + radius*2 + connect + damage isn't damaging the connected
  units (note, the pushed unit ends up in lava)
  - This is because the unit died when it fell in the lava so connect didn't
    connect it to other living units
- sync issue: golem moving through frozen guys jumped back
- "All targets" copy is confusing if player doesn't understand targeting
- (h) Sometimes it tries to path around things and wastes stamina if there isn't
  a straight line path
- (h) sometimes when you walk you get stuck on a wall and it wastes stamina
- **important** bug: saw +0 mana when he tried to mana steal from me; desync
  bug; i moved when he cast.
  - this is a race condition because I'm still able to move freely after his
    cast triggers
  - how to solve desyncs when allies move while you're casting
- Multiplayer: other players can't spawn in while another player is casing a
  spell
  - same thing with casts, it waits
- futher investigate ' // Override ref since in prediction it makes a copy of
  the unit' from 06d754d2
- Turn phase testing:
  - if one player is portaled and the remaining player dies it should go to the
    next level
  - if no players are portaled and all players die and there are no ally npcs it
    should go to game over
  - if no players are portaled and all players die and there ARE npc allies it
    should run turn phases for NPCS
    - if NPC_ALLYs succeed it should go to next level
    - if NPC_Allys do not it should go to end game

## Prediction issues

- prediction should factor in standing on pickups
  - this can be reproduced by standing on health pot and queuing up just enough
    slash spells to kill you and triggering it. You will see that it predicts
    that you will die but you don't because as soon as you first take damage the
    health pot triggers

# Optimization

- optimize: Ihave duplicate units, pickups, and doodads in save due to
  serailizeForSaving having them in the underworld and extracting them to the
  top level too

## Stretch Content

- More Upgrades
  - Modify enemies or global stats
  - Modify cards themselves, just like how cards have the optional add() and
    remove() functions, they could also have a level up function.
- hotseat multiplayer
- content: Heat seeking skull with particle effects behind it. You release it
  and it seeks out the nearest enemy to deal damage
- AI Enhancement: Solve many enemies overkilling allied unit
- Daily challenge
- Idea: way to sacrifice health or mana to your ally
- Content: Add Copy Soul vs capture soul. Capture soul should let you spawn them
  for no mana cost but they need to be below 25% health to be captured. Copy
  Soul gives you the summon card.
- Refactor Bolt to "Soul Bind"
- Magic arrow spell (travels out of range, like ghost arrow)
  - idea: trigger the spell on line segment intersection (throw the spell)
- Make "Destroy Corpse" spell which will be useful for dealing with priests
- Trap Soul / Capture: Instantly traps an enemy's soul in your possesion
  removing them from the board. When you release their soul they are restored to
  their last form but on your faction. Requires low health to work.
- Mind Control: Changes the faction of an enemy
- **contender** Content: "Orge" enemies that get stronger for every ally of
  theirs that dies
- **contender** Idea: A spell to sacrifice ally unit immediately
- **contender** destroy a corpse for mana
- **contender** grow a barrier
- **contender** Feature: "Soul bind" - bound units share applied effects (or
  maybe just damage)
- **contender** set fires on board that spreads that does damage on turn start
  if you're standing near
- Spell: "Target Nearby" - Like what stomp used to be
- juice: ultra badass spell should put in wide-screen black bars and take over
  the camera
  - and he could crouch and gather enegery
- unlimited range (also target yourself)
- Idea: "oh shit button": double the amount of mana you have this level but it
  reduces by half next level. " Break glass in case of emergency. Deal with the
  devil
- Idea: Amplify spell: makes "multicast"
- Add `cooldown` to spells rather than expense scaling
  - Add a spell that resets cooldowns
  - Add a curse that increases cooldowns
- h: "Heat seeking" enemy or spell
- idea: spell that triggers onDeath effects "Playdead"
- Liquid: blood could apply a curse when you fall in, like slowed movement
- thought: Spellmasons should have some element of risk/reward like 50% chance
  to double damage of next spell or something like that. Think of my experience
  with slice and dice where I got a dice side that did 24 damage and affected
  the guy below. If you could always have that it's no fun, too easy but because
  you can only sometimes get it when you're lucky is what makes it exciting.
  - also one-use spells could work well
- confuse spell
- what attributes of a spell could be modified by other cards?
  - already: targets, quantity
  - new: radius, amount
- perk: long range cast only
- perk: Swap your max health and max mana
- Idea: "overwatch" where some archers can shoot even not on their turn if you
  walk in their LOS
- Content: Time crystal releases something when it breaks
- An enemy that consumes allies to get stronger
- idea; one use bargains (deals with the devil) that mix up your max stats. or
  have a50% chance of good or bad outcome
- Card: An attack range minimum but not a maximum so you CAN"T attack if they
  are too close
- enemy that debuffs blessings
- "heat seaking" missle unit, explodes on contact
- Card: Mind Control (changes faction temporarily)
- A spell that saves 40% of your current mana for next turn (added to
  spreadsheet)
- A spell where you can save some of your health, mana, stamina in a potion
- What if monsters that go through portal come to next level with you, but you
  don't get more mana after the portal spawns
- totems
- auras
- ricotche
- task: Spell to trade mana for stamina
- eagle eye
- Tornado: Travells through the map throwing things around (maybe a good enemy
  ability)
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

- if you choose a spawn position while another player is casting it waits and
  then spawns where you clicked, which can be confusing because it still looks
  like you can choose where to spawn
- if you can MOVE_PLAYER while a super long cast is being triggered.
  - you cannot, find a way to handle this for multiplayer so it's communicated
    that you have to wait to cast until someone else has finished casting
  - IMPORTANT: Change the store description:
    `Spellmasons uses innovative faction-based turns: You and your fellow mages can all move, cast and act simultaneously.`
    if needed
- If player joins mid enemy movement it will force reset them
  - this is still an issue: as of 2022-09-16

## Misc

- **critical** Improve sending castCards with targeting based on id not position
- Unit movement desync occurred between clients when one client has CPU
  throttled, the non throttled client has the unit move much farther

# Stretch Tasks

- Post game stats! (requested)
- Achievements
- Mods
- Make pickups do something when destroyed
  - Refactor arrow.ts to use getPotentialTargets instead of just
    underworld.units and unitsPrediction or else it will never strike pickups
- Server config by host (pvp, worms armageddon style customizations)
- Pushing units into portal should do something
- Protection should be able to be cast on dead units to keep priest from
  resurrecting them
- [Mod support](https://partner.steamgames.com/doc/features/workshop)
- Server customization (like Worms Armageddon)
  - Turn time
  - Pvp mode (more factions)
- Perks | "upgrades" with some random attributes | The more dimentions you add
  the better!
  - % chance to get more stamina on level start
  - % chance to start level with mob on your faction
  - % chance that casting wont consume mana
  - % chance to freeze on damage
  - one time: 50/50 chance to incrase max stat or decrease it
  - make 1 random spell permanently more expensive and another permanently
    cheaper
  - Skill tree
  - Critical chances
  - Time challenges - beat the level in less than 3 turns
  - Make wagers - risk / reward
    - even with the difficulty of the next level
  - pseudo class system
  - item that makes your stronger but it randomizes your spawn
