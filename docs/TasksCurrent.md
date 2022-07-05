## Schedule
- Next
    - bug: critical: Casting on self causes infinite recursion and kills self even if you only cast with one hurt
    - Controls could show on escape menu instead of always
    - Prevent hang on await
    - Philosophy
        - Make "rules for copy"
            1. Does the word suggest more than what really happens. (ex: bite != damage)
            2. Numbers are meaningless, use percentages instead. (ex: "Increase cast range by 10%")
        - Explain everything, use popups more than once with a "do not show again" button
    - Allow casting no target spells (like decoy) at end of range instead of saying "out of range"
    - Restore planning view graphics for force move spells
    - improve withinCameraBounds when accounting for toolbar
    - Add "modifier" label to spells that are modifiers like "explode / bloat" and blue outline


    - Add 'loading' after clicking `join game`
    - The great refactor
        - Group topics in folders: audio, graphics, gamelogic, etc
            - cleanly separated
        - Add window.headless
    - **critical** Brad's game got stuck on Message Type 9 Couldn't pick an upgrade
        - Develop a way of better logging where it's hanging
    - Could use Promise.race and a timeout wrapper as a bandaid to make sure game never hangs and reports where it would have
- 2022.07.04
    - Standalone Server
    - Server should be able to send syncs that will wait to execute until turn changes so it doesn't interrupt animations and mess up the state when it syncs
    - Add "preparing" animation used to reduce desyncs due to network latency, so that if multiple users are casting spells at the same time, the wizard bending down to "charge" as soon as the current user clicks, masks a delay to make sure it doesn't conflict with other spells.  It'll send the spell over the network as soon as the user clicks but waits to cast it so that there aren't conflicting spells making desyncs on multiple clients.
- 2022.07.05
    - Unit Crowding
    - Tell Che to separate walls from floor in new biomes
- Ordered next tasks
    - all SFX
        - all spells
        - Fall in lava
        - use potion
        - die
    - Master Music
    - Steam Page
    - Trailer
    - Marketing
## Focus
- Loch feedback:
    - Readd cast range circle when you select yoruseelf and **label it**
    - Move card so people don't accidentally right click and move into an enemy.
    - Show all the places you could move by sample size.
- Make predictions consider the effect of forceMove, like `push, AOE` should show the prediction circle in the end location of the push
- This game will live or die on the reviews, make sure (like rustlang) that everything is explained well.
- Playtest with Colin
- How to show targeting: https://photos.google.com/photo/AF1QipNRQYCeW85Yokd11e4YA9nyjhu7WD3qt1CAmvZh?
- Standalone Server
    - Decouple the various layers (data: underworld; networking: pie; visual: Pixi / DOM; audio)
        - Then improve syncing strategy between the data layer and the visual layer.  This will be useful for network syncs, saves and loads, standalone headless server.
            - It should also solve the disappearing subsprite bug and the wizard robes changing color bug.
        - In order to decouple, each should have imports only in one file that can be dependency injected.  So ALL pie stuff goes through the networking layer, all DOM stuff goes through the UI layer, all PIXI (including PixiUtils which is how a lot of the files interact with PIXI) stuff goes through the pixi layer.  This should make it easy to make a headless server or make tests that use a data-only underworld

## Bugs
---
- Brad Feedback
    - cloned self doesn't show magic animation when they cast
    - priest is attacking /dealing damage to him but he's not a vamp. how?
    - can't drag spell from book to toolbar if it's already in toolbar
---
- Dad Loch playtest
    - Make health and mana go full when portal spawns so users aren't tempted to collect potions meaninglessly
    - Introduce card pickup
    - explain manaburn better
    - AI should avoid traps when moving
    - allow changing path if you click again while moving to cancel accidental movement
    - dad assumed vampire bite would deal damage
    - how to explain "+ cast range", units of measure no good.  Try percentage
    - Casting decoy should support using end of range but it says "out of range"
    - health bars should be same size regardless of zoom
    - should "explode" be able to stack?
        - Maybe rename to "burstable"?
    - decoy should look like delapadated version of you
    - decoy should pull agro even if farther away?
    - Flag things visually as modifiers (loch says explode is confusing)
    - casting non-curses like heal or purify on self should show green, not red
    - copy: priest "enemy" is confusing; say "vampires of different faction"
    - pathfinding for vampires broken?
    - health bars bigger and farther from their head
    - death circle can be confusing when moved out of the way of the toolbar (add arrow?)
    - Introduce mana cost changing of cards when used
    - error: cannot animation a still image (explode-on-death.png)
---
- Make combo wait for full completion so it doesn't change sprite to idle after resolving.
    - This makes it so that when casting two spells in quick succession, the second attack animation gets overridden by returningToDefaultSprite
- How to keep syncronize from interrupting an animation while it's running
    - Hold on to syncronize messages until a good time to execute them
- Pathing is broken sometimes where a unit moves a little and then no further
- enter, enter doesn't make "are you sure" prompt go away when there are no enemies.
- Priest "run away" ai is broken / Archer pursue ai is not working well
- wall: see abberant-wall.png
- Bug: Portal spawns when you prediction kill yourself on test level
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: (Note: this is probably fixed now) Goons spawned outside of map when summoner was stuffed in upper left corner of map
---
## Features
- Cannot be combined
    - Jump card- to jump over walls
    - card to temporarily increase cast range
- vortex card - to pull units in to a center location
- Use summoner magic animation for units that are summoned
- Standalone server
- What if potions drop from slain enemies?
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- SOUND: Organize candidates for sfx
- Allow pickups to be stored in inventory
- (M) Rework unit crowding (save for later, non priority)
- Show modifiers in UI somehow, not just on player, especially when you have the modifier on you
---
## UI
- death skull due to poison is confusing
- ui: I accidentally moved while trying to interact with my spells on my toolbar
- Draw walls above units so their corpses don't render over top of the walls
    - Update email to Che?
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing
---
## Stretch Content
- Content: Time crystal releases something when it breaks
- Content: An enemy that pulls you into danger
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses
- task: Spell to trade mana for stamina
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome
---

## Misc
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- Improve sending castCards with targeting based on id not position
- Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- fix grey ellipse positioning under lobber, it's too low