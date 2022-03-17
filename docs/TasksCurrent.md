## Current Priorities
- bug: after portal sprite filter stops working??
- Fix turn taking / Pathfinding
    - **bug** Units right on an edge may path through obstacles
        - Handle start point that lies on edge of polygon
    - Handle invalid paths so unit x,y doesn't get set to NaN.
    - Resolve collisions?
        - Prevent units from moving inside of each other without the orbiting effect if their target destination is inside of the other unit
    - If you click to move inside of the expanded poly, it won't move you to that side of the obstacle (which isn't expanded, becuase it omits the last point that isn't in the poly)
- Make what's happening more obvious
- Make `chain` search depth first
- Add sound effects
- Add stina's first song

- ownCharacterMarker disappears after movement? or after sync?
- Setup Buffer with social medias and start a following
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