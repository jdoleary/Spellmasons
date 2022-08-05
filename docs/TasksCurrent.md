## Today
- Music volume resets with level change
- Decoy and clone should stay expensive for longer
- sfx way too loud
- esc should toggle you out of menu
- res multiple targets should all happen at once
- make bloat stackable
- blood splatter when grunts & archers do damage
- heal effect should happen mid animation keyframe
- multiple heals should happen faster, just do a "4x" floating text
    - multiple heals too slow
- decrease trap turn limit, and show mana cost changes
- grunt animation keyframe when damaging
- update vampire copy
## Tasks
- Brad feedback 2022-08-04
    - game crashed with adjoin pull!
    - decoy didn't trigger bloat
    - freeze should shield damage?
        - if frozen unit takes damage it restarts animation
    - targeting mishap, see video
    - clones exploding without bloat modifier, it's like they kept the event somehow
    - looping death animation bug
    - adjoining + push locks up the game
        - multiple push wile push is already going
        - pull alone also lagged it out
        - protect against infinite w/ force move prediction
    - upgrade where you gives omethng up to gain something
    - bloodcurse is removed due to end level but blood curse w/ health upgrade shows wrong healthmax
    - delay should support quantity
    - decoy should be immune to blood curse?, or should show it?
    - 10th toolbar space isn't filling up when you get a new spell?
- bloat explosion didn't push mana potion but it predicted that it would
- push predicted taht a lobber would fall in lava and die but it didn't
    - that same lobber when resurrected just crawled over lava so it must've been inside but just didn't take the damage
- push, bload, expand, hurt suprisingly damaged me when i clicked on an enemy near me, i think it's cause it both expanded the enemy's radius and where i clicked
- pull doesn't trigger fallInLava, i pulled a unit right through lava
- archer movement got stuck which made me lose a game 0.3199228271451904
- bug: when i quit a game and start over it gives me the resurrect optoin
- Ensure hurt is presented in first spell picks
- Stop targeting flickering
- Grunt pre3diction circle should be attack range + move range
- see cantwalk.png on desktop
- bug: explosion radius text and some move lines left on the screen after cast was done
- bug: Pushing spike into grunt pushed the grunt instead of damaging him and the spike disappeared
- game slows down when there's a lot of blood on the screen and it's painint more
## Path to Trailer-ready alpha
- task: Move prediction pickups and units to underworld not global or else they will be shared between multiple underworlds
- environment looks off because wall depth shows into the grey
- Finish standalone server
## Standalone server backlog bugs
- Ensure standalone server doesn't bother running predictions
    - Unless the predictions determine their attacks from "perfect predictions" branch
