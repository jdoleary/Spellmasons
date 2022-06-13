
## Tasks

- Monday
    - Implement "mask" for being submerged in liquid
        - Reemove submerged shader
    - Adjust pathing mesh relative to liquid bounds and top and bottom walls.
    - Fix WFC so that there aren't weird wall alignments
        - You can do this easily with test level data
        - TODO: Better solution for syncronizing unit animation state when doing network syncronization.  Refactor returnToDefaultSprite
    - Solve for syncronize interrupting / resetting animations
        - Maybe use a state machine
    - Sync SFX to animations
- Tuesday
    - (M) Standalone server
        - Standalone headless server should be able to be proven out using unit tests
        - No Images, no SFX
        - It should probably just use a global variable that omits visuals
    - (M) Card Hand refactor
        - Replace "hand of cards" with diablo style toolbar (https://eu.diablo3.blizzard.com/static/images/game/guide/fundamentals/action-bar.jpg?v=58-137)
        - Right click to change (opens inventory)
---
- (H) Game Balance
- (M) SFX
- (M) Tutorial
- (M) Hoist spells?
- (M) Rework unit crowding (save for later, non priority)
- Clerical Stuff
    - (M) Menu
    - (M) Steam Page
    - (E) Website Presskit page
    - (E) Master music
- Bug: Portal spawns when you predition kill yourself on test level
------
- Bug: When trap triggers, spell effect is left behind as unit keeps moving through it
- Content: AOE clone should work for pickups
- Bug: Clone doesn't show cloned units until they move cause they spawn right on top of each other
- Bug: clear tooltip on enter portal?? not sure if necessary, tooltip remained while I was manually calling initLevel
- Show modifiers in UI somehow, not just on player, especially when you have the modifier on you
- Bug: There was a bug that ended my game though. I got shield buffed by a resurrected priest, and my character disappeared. this all happened on the turn when the portal appeared (finished the level). Now I cant walk through the portal
I'm getting the empty stamina message when I try to move my (invisible) player
i can still cast spells during my turn; as well as end turns
- Content: Spell that increases cast range, or upgrade
- Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
- Bug: When you pull a guy and he actually gets to you, and then you move, you "carry" him
- Content: Time crystal releases something when it breaks
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

- Content: An enemy that pulls you into danger
- Content: "Orge" enemies that get stronger for every ally of theirs that dies
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
- Upgradable spells like hurt2
- Disincentivise hiding and casting
    - Maybe a spawn crystal that if you don't kill it, it'll spawn a bunch of bad guys
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses