## Focus
- Monday
    - **PRETRIP**Should be able to 'push' and 'pull' trap (TimeReleases are not affected by forceMoves or push and pull)
    - **PRETRIP**Priests should not heal ally vampires and should heal enemy vampires to damage them
    - **PRETRIP**Bug: There was a bug that ended my game though. I got shield buffed by a resurrected priest, and my character disappeared. this all happened on the turn when the portal appeared (finished the level). Now I cant walk through the portal. I'm getting the empty stamina message when I try to move my (invisible) player. i can still cast spells during my turn; as well as end turns
    - bug: poison subsprite is gone after one turn
    - Stretch: Standalone server
    - Remove Character Select View, it conflicts with loading when loading is done it gets set to game view right away

## Bugs

- Priest "run away" ai is broken
- Fix robe losing color 
- wall: see abberant-wall.png
- Bug: Grunts on level 4 of 0.7771387726829492 have attention marker when they definitely wont hit me next turn
- Fix Polygon2 tests
- Bug: Portal spawns when you prediction kill yourself on test level
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: (Note: this is probably fixed now) Goons spawned outside of map when summoner was stuffed in upper left corner of map
---
## Features
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