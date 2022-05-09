## Critical tasks
- Better map generation

## Tasks

- Upgradable spells like hurt2
- Spells that move units around
---
- Use middle mouse button drag to move camera
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing
- Lochlan feedback
    - Have to communicate cards getting more expensive better
    - Not enough cover to stay out of LOS of archer
    - Damage dropoff for range
    - Better archer AI, move to LOS but out of range of attack; optimal distance from character
    - Archers could have a minimal range so they can't "hip fire"
    - Special unit "marksman archers"
    - Spell to deflect projectiles to hostile targets nearby
    - Damage reduction, negation, absorbtion (anti-archer defense spells)
        - Think of faster than light or into the breach

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