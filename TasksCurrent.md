# Todo

- What if all players could take turns during the player turn phase? rather than once at a time

- Playtest with brad 2021.04.16
  - Possible AI unit coord desync with image after stepping on a corpse?
  - error `units/golem was unable to be set as sprite texture because the texture does not exist` after resurrect??
  - Bullshit experience, brad accidentally destroyed his corpse with a spell and tried to res but it didn't work, THEN brad couldn't res at end of level
  - After I disconnected, I closed my browser, rejoined, Brad's player was stuck between two cells and i joined as a new player instead of the old
  - We had some 3 disconnected players, brad killed me, destroyed my corpse and entered the portal and it entered an infinte loop

---

## Tasks

- Fix swap
  - bug: chain swapping didn't move me, this occurs when the chain retarget's self
- Add obstacles to spell effect? So freeze can freeze lava?
- What's to stop player from just bumming around to get extra cards?
  - Maybe only as long as there are enemies alive? Or set a hand max?

## Brad 2021.04.05

- Freezing lava should let you walk over it (casts should work on obstacles)
- keybinding common spells
- Holding down "z" should show safe squares to move to

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
- bug: When last player dies and there are no NPCs it enters infinite loop
  - bug: checkForEndOfLevel has infinite loop

## Features

- Units dropped into lava should die
- freezing pickup should make it not-pickupable while it's frozen??
- task: Push should push away from the target area regardless of how many targets there are
