### 2022-04-05
- Help them understand insufficient mana better
- Add end turn "card"
- revisit: 2e6c3218dd1608d45ad8a4551c13eda2ac2e3f2e 
    - maybe there's a better way to do it

### 2022-04-01 Brad/Jake playtest
- Jake: Either line of sight for preset range for spells.
- In spell projection, if you're doing enough damage to kill, show it visually
    - also show if it will "dust" someone
- Songs should all be same volume
- Continuing in the direction you clicked to move (automove)
- Desyncs:
    - Desync occurred while I was alt tabbed
    - Desync caused turns to get messed up (it just didn't update the top bar)
    - Somehow Jake started the game while Brad was still looking at upgrades and it showed the game behind
        - AND it went back to the previous level with the dead mobs still there
        - could this be due to desync messages? Since the route is part of underworld, it may have overridden the other client
- Jake: visual indicator to remind him that he can move. His mouse doesn't have presence
- "auto next level" if there's nothing left to do
- Jake: "Feels like mouse isn't in the game"
- Clone disconnected units can move around as AI but still show as disconnected
- Jake: needs unit collision
- Show in UI how much mana you get per turn
- Explain how vampires work on the card
- Brad: Alternate who goes first
- Brad: Was moving super fast somehow (after swapping?); everyone is fast
    - enjoys the movement speed being faster

### 2022-03-31
- Solve for spawning mid game, including cloning (how to prevent spawning in a no walk zone)
    - Handle when there aren't enough spaces to spawn for players more gracefully
    - ~~How to init players that join mid game?~~
    - Why can't a player that joins mid game see disconnected players?
## Tasks
- Bug: You can still select enemies and things with a spell up if the spell's left click doesn't cast the spell (such as AOE then nothing)
- Character select: "waiting  for other players"
---
- Bug: You can swap into obstacles
- Dad:
    - Missing spell projection overlay
    - He got right click and left click mixed up
    - Doesn't know what the circle means when clicking on enemies
    - Don't let me put more cards down than i can afford

Finish Content:
- More spells:
    - More types of damage cards, maybe with more synergies
        - Like ones that interact with freeze
    - Haste modifier lets you move farther and slow
    - Spells that summon walls or pillars to prevent enemy movement (maybe to trap them)
    - Push spells (requires collisions)
        - If you push a unit into a portal they appear in the next level
    - Fix charge, stomp, lance
        - Movement spells could help you cast farther than you should be able to and move a far unit into another group and chain them, cause it should keep the target after they move
    - soul swap (swap bodies with another unit, until they die, then you return to your own body - and you get their abilities as cards)
    - Jake Ideas:
        - Magnetize (pull enemies together)
        - Reflect
        - Putting spells on the ground. DOTs, AOE fields
        - Debuffs
        - Explosive on an enemy and when he dies it procs
        - Jake: 'yoink' takes a card from another unit
- Jake overall thoughts:
    - Let players pick from 3 starting cards so run is always different
    - Different ways of doing damage
- Jake: What if there's a random encounter on some levels where it's a card forge
    - In between levels choose "get a new card" or "upgrade a card"
- Brad: opportunity to make spells more powerful
- Brad: I wish you could take goons with you
    - What if allies just come with you to next level
        - would have to disable summoner after all mobs die