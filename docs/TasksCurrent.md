## Critical tasks
- 'contageous' is now broken due to running spells ondryRunUnits every frame
    - You can see this in action if you cast 'shield' AND 'poison' on one unit
- Fix multiplayer auto join
- Better map generation
- Rename 'dryRun' to prediction, since it will actually execute logic (on a copy of units - dryRunUnits), it just doesn't want anything to show on screen.

## Tasks

- Upgradable spells like hurt2
- Spells that move units around
- Spell that summons blocker
---
- Use middle mouse button drag to move camera
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing

- Bug: Can go negative mana if you cast too quickly
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- TODO: Unit.syncronize should sync modifier images such as frozen or heavy armor
- Improve sending castCards with targeting based on id not position
- Make loading screen
- Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- Fix multiplayer
    - What about if host disconnects mid step?
- Make freeze block pathing

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip