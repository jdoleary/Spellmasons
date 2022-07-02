## Schedule
- Today
    - Out of range sometimes shows when it shouldn't
    - fix grey ellipse positioning under lobber
    - Didn't show unit die in lava
    - trap image is broken
- 2022.07.04
    - Standalone Server
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
- Playtest with Colin
- How to show targeting: https://photos.google.com/photo/AF1QipNRQYCeW85Yokd11e4YA9nyjhu7WD3qt1CAmvZh?
- Standalone Server
    - Decouple the various layers (data: underworld; networking: pie; visual: Pixi / DOM; audio)
        - Then improve syncing strategy between the data layer and the visual layer.  This will be useful for network syncs, saves and loads, standalone headless server.
            - It should also solve the disappearing subsprite bug and the wizard robes changing color bug.
        - In order to decouple, each should have imports only in one file that can be dependency injected.  So ALL pie stuff goes through the networking layer, all DOM stuff goes through the UI layer, all PIXI (including PixiUtils which is how a lot of the files interact with PIXI) stuff goes through the pixi layer.  This should make it easy to make a headless server or make tests that use a data-only underworld

## Bugs

- How to keep syncronize from interrupting an animation while it's running
- Pathing is broken sometimes where a unit moves a little and then no further
- enter, enter doesn't make "are you sure" prompt go away when there are no enemies.
- Priest "run away" ai is broken
- wall: see abberant-wall.png
- Bug: Portal spawns when you prediction kill yourself on test level
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: (Note: this is probably fixed now) Goons spawned outside of map when summoner was stuffed in upper left corner of map
---
## Features
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
---