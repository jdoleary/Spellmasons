
### 2022-04-01 Brad/Jake playtest
- Menu: 
    - Bug: you can end your turn while you're still moving
- Bug: Upgrade picker remained active with no cards in it, preventing me from clicking on the menu button which was behind it

- **Jake: Either line of sight for preset range for spells.**
    - Add Line of sight with spells
- pathing: If click inside poly try nearest corner as well as horizontal and vertical
- **In spell projection, if you're doing enough damage to kill, show it visually**
    - also show if it will "dust" someone
---
- Songs should all be same volume
- Bouncing spells?
- Continuing in the direction you clicked to move (automove)
- Desync occurred while I was alt tabbed
- Desync caused turns to get messed up (it just didn't update the top bar)
- Jake wants to right click to cancel spell chains
- Somehow Jake started the game while Brad was still looking at upgrades and it showed the game behind
    - AND it went back to the previous level with the dead mobs still there
- Jake: visual indicator to remind him that he can move. His mouse doesn't have presence
- "auto next level" if there's nothing left to do
- 1 player left to pick upgrades is showing while their in the level
- For walking, white dots along the path show you how many dots it'll take you to get there
- Jake: "Feels like mouse isn't in the game"
- Clone disconnected units can move around as AI but still show as disconnected
- Jake: needs unit collision
- Brad: Lots of "could not find player corresponding to player controlled unit" on mouse move
    - coming from updateTooltipcontent
- die(), addPixiSprite, cannot read properties of null reaeding "addChild"
- Show in UI how much mana you get per turn
- Jake: 'yoink' takes a card from another unit
- Jake: What if there's a random encounter on some levels where it's a card forge
    - In between levels choose "get a new card" or "upgrade a card"
- Brad: opportunity to make spells more powerful
- Brad: I wish you could take goons with you
    - What if allies just come with you to next level
        - would have to disable summoner after all mobs die
- Brad: Hard to tell who is you and who are your teammates
- Explain how vampires work on the card
- Brad: Alternate who goes first
- Jake overall thoughts:
    - Let players pick from 3 starting cards so run is always different
    - Different ways of doing damage
- Brad: Was moving super fast somehow (after swapping?); everyone is fast
    - enjoys the movement speed being faster
- Brad: Boss levels needed

### 2022-03-31
- Solve for spawning mid game, including cloning (how to prevent spawning in a no walk zone)
    - Handle when there aren't enough spaces to spawn for players more gracefully
    - ~~How to init players that join mid game?~~
    - Why can't a player that joins mid game see disconnected players?
## Critical Tasks
-
## Tasks
- When 'vampire' modifier is removed, it should remove the card 'bite' too.
    - Make adding and removing modifiers automatic, kind of like allUnits or source units.  When they are registered, their
    add and remove functions should be kept
- Bug: You can still select enemies and things with a spell up if the spell's left click doesn't cast the spell (such as AOE then nothing)
- Character select: "waiting  for other players"
---
- Bug: You can swap into obstacles
- Dad:
    - Missing spell projection overlay
    - He got right click and left click mixed up
    - Wants to know how far he's able to walk in one turn
    - Doesn't know what the circle means when clicking on enemies
    - Don't let me put more cards down than i can afford
- Brad:
    - How to communicatge the extra cost that distance adds to mana

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