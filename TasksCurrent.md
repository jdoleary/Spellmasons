# Todo

- Idea: What if all spells where "pluggable" and used husky-style hooks
  - can you make a system where they fit in with no special if checks
    - how to solve freeze, trap, swap?
  - what if there was a planning phase where you could pick your arsenal of cards once you see the board to prevent doom state?
- Better way to manage cards in hand
  - Maybe "always" cards just renew after theyre cast rather than not being removed
  - Add data-id to selected card tally elements and use document.query instead of an object to keep track
    so the ui is never out of sync with the game state. this makes it easier to clear all selected cards for example

---

- Terrain (stuck units move laterally?)
- [Spell Hooks](https://docs.google.com/spreadsheets/d/1PntBWT4twXoKRKBZBOg7zZtWNzoqtfu6SD-EMQYedt4/edit#gid=0)

## Refactor tasks

- Improve movement so that order of operations doesn't inhibit units from moving to take a spot that a different unit just relinquished
  - **Bug**: "push" spell doesn't work well for multiple units when it would make them run into each other
    - based on order of operations sometimes they don't move, when they should,
      - they're not really blocked by an ally golem, because the ally will move out of the way

## Bugs Suspected Fixed

- BUG: Sometimes it skips other players turn when one goes through the protal
- BUG: Dead player still able to cast and keeps moving????
  - Players don't resurrect AGAIN

## Brad 2021-03-21

- "Weird that I got a card and then moved"
- BUG: "Closest player" is always seeking brad
- BUG: Clicking multiple times caused brad to mvoe twice

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
- Shield should apply to a single turn, not to an amount of damage
- BUG: I froze a guy, brad moved, and the guy still hit brad
  - Frozen applied via a trap is instantly removed
    - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
  - Fix solution: You could remove frozen only when a unit attempts to move (or a player skips their turn?)
