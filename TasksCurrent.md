## Brad feedback 2021-03-26

- All golems are the same size, heavy not showing, only on first level
- health went back to max after portaling??
- freezing is permanent? a unit unfroze between brad and my turns, unfreezing logic is broke
- advice: need more diversity of challenge with the enemy types than just "avboid that line"
  - a unit that summons other units (adds stimulation to the thought, more than just avoid the shape)
- Bug: Brad couldn't move at first after resurrecting
- Bug: Shield didn't work, brad cast it, got hit by 4 guys and died immediately
- Bug: Brad could still cast one spell after the game was over and he was dead

# Todo

- Next: Be more creative with enemies
- Idea: What if all spells where "pluggable" and used husky-style hooks
  - can you make a system where they fit in with no special if checks
    - how to solve freeze, trap, swap?
  - what if there was a planning phase where you could pick your arsenal of cards once you see the board to prevent doom state?
  - TODO: Fix retargeting for swap
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