- It's running hot for some reason
- multiplayer, player doesn't play hit animation when a grunt bites it
- Game waits a long time after last player has ended their turn before moving on to enemy turn
- headless server runs loop quickly when it has nothing to do (after i make a change and the clients are connecting in the other os window's space)
- is init_game_state being invoked more than once for player 2
- Fix: Move player so it doesn't use stamina because IT MUST bring them to a synced location if their position somehow get's out of sync
    - Desync: Due to the stamina issue I had one player in a different spot on one screen, then when he cast push and pushed a grunt into lava the grunt only moved and died on one screen and syncUnits didn't correct it somehow
- bug: player 2 doesn't get cards
    - C:\git\Golems\headless-server-build\src\entity\Unit.js:847
        const { turn_phase: phase } = globalThis.underworld;
                            ^

    TypeError: Cannot destructure property 'turn_phase' of 'globalThis.underworld' as it is undefined.
        at Object.isUnitsTurnPhase (C:\git\Golems\headless-server-build\src\entity\Unit.js:847:25)
        at value (C:\git\Golems\headless-server-build\src\Underworld.js:324:85)
        at Timeout._onTimeout (C:\git\Golems\headless-server-build\src\Shims.js:19:22)
        at listOnTimeout (node:internal/timers:559:17)
        at processTimers (node:internal/timers:502:7)
    - lobby
        - ready up and start game
## Schedule
- Increase animation framerates per Che's comment

- Pack 16 | Colin Feedback
    - explain that you can cast any number of times per turn
    - Make spell pickups more obvious
    - label: bloat visual circle "explosion radius"
    - copy: "poison is stackable"
    - explain: remember, vampiree takes heals as pure damage
    - vampire had attack icon while in lava but next turn got out of the lava and didn't attack
    - attack badges block health sometimes
    - self heal should predict in your health bar
    - label out of range circle (think aoe), on hover
    - hoisting might not be desireable, what if you want to push then AOE?
    - Colin Direct Feedback:
        - some enemies chould shoot walls to blow yoru cover
        - me: maps are too big
        - add moodiness, make it darker
        - balance danger:
            - Minus archers
            - Plus others
        - pickup potions
        - Accidentally spending movement, wants key to see path
        - fun figuring out mechanics
        - felt like rinse and repeat
        - new to genre
        - QWERTASDFG for hotkeys
        - More exciting if archers had a % chance based on distance
        - physics based env:
            - drop corpse in lave and have it shoot out lava
            - bloat gore schrapnel
                - gore ended up on other characters
                - gore on them from being next to explosion
                - gore on walls, leave a mark
                    - blood trail
        - fog of war
        - what if no agro until you got close so you can't just wait for them all to come to you
        - archer arroes hurt allies as it passes through. % chance. multiple types of archers
- Pack 12
    - Particle engine
        - add pixelated filter, see stash
        - OR use a pixelated source image instead of a pixelated filter
        - It's the framerate that makes it jarring
    - animated trim path line for archers so it's obvious they'll hit you
- Pack 6
    - Standalone Server
        - Add "preparing" animation used to reduce desyncs due to network latency, so that if multiple users are casting spells at the same time, the wizard bending down to "charge" as soon as the current user clicks, masks a delay to make sure it doesn't conflict with other spells.  It'll send the spell over the network as soon as the user clicks but waits to cast it so that there aren't conflicting spells making desyncs on multiple clients.
        - Server should be able to send syncs that will wait to execute until turn changes so it doesn't interrupt animations and mess up the state when it syncs
---
- Write down Brad's feedback here
    - it should be clear that it rolls spells after you pick
    - auto card pickup on portal spawn is not great, should be explained-
    - 'Adjoining' is confusing
    - Trap pickup radius is too big, you can't squeeze by it (spikes and trap?)
    - make decoy more expensive (last more than 1 turn)
    - bug: double pull through lava fails
    - chain through pickups?
    - should take damage at the END of every turn if still in lava
    - lobber image is positioned too high for "feet" position to feel right
    - Super poor performance on brad's laptop on level 7
    - "Esc" should close inv
    - What happens if you spawn decoy out of bounds
    (if the OOB is in the center of the map, see video)

- Brad feedback
    - I need a way to see my cast range when planning out my movement
    - Add a glow on hover to spells in spellbook
    - Ambiance, particles around the map
    - environment looks off because wall depth shows into the grey
    - precast animations, when you hover over a corpse with resurrect, white particles should come up from the ground
    - bug: resurrect leaves dangling Images behind
    - clone animation: soul stretches out of them and makes the clone


- Pack 9 | R, J & E feedback
    - No stamina bar after portal
    - Freeze spell should stop timer on pickups (or just increase it by 1)
    - Hover should always show tooltip so you can see even when spell is queued
    - Bug: decoy died and archer changed targets, make units commit to a target at the beginning of the round, else PLAYER FRUSTRATION
    - shield should have number on it
    - Poison prediction is confusing
    - ideas
        - Have push and pull from the start
        - objects to hide behind (raise earth)
        - More objects to interact with
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
- death skull doens't show for decoy
- Own health bar prediction doesn't work
- Pack 7: Dad Loch playtest
    - Explain to user with popups
        - Introduce card pickup
        - explain manaburn better
    - AI should avoid traps when moving
    - should "explode" be able to stack?
    - decoy should pull agro even if farther away?
    - Flag things visually as modifiers (loch says explode is confusing)
    - death circle can be confusing when moved out of the way of the toolbar (add arrow?)
    - Introduce mana cost changing of cards when used
    - error: cannot animation a still image (explode-on-death.png)
---
- Make combo wait for full completion so it doesn't change sprite to idle after resolving.
    - This makes it so that when casting two spells in quick succession, the second attack animation gets overridden by returningToDefaultSprite
- How to keep syncronize from interrupting an animation while it's running
    - Hold on to syncronize messages until a good time to execute them
- (resolved?) Pathing is broken sometimes where a unit moves a little and then no further
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
## UI
- death skull due to poison is confusing
- Draw walls above units so their corpses don't render over top of the walls
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing
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


## Misc
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- fix grey ellipse positioning under lobber, it's too low