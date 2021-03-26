# Todo

## Brad 2021-03-24

- How do players know what their upgrades are
- notify which players have left to upgrade
- why do we keep accidentally ending our turns
- You get "cannot move more than once per turn" while spell animations are firing
- Celebratory damage counter for huge combos!
- I didn't get to take a turn, brad didn't know how he died, (game log?)
- Brad still had a shield after dying and resurrecting
  - Brad's health doesn't show after resurrecting
- Brad healed himself and his turn just ended without letting him move
  - he's stuck unable to move
- Don't let players cast fizzle spells (AOE or chain without damage)
- Brad is now not taking damage

- Brad's final feedback
  - units need pathing, it's weird if they don't move at all
  - Needs balance, at the end you have a lot of cards but you die quickly
  - having less, stronger units is more of a challenge than having many, weak units
  - show the rarity of cards to a player?
    - Expose the raw variables to the player so they can make calculated positions

---

- bug: Damage and health no longer stack now that they are driven by upgrades

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
