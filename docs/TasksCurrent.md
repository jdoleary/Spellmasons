- Implement new way of getting cards over time
- Balance mana
  - To make this challenging, players should often be on the verge of no mana, it should feel scarce so they have to pick carefully what spells they want to use.
- Spell: Burn mana / Steal mana
- Swap should only swap with targets, it shouldn't allow arbitrary teleportation
- swapping with portal shouldn't make user portal
---
- (L) Collision
  - Unit collision
  - Obstacles
  - Prevent units from running away outside of bounds
- (M) Push spells
  - Depends on: Collision task
- (s) Categories of spells, the combinable ones (cards), the special spells (teleport and such) limited in use - represent them differently (with, say, a hexagon, for the ones that can get used up)
  - Make these pickupable (call them runes?) and they persist between levels
- More spells:
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)
- Improve / Fix Spells:
  - What happens when you clone yourself?
  - Charge doesn't play well with AOE
  - chain purify didn't work(didn't remove poison)

## Advice from Elon:
1. Make your requirements less dumb.  Everyone is wrong sometimes
2. Try very hard to delete the part or process.  If you're not occasionally adding things back in then you're not deleting enough.
3. Simplify or optimize.  Note: It's the third step for a reason. Possibly the most common error of a smart engineer is to optimize a thing that should not exist.
4. Accelerate cycle time.  You're moving too slowly, go faster.
5. Automate