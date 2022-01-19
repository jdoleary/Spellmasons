## Current Priorities
- Implement new way of getting cards over time
  - You shouldn't start with a bunch of cards
- Balance mana
  - To make this challenging, players should often be on the verge of no mana, it should feel scarce so they have to pick carefully what spells they want to use.
- Playtest with brad
## Small Content Changes
- Spell: Burn mana / Steal mana
- Swap should only swap with targets, it shouldn't allow arbitrary teleportation
- swapping with portal shouldn't make user portal
## Large Changes
- (L) Collision
  - Unit collision
    - Handle multiple colliders or recursive colliders
  - Obstacles (Walls)
  - Prevent units from running away outside of bounds
- (M) Push spells
  - Depends on: Collision task
  - Rework movement spells such as charge and stomp

## Advice from Elon:
1. Make your requirements less dumb.  Everyone is wrong sometimes even smart people, and your requirements are definitely dumb
2. Try very hard to delete the part or process.  If you're not occasionally adding things back in then you're not deleting enough.
3. Simplify or optimize.  Note: It's the third step for a reason. Possibly the most common error of a smart engineer is to optimize a thing that should not exist.
4. Accelerate cycle time.  You're moving too slowly, go faster.
5. Automate

2020-01-05: If I want to be done by end of February I only have 8 weekends left to work on it