## Current Priorities
- Bug: Summoner was hiding under portal - confusing
- Bug: Protection removes the target but not the drawn line with chain
- Bug: Chain targets dead units
- Bug: Animated sprite caused a dead unit to appear alive.  It was a skeleton for a moment but switched back - maybe mid attack
- Bug: Chain showed up in upgrades when I already had it.  This is because I got it through a pickup so it wasn't listed in the upgrades array
- Bug: Stuck on AI turn after archers killed resurrected grunt
- Brad feedback: change inspect mode to work on click
    - Combine planning view and updateTooltipContent on click like brad suggested
    - Bug: Mob tooltip doesn't update when their health changes until you move your mouse 
- Cards become more expensive when you use them
- Balance mana
  - To make this challenging, players should often be on the verge of no mana, it should feel scarce so they have to pick carefully what spells they want to use.
    - Maybe the answer to this is to make spells more expensive every time you use them
- Playtest
## Small Content Changes
- Spell: Burn mana / Steal mana
- Swap should only swap with targets, it shouldn't allow arbitrary teleportation
- swapping with portal shouldn't make user portal
- Spells that summon walls or pillars to prevent enemy movement (maybe to trap them)
## Large Changes
- (M) Push spells
  - Depends on: Collision task
  - Rework movement spells such as charge, stomp, lance
