## Critical tasks
Brad Playtest:
- Brad somehow disconnected and rejoined as a new user without the old user disconnecting.
    - [Maybe try to associate IP address with clientId?](https://stackoverflow.com/questions/14822708/how-to-get-client-ip-address-with-websocket-websockets-ws-library-in-node-js)
- Number of pickups should increase per number of sectors
- Portal didn't appear once (honeycomb seems broken if you have walls above and below you)
- Goons spawned outside of map when summoner was stuffed in upper left corner of map
- Need to Optimize, it got very laggy for him
- TODO: Unit.syncronize should sync modifier images such as frozen or heavy armor

---
- More random generation / better maps.  This isn't a rogue-like without the random element
    - Take queues from slay the spire
    - Sectors could have optional elements
    - Sectors could fit together using WFC instead of just being picked by random
- Rename 'dryRun' to prediction, since it will actually execute logic (on a copy of units - dryRunUnits), it just doesn't want anything to show on screen.

## Tasks

- Allys shouldn't push player units
- Player units are rendering under skeleton
- Update mana steal tooltip (remove cost portion since it updates when you cast)
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