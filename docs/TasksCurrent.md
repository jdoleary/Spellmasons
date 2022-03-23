## Current Priorities
- Figure out how to host server locally to be reached via the internet
    - [dedicated server](https://help.steampowered.com/en/faqs/view/6F46-9698-9682-8DB8)

- Bug: Movement still stops early sometimes
- Bug: I got poisoned when I cast contageous poison but wasn't close
- Bug: Units that died of poison didn't leave behind skelletons (because they took damage again that destroyed the skelleton)
    - Task: Add bone dust pile that dead bodies turn into when hit.  No longer a unit (that can be interacted with), but still visible
- Bug: When I was on edge of inverted poly, the pathfinding moved me to the vertex instead of away from the wall where i clicked
- Bug: I don't think priest AI works
- todo: Make "mana cost" icon on cards allow for health cost (for spells such as mana steal)
    - Bug: Mana steal costs mana, it shouldn't!!
---
Finish Content:
- More spells:
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