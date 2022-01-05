- Implement new way of getting cards over time
- Balance mana
  - To make this challenging, players should often be on the verge of no mana, it should feel scarce so they have to pick carefully what spells they want to use.
  - Maybe max mana should increase over time
  - or mana refresh rate
- Health should cost more than 1 mana per 1hp or else you can directly convert mana to HP
- Damage should be able to kill simple mob easier
- Mobs should be able to hit your unit edge, not your center
- Single use abilities
  - Abilities for mana, mana potions?
---
- (L) Collision
  - Unit collision
  - Obstacles
  - Prevent units from running away outside of bounds
- (M) Push spells
  - Depends on: Collision task
- (s) Categories of spells, the combinable ones (cards), the special spells (teleport and such) limited in use - represent them differently (with, say, a hexagon, for the ones that can get used up)
  - Make these pickupable (call them runes?) and they persist between levels
- (L) Rather than an overworld, what if you and your team have to mix potions in a cauldron to create a portal that leads you to a unique level? (The cauldron makes the portal)
  - This adds another tradeoff, the more dangerous the portal, the greater the reward for surviving it.
  - Should cauldron have bounds so players can't under do the difficulty or over do it?
  - Should there be a time constraint for end game? so you can only make so many culdrons?
  - In the boss battle, maybe you need to protect the culdron and there's no portal?
- (M) wsPie: how to handle reconnection
  1. Reconnection when the server goes down and comes back up (loses room state)
    - This currently puts the game in a buggy state
  2. Reconnection when the client goes down and comes back up (keeps room?)
  - How to handle user joining mid stage (say during overworld or during underworld)?
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