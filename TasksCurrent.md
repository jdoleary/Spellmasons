- How to inform users the order of operations of the spell they cast
- How to support multiple instances of freeze?
- prevent frozen units from attacking

## Brad feedback 2021-03-26

- All golems are the same size, heavy not showing, only on first level
- health went back to max after portaling??
- Make game really really hard for testing
- advice: need more diversity of challenge with the enemy types than just "avboid that line"
  - a unit that summons other units (adds stimulation to the thought, more than just avoid the shape)

# Todo

- Next: Be more creative with enemies
- Idea: what if there was a planning phase where you could pick your arsenal of cards once you see the board to prevent doom state?
- TODO: Fix retargeting for swap
  - If you can cast multiple times, maybe swap need not combine with others
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
