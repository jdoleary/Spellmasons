# Todo

- Allow some spells, like charge and swap, just interact with initial target?
- Idea: A discard card that discards the following cards cast and gets you new cards

- Question for Brad: Should Protection protect any single ally? So that it can work for both players if you stack it?
  - stash: "protection stackable"
- Question for Brad: Do you like charge and should it trigger pickups when it moves you?
  - Bug: Charge doesn't play well with AOE
- Bug: Swapping with the portal while there was an enemy behind it swapped but made me disappear without triggering end of level (even though inPortal is true)
  - Entering the portal doens't currently end my turn because movement does, and if you don't swap into the portal you have to move into it
  - Maybe since there are more movement spells now, move spelling into the portal should end your turn.
- Fixed?: We had some 3 disconnected players, brad killed me, destroyed my corpse and entered the portal and it entered an infinte loop
- Protection doesn't SHOW target being removed because target drawing is additive right now
- Bug-ish: If you cast, "AOE, damage, protection" it will damage you before the protection removes the target, but Spell Projection doesn't show that

---

## Tasks

- Fix swap
  - bug: chain swapping didn't move me, this occurs when the chain retarget's self
  - Swapping doesn't work with cards, the player picks them up
- Add obstacles to spell effect? So freeze can freeze lava?

## Brad 2021.04.05

- Freezing lava should let you walk over it (casts should work on obstacles)

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds

## Features

- Units dropped into lava should die
- freezing pickup should make it not-pickupable while it's frozen??
- task: Push should push away from the target area regardless of how many targets there are
