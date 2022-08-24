## Today
- SFX for spawn in animation
- res particles
- bug: Player appears dead when looking for spawn in location in multiplayer
- bug: Player that joins multiplayer doesn't see their own color

- perks
- Standalone server backlog
    - (fixed?) stand alone server goes into infinite loop when all players leave
    - When does stand alone server remove a room?
    - Test standalone server with friends

---
- sound effect lags for 'freeze'
- Add sounds for dragger death (poisoner alt)
- **important** For load, it doesn't call "add" on modifiers so if the modifier has any special init logic, it wont run, it just loads the modifier state (see poison for example)
- prediction was wrong where i had a bloat explode kill another guy with bloat and it showed the 2nd bloat would be at the end of the push but it was at the beginning
    -it's like the damage doesn't wait for push to be done so it triggers the bloat early
- archer chose me over decoy that was closer???
- when I, with 4 health, predict taking damage from two bloat explosions, I die but it only predicts -3 health

## Tuesday
- Big ideas:
    - Add rocks to block archers and deal damage when pushed
    - What if it's not a roguelike? What if it's more like WormsTD
        - I like roguelike for replayability but I find that the early game can be boring and there's not much variety.

## Tasks
- use card background for upgrades with different colors depending on rarity
- rework expand, it's predictions are often way off.  Maybe it would do better to just increase the radius of all spells?
- Spell Modifier effects visual representation
    - debilitate
    - blood curse
- TO VERIFY: bug: A player that died in liquid when the level goes next will still have liquid filter on them.
- bug: After i ended a level on a racetimeout push I got to choose WAY too many upgrade spells
- implement auto reconnect when `setView(View.Disconnected)`
- If player joins mid enemy movement it will force reset them
- liquid messed up; seed: 0.6404564349842206
- on refresh (with only 1 client in room) the server reseeded level but my position stayed the same
---
- movable barrier
- rework exp
- trap prediction bugs
- trap should be immovable
## Perfect prediction attacks
    - I got bit by a vampire but it didn't accurately warn me he would
        - wrap this in with preventing units from changing targets from their prediction even if the decoy dies (lobber move then throw?)
    - Resurrect icon didn't show in prediction when it was buried in a trap that I pushed someone into (in prediction)
    - Units should NEVER change target from their prediction. A case where this happened is when a decoy died from other units attacking it
    - Grunt attack predictions are not perfect. See branch 'perfect-predictions'
    - Known issues:
        - push predicted taht a lobber would fall in lava and die but it didn't
            - that same lobber when resurrected just crawled over lava so it must've been inside but just didn't take the damage
## Tasks
- fix hotkey for jprompt
- key 'z' is used both to hide hud AND to have camera follow player
- Brad feedback 2022-08-04
    - freeze should shield damage?
        - if frozen unit takes damage it restarts animation
    - targeting mishap, see video
    - clones exploding without bloat modifier, it's like they kept the event somehow
    - upgrade where you gives omethng up to gain something
    - 10th toolbar space isn't filling up when you get a new spell?
- bug: when i quit a game and start over it gives me the resurrect optoin
    - or it maintains some state, like all the spells in my inventory
- Ensure hurt is presented in first spell picks
- see cantwalk.png on desktop
- bug: explosion radius text and some move lines left on the screen after cast was done
- game slows down when there's a lot of blood on the screen and it's painint more
- How does endgame scale now that strength doesn't depend on the levelIndex?
## Standalone server backlog bugs
- Ensure standalone server doesn't bother running predictions
    - Unless the predictions determine their attacks from "perfect predictions" branch
- It's running hot for some reason
- Game waits a long time after last player has ended their turn before moving on to enemy turn
- headless server runs loop quickly when it has nothing to do (after i make a change and the clients are connecting in the other os window's space)
- is init_game_state being invoked more than once for player 2
- Fix: Move player so it doesn't use stamina because IT MUST bring them to a synced location if their position somehow get's out of sync
    - Desync: Due to the stamina issue I had one player in a different spot on one screen, then when he cast push and pushed a grunt into lava the grunt only moved and died on one screen and syncUnits didn't correct it somehow
## Schedule
- Pack 16 | Colin Feedback
    - explain that you can cast any number of times per turn
    - Make spell pickups more obvious
    - explain: remember, vampiree takes heals as pure damage
    - vampire had attack icon while in lava but next turn got out of the lava and didn't attack
    - attack badges block health sometimes
- animated trim path line for archers so it's obvious they'll hit you
- Write down Brad's feedback here
    - it should be clear that it rolls spells after you pick
    - Trap pickup radius is too big, you can't squeeze by it (spikes and trap?)
    - chain through pickups?
    - should take damage at the END of every turn if still in lava
    - Super poor performance on brad's laptop on level 7
        - double pull through lava make my computer's fan pickup

    - bug: resurrect leaves dangling Images behind
- Bug: decoy died and archer changed targets, make units commit to a target at the beginning of the round, else PLAYER FRUSTRATION
- Pack 10
    - Better timeout icon
        - Change timeout icon to red when 0 turns left?
    - Attention marker for timeout pickups (blue)
    - More ways to "draw you into danger"
        - maybe pickups are the only way to get more spells/stats (but you still get to choose) and they drop when you kill enemies
        - All multiplayer players get the drop when one picks it up
    - Spell choice should random spell rarity but then all the spells to choose from should have that rarity.  It's not a choice if there's an obvious right answer
    - what happens if you freeze liquid with a unit in it?
    - shield should be visible on health bar (it's just temporary health)
    - explain that portal cleanses all buffs and curses
- Pack 11:
    - Bug: Grunt walked towards liquid and just kept walking animation after it should've returned to idle. seed:0.8154642976606445
        - I think this happens when they attempt to move to a location that is ouside of the pathing bounds (like in between a pathing line segment and a wall line segment, so it's still ground but it's out of bounds)
    - UI Refactor
        - Prevent RMB movement when mouse is over toolbar
        - Disable RMB movement when upgrade screen is up
## Bugs
- Player robe colors are mixed up after refresh
- Handle error in menu when attempting to connect to a bad url
- Pack 7: Dad Loch playtest
    - Explain to user with popups
        - Introduce card pickup
        - explain manaburn better
    - AI should avoid traps when moving
    - decoy should pull agro even if farther away?
    - death circle can be confusing when moved out of the way of the toolbar (add arrow?)
    - Introduce mana cost changing of cards when used
- enter, enter doesn't make "are you sure" prompt go away when there are no enemies.
- wall: see abberant-wall.png
- Bug: Portal spawns when you prediction kill yourself on test level
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: RMB hold on toolbar moves character.  Be very careful when solving this to ensure you don't make clicks in the invisible part of UI elements no longer work
- Bug: If enemies take no action and you end your turn with the "are you sure" prompot, the prompt will layer

## Features
- whole bodies of liquid should be selectable so that they can be frozen
    - freezable liquid to walk over
- Upgrade: Start each level with 2x mana overfill (think of new upgrade "perks")
- Archers on level 2 have more health than archers on level 1
    - This is because unit strength gradually increases, how to communicate this?
- Use summoner magic animation for units that are summoned
- What if potions drop from slain enemies instead of being just pickups on the ground, it would be more exciting if you needed one and it dropped.
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- SOUND: Organize candidates for sfx
- Allow pickups to be stored in inventory
- Show modifiers in UI somehow, not just on player, especially when you have the modifier on you
## Stretch Content
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
- EXPLAIn that all modifiers are removed after each level