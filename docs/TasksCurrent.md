## Schedule
- Pack 2
    - Prevent hang on await
    - Bug: I pushed a unit into lava and the game is hanging on an await
    - **critical** Brad's game got stuck on Message Type 9 Couldn't pick an upgrade
        - Develop a way of better logging where it's hanging
    - Could use Promise.race and a timeout wrapper as a bandaid to make sure game never hangs and reports where it would have
- Pack 3
    - The great refactor
        - Group topics in folders: audio, graphics, gamelogic, etc
            - cleanly separated
        - Add window.headless
- Pack 4
    - **critical** Figure out how to broadcast player movement (due to the new system) to multiple clients
    - Server should be able to send syncs that will wait to execute until turn changes so it doesn't interrupt animations and mess up the state when it syncs
    - Add "preparing" animation used to reduce desyncs due to network latency, so that if multiple users are casting spells at the same time, the wizard bending down to "charge" as soon as the current user clicks, masks a delay to make sure it doesn't conflict with other spells.  It'll send the spell over the network as soon as the user clicks but waits to cast it so that there aren't conflicting spells making desyncs on multiple clients.
- Pack 5
    - Fix: bad-pathing.mkv in videos folder
        - seed: 0.6450583331398443
    - cloned self doesn't show magic animation when they cast
    - priest is attacking /dealing damage to him but he's not a vamp. how?
    - can't drag spell from book to toolbar if it's already in toolbar
- Pack 6
    - Standalone Server
        - Decouple the various layers (data: underworld; networking: pie; visual: Pixi / DOM; audio)
            - Then improve syncing strategy between the data layer and the visual layer.  This will be useful for network syncs, saves and loads, standalone headless server.
                - It should also solve the disappearing subsprite bug and the wizard robes changing color bug.
            - In order to decouple, each should have imports only in one file that can be dependency injected.  So ALL pie stuff goes through the networking layer, all DOM stuff goes through the UI layer, all PIXI (including PixiUtils which is how a lot of the files interact with PIXI) stuff goes through the pixi layer.  This should make it easy to make a headless server or make tests that use a data-only underworld
- Pack 7
    - Unit Crowding
        - `// TODO: Temp removed aliveNPCs because moveWithCollisions doesn't consider them yet`
    - casting non-curses like heal or purify on self should show green, not red
    - pathfinding for vampires broken?
    - Priest "run away" ai is broken / Archer pursue ai is not working well


- Pack 8
    - all SFX
        - all spells
        - Fall in lava
        - use potion
        - die
    - Master Music


- Ordered next tasks
    - Steam Page
    - Trailer
    - Marketing
## Bugs
- Pack 7: Dad Loch playtest
    - (resolved?) Make health and mana go full when portal spawns so users aren't tempted to collect potions meaninglessly
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
- Bug: (Note: this is probably fixed now) Goons spawned outside of map when summoner was stuffed in upper left corner of map
---
## Features
- Archers on level 2 have more health than archers on level 1
    - This is because unit strength gradually increases, how to communicate this?
- Change contageous so it only spreads curses once instead of permanently?
    - This would solve the "infinite freeze" issue
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
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses
- task: Spell to trade mana for stamina
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome

## Misc
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- **critical** Improve sending castCards with targeting based on id not position
- (wont do?) Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- fix grey ellipse positioning under lobber, it's too low