## Today Tasks
- Movement spells should work on pickups
- Traps should be inactive for 1 turn
- "maximum shield" shows a bunch of times on hover if casting the spell would give them map
- Res should work if the click is on a living unit standing over a dead unit
## Stretch Tasks for Today

## Tasks
- Bug: Sometimes grunt animations just stop
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- Task: Better shaders for lava?
- **!**Fix host alt-tabbing issue
- Bug: Brad didn't get to choose upgrade
- Bug: When you pull a guy and he actually gets to you, and then you move, you "carry" him
- Chain is information overload
- Content: A spell to destroy corpses
- Content: Time crystal releases something when it breaks
- Fix: Decoy image doesn't always disappear when decoy dies
    - This may be fixed by d69a8a2
- Fix: Brad cast a spell out of range, but it still triggered on my screen
- Hoist spells
    - Logic to avoid fizzle spells
        - Don't cast res on no dead
        - do this by hoisting and checking pre-cast
        - How to resurrect units you are standing on top of (blocking?)
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

- Content: Night king boss
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
- Bug: Pathing broken on seed 0.5727148663470687 
    - it ran into `Hit loopLimit for polygon processing.  May be an infinite loop or the polygon may just be too big.`
    - In this case it should just abort that level and try a new one
- Bug: Should sync portals when syncing units if all enemies are dead
- Bug: Portal didn't appear once (honeycomb seems broken if you have walls above and below you)
- Bug: Goons spawned outside of map when summoner was stuffed in upper left corner of map

---
- Make damage that they WILL take different from damage that they HAVE taken.  It's confusing

- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- Improve sending castCards with targeting based on id not position
- Make loading screen
- Make an overlay screen that blocks interaction while waiting for sync
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another


## More content
- Get to choose first 3 spells
- Upgradable spells like hurt2
- Disincentivise hiding and casting
    - Maybe a spawn crystal that if you don't kill it, it'll spawn a bunch of bad guys
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through