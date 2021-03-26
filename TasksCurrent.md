# Todo

- Idea: What if all spells where "pluggable" and used husky-style hooks
  - can you make a system where they fit in with no special if checks
    - how to solve freeze, trap, swap?
  - what if there was a planning phase where you could pick your arsenal of cards once you see the board to prevent doom state?
  - TODO: Ensure order of operations for AOE and chain in new hooks system
  - TODO: How will GameBoardInput display the targets ahead of time?
- Better way to manage cards in hand
  - Add data-id to selected card tally elements and use document.query instead of an object to keep track
    so the ui is never out of sync with the game state. this makes it easier to clear all selected cards for example

---

- units need pathing, it's weird if they don't move at all
- Terrain (stuck units move laterally?)
- [Spell Hooks](https://docs.google.com/spreadsheets/d/1PntBWT4twXoKRKBZBOg7zZtWNzoqtfu6SD-EMQYedt4/edit#gid=0)

## Bugs Suspected Fixed

- BUG: Sometimes it skips other players turn when one goes through the protal
- BUG: Dead player still able to cast and keeps moving????
  - Players don't resurrect AGAIN

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
- Shield should apply to a single turn, not to an amount of damage
- BUG: I froze a guy, brad moved, and the guy still hit brad
  - Frozen applied via a trap is instantly removed
    - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
  - Fix solution: You could remove frozen only when a unit attempts to move (or a player skips their turn?)
