# Todo

- Playtest with brad 2021.04.15
  - Units don't path around frozen units
    - Should units path arround each other? Right now the pathing doesn't consider units as obstacles
  - enemies should not be able to be on the portal
  - wehn you choose ALL the spells in your hand, the active spell div shifts down because the card hand div is now empty

---

## Tasks

- after spells are done animating, check if it should show the spell projection again
- add unit description to tooltip
- make tooltip update constantly so it gets current health when it changes

- Fix swap
  - bug: chain swapping didn't move me, this occurs when the chain retarget's self
- Add obstacles to spell effect? So freeze can freeze lava?
- What's to stop player from just bumming around to get extra cards?
  - Maybe only as long as there are enemies alive? Or set a hand max?

## Brad 2021.04.05

- Freezing lava should let you walk over it (casts should work on obstacles)
- archer hit me after i portaled due to my locationzz
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
