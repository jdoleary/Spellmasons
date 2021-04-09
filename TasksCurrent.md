# Todo

- What's to stop player from just bumming around to get extra cards?

  - Maybe only as long as there are enemies alive? Or set a hand max?

- Implement purify
- Swapping should only work with a target, not an empty spell
- Make units clickable for information
  - Need way to count modifiers
- Units dropped into lava should die
- freezing pickup should make it not-pickupable while it's frozen??
- Balance: we got too many cards for the end to be challenging
- task: Push should push away from the target area regardless of how many targets there are
- task: Persist (save/load) (and allow for removing via purify) modifiers, work with poison and purify as examples
- bug: chain swapping didn't move me, this occurs when the chain retarget's self
- bug: When last player dies and there are no NPCs it enters infinite loop
  - bug: checkForEndOfLevel has infinite loop
- bug: turn time still ticks away during upgrade phase

## Brad 2021.04.05

- Every tile should be clickable and give a description
- Freezing lava should let you walk over it (casts should work on obstacles)
- archer hit me after i portaled due to my locationzz
- keybinding common spells
- Holding down "z" should show safe squares to move to

---

- let our faction go before enemy units go

- Add batching to card effects?

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds

## Features

- New enemies:
  - Enemy spellcasters that could poison YOU!
  - Enemy priest
