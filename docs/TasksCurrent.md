## Critical tasks
- TODO: Split up runPredictions so that it only checks canAttackTarget after units have moved, not every loop
    - Sync prediction units every loop is a waste too if nothing changes
        - This could be optimized so it only recalcs if a unit moves or if the cast target or cast cards change
---
- Logic to avoid fizzle spells
    - Don't cast res on no dead
    - do this by hoisting and checking pre-cast
---
- More random generation / better maps.  This isn't a rogue-like without the random element
    - Take queues from slay the spire
    - Sectors could have optional elements
    - Sectors could fit together using WFC instead of just being picked by random
    - Interesting Parts of levels
        - choke points
        - pickups
        - hiding places
        - 2 ways to get somewhere
        - traps that trigger things

## Tasks
- Enh: Pings should always be on screen like attention markers
- Pickup radius should be bigger
- Make void like water and outside like cave wall
- show drag handle on hover so it's not entire card (replace hotkey icon)
- Fix attention marker for melee
- Content: Night king boss
- Content: Time crystal releases something when it breaks
- Content: Summonable blockades
- Content: Trap card, reduces mana cost of spell
- Content: A spell to destroy corpses
- Bug: Resurrection icon doesn't show if you are resurrecting corpses that are already on your faction
- Bug: Grunt moved towards me on not his turn after I swapped with a guy near him. (they move after resurrect too, i think cause they get stamina)
- Bug: Due to stamina changes for AI, prediction is wrong with melee
- Bug: Pathing broken on seed 0.5727148663470687 
    - it ran into `Hit loopLimit for polygon processing.  May be an infinite loop or the polygon may just be too big.`
    - In this case it should just abort that level and try a new one
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: Dead player doesn't lose mana
- Enh: Looks like dragndrop is keeping dad from selecting a spell sometimes cause he moves the mouse before lifting it upn
- Bug: Portal didn't appear once (honeycomb seems broken if you have walls above and below you)
- Bug: Goons spawned outside of map when summoner was stuffed in upper left corner of map

- Allys shouldn't push player units
- Dead units don't lose poison
- "maximum shield" shows a bunch of times on hover if casting the spell would give them map
---
- Use middle mouse button drag to move camera
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing

- Bug: Can go negative mana if you cast too quickly
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- Improve sending castCards with targeting based on id not position
- Make loading screen
- Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- Fix multiplayer
    - What about if host disconnects mid step?
- Make freeze block pathing
    - Bug: Guy blocked by frozen unit still takes a bite out of me without moving closer

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing
- How to resurrect units you are standing on top of (blocking?)

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip

## More content
- Upgradable spells like hurt2
- Spells that move units around
- Spell that summons blocker
- Disincentivise hiding and casting
    - Maybe a spawn crystal that if you don't kill it, it'll spawn a bunch of bad guys
- An enemy that consumes allies to get stronger