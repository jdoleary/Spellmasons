# Todo

- make dead bodies walkable
- What about a prisoner AI that you can unleash, or traps that you can unlease in a line
- Playtest with brad 2021.04.16
  - We had some 3 disconnected players, brad killed me, destroyed my corpse and entered the portal and it entered an infinte loop
- When 1 player is disconnected and the other dies, it enters infinite loop
- Loading game doesn't remember unit scale
  - But only on refresh from 2nd player's client
- disconnected subsprite is not restored on load

---

## Tasks

- Fix swap
  - bug: chain swapping didn't move me, this occurs when the chain retarget's self
- Add obstacles to spell effect? So freeze can freeze lava?
- What's to stop player from just bumming around to get extra cards?
  - Maybe only as long as there are enemies alive? Or set a hand max?
  - Or just make sure the enemies are hard enough that killing time is dangerous, also since cards now reset between levels this may not be a problem

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
