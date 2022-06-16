
## Tasks
- Move health bars up and under feet circle down now that scale is bigger
- Solve Ghoast walls, keep wall images separate from ground, make wall images taller and don't use anchor, just offset by 32,32.  Layer them top to bottom and I wont have ghost wall issues
- Thursday 
    - **Address disappearing walls (green wall line segments)**
    - Get rid of artifact (super small squares in pathing mesh)
    - Bug: I killed a unit, it instantly teleported me to the new level and left an explode on death subsprite behind, it also stops their death animation part way
        - Fix findValidSpawn, no longer works since I removed inverted polygons
    - Bug: Grunts on level 4 of 0.7771387726829492 have attention marker when they definitely wont hit me next turn
    - Bug: Found a unit with no health but was animating idle, froze half way through death animation
    - Bug: I lost my robe color after taking damage
    - Bug: I got `unit.animations` is undefined and it got stuck on player 2s turn during single player:
```export function returnToDefaultSprite(unit) {
  if (unit.image) {
    if (unit.alive) {
      const sprite = addPixiSprite(unit.animations.idle, containerUnits);
      Image.changeSprite(unit.image, sprite);
    } else {
    }
  }
}```
    
- More
    - Solve for syncronize interrupting / resetting animations
        - Maybe use a state machine
        - TODO: Better solution for syncronizing unit animation state when doing network syncronization.  Refactor returnToDefaultSprite
    - Organize candidates for sfx
    - Bug: When trap triggers, spell effect is left behind as unit keeps moving through it
    - Content: AOE clone should work for pickups
    - Bug: Clone doesn't show cloned units until they move cause they spawn right on top of each other
    - Bug: clear tooltip on enter portal?? not sure if necessary, tooltip remained while I was manually calling initLevel
    - Bug: When you pull a guy and he actually gets to you, and then you move, you "carry" him
    - Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
---
- (M) ART TASK: Add wall sides to ground tiles images that are below ghost walls
- More player colors
- Allow pickups to be stored in inventory
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
- Bug: Portal spawns when you prediction kill yourself on test level
------
- Show modifiers in UI somehow, not just on player, especially when you have the modifier on you
- Bug: There was a bug that ended my game though. I got shield buffed by a resurrected priest, and my character disappeared. this all happened on the turn when the portal appeared (finished the level). Now I cant walk through the portal
I'm getting the empty stamina message when I try to move my (invisible) player
i can still cast spells during my turn; as well as end turns
- Content: Spell that increases cast range, or upgrade
- Content: Time crystal releases something when it breaks

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




## More content
- An enemy that consumes allies to get stronger
- Specific barriers or walls that can't be cast through
- Content: A spell to destroy corpses