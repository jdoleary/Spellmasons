# Todo

- Terrain (stuck units move laterally?)

## Bugs Suspected Fixed

- BUG: Sometimes it skips other players turn when one goes through the protal
- BUG: Dead player still able to cast and keeps moving????
  - Players don't resurrect AGAIN

## Brad 2021-03-21

- "Weird that I got a card and then moved"
- Make turn timer show if you have a move or cast left or both
- BUG: "Closest player" is always seeking brad
- BUG: Clicking multiple times caused brad to mvoe twice

## bugs

- **Bug**: "push" spell doesn't work well for multiple units when it would make them run into each other
  - based on order of operations sometimes they don't move, when they should,
    - they're not really blocked by an ally golem, because the ally will move out of the way
- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
- Shield should apply to a single turn, not to an amount of damage
- BUG: I froze a guy, brad moved, and the guy still hit brad
  - Frozen applied via a trap is instantly removed
    - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
  - Fix solution: You could remove frozen only when a unit attempts to move (or a player skips their turn?)
