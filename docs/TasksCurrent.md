### 2022-03-31
- Solve for spawning mid game, including cloning (how to prevent spawning in a no walk zone)
    - Support rejoining an existing game via pie
    - How to init players that join mid game?
    - Why can't a player that joins mid game see disconnected players?
## Critical Tasks
-
## Tasks
- Character select: "waiting  for other players"
- Better organization of function of routes and views and what happens when you change them, with docs
- Bug: "Cannot add client, client alreaedy in room" (maybe I was clicking too quickly??)
    - This is because both players are trying to join with the single player id of 1.
- Bug: AOE deduping removes a valid target if two units are too close to each other
- Task: Make contageous spread more obvious
---
- Client joins network with id of "1" if they've been playing singleplayer and have that id saved
- Bug: You can swap into obstacles
- Dad:
    - Missing spell projection overlay
    - He got right click and left click mixed up
    - Wants to know how far he's able to walk in one turn
    - Doesn't know what the circle means when clicking on enemies
    - Don't let me put more cards down than i can afford
- Brad:
    - How to communicatge the extra cost that distance adds to mana
- Notify when waiting for other players to pick a character, just like "x players left to pick upgrade

Finish Content:
- More spells:
    - Content: Add vampire modifier which reverses the effects of health and damage
    - Haste modifier lets you move farther and slow
    - Spells that summon walls or pillars to prevent enemy movement (maybe to trap them)
    - Push spells (requires collisions)
        - If you push a unit into a portal they appear in the next level
    - Fix charge, stomp, lance
        - Movement spells could help you cast farther than you should be able to and move a far unit into another group and chain them, cause it should keep the target after they move
    - A card that changes mana cost of spells to health cost (vampire)
    - soul swap (swap bodies with another unit, until they die, then you return to your own body - and you get their abilities as cards)
    - Jake Ideas:
        - Magnetize (pull enemies together)
        - Reflect
        - Putting spells on the ground. DOTs, AOE fields
        - Debuffs
        - Explosive on an enemy and when he dies it procs