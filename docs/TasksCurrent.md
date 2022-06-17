## Tasks
Erin Playtest:
- When a trap triggers, it should pause unit movement
- "f" view for spells has broken css
- Right click on toolbar spell when spells are queued up highlights them all, should just highlight on toolbar
- clicking even when out of range should cast at end of range (especially with AOE). Think convenience.  When players view the aoe circle they assume this is where it will cast when they click
- shield stacks too much from priest and is annoying (don't let priests heal each other or themselves)
- death skull due to poison is confusing
- Priest "run away" ai is broken
- why does some loop 1 archers have 8 health, not showing armor?
- clear spell projection when you die
---
- task: Tweak pathing to be able to walk through 'walkThisGap.png' on desktop
- ui: I accidentally moved while trying to interact with my spells on my toolbar
- UI: Allow swapping spells on toolbar
- bug: Already dead units "redied" via animation when damage was done to their corpse via an explosion
- bug: poison subsprite is gone after one turn
- Add loading screen for when level is generating
- Fix Polygon2 tests
- Draw walls above units so their corpses don't render over top of the walls
    - Update email to Che?
- More
    - Bug: When trap triggers, spell effect is left behind as unit keeps moving through it
    - Bug: clear tooltip on enter portal?? not sure if necessary, tooltip remained while I was manually calling initLevel
    - Bug: When you pull a guy and he actually gets to you, and then you move, you "carry" him
    - Task: An ally that has died at all (even if ressed) should lose their upgrade priviledge
---
- Bug: I killed a unit, it instantly teleported me to the new level
- Bug: Grunts on level 4 of 0.7771387726829492 have attention marker when they definitely wont hit me next turn
- Bug: I lost my robe color after taking damage
- SOUND: Organize candidates for sfx
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
- task: Spell to trade mana for stamina
- idea; one use bargains (deals with the devil) that mix up your max stats.  or have a50% chance of good or bad outcome