- New modifier:
  - weak (more vulnerable to damage)
- prevent frozen units from attacking
- Add events
  Here's how events work. Some units get event names added to their subscribed list. For example onDamageShield. Then when they take damage,
  all of the onDamage events trigger in a chain and the result is applied as damage
- What I need is a SYSTEM that is so expressive you can write all spells using it's API without any logic written elsewhere outside of the spell file.
  - If it can handle obliterate, and swap and others it will be very expressive and powerful
  - If all "hooks" such as "preDamage" are pure and chained then interrupts such as freeze and shield will be possible
  - Hooks may have to have their own state (such as shield)
  - **What if the order that you clicked the spells mattered? Like AOE/Swap is different from Swap/AOE**

## Brad feedback 2021-03-26

- All golems are the same size, heavy not showing, only on first level
- health went back to max after portaling??
- freezing is permanent? a unit unfroze between brad and my turns, unfreezing logic is broke
- advice: need more diversity of challenge with the enemy types than just "avboid that line"
  - a unit that summons other units (adds stimulation to the thought, more than just avoid the shape)
- Bug: Shield didn't work, brad cast it, got hit by 4 guys and died immediately

# Todo

- Fix freeze / shield
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
