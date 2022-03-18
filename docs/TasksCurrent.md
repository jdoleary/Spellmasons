## Current Priorities
- Remove overworld, make level initialization work for multi players
    - TODO: Fix level loading, make more stable
    - bug: if the not host chooses a character they get sent into the game and enemy units are invisible and then the sprites duplicate whenever they move
    - Handle
        - client joins before host has made game
        - client joins after host has made game

- Bug: Got insufficient mana when trying to cast on a unit at the edge of my range even though the tooltip showed that I had enough
- Bug: I got poisoned when I cast contageous poison but wasn't close
- Bug: Units that died of poison didn't leave behind skelletons
- Bug: When I was on edge of inverted poly, the pathfinding moved me to the vertex instead of away from the wall where i clicked
- Bug: Mana steal costs mana, it shouldn't!!
- Bug: I don't think priest AI works
- Bug: desync, when a second player joins AFTEr the first is already in, somehow the first recieves an INIT_GAME_STATE and there is a desync
- todo: Make "mana cost" icon on cards allow for health cost (for spells such as mana steal)
- Todo: Increase damage from mana burn to make it worth it's cost
- Ensure that casting spends mana immediately so that you can mana burn AOE and it won't hurt you if invoking the burn spent the mana before you could burn your own mana
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