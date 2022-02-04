
## Feature Creep Ideas
- More spells:
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)
- (s) Categories of spells, the combinable ones (cards), the special spells (teleport and such) limited in use - represent them differently (with, say, a hexagon, for the ones that can get used up)
  - Make these pickupable (call them runes?) and they persist between levels
- (L) Rather than an overworld, what if you and your team have to mix potions in a cauldron to create a portal that leads you to a unique level? (The cauldron makes the portal)
  - This adds another tradeoff, the more dangerous the portal, the greater the reward for surviving it.
  - Should cauldron have bounds so players can't under do the difficulty or over do it?
  - Should there be a time constraint for end game? so you can only make so many culdrons?
  - In the boss battle, maybe you need to protect the culdron and there's no portal?
## Tasks Long Term
- Should I send a pie message everytime i need to end a players turn so we never end up with desynced turn state? rather than f3c23e59c99362c6fc9229cfc19499c3789439a6
- Optional: (M) Interactive terrain (grass spreads fire, water can be frozen to walk on, boulders can be destroyed)
- Potential bug: This may not be a bug once overworld is replaced with Cauldron but currently voteForLevel waits until all clients have voted to move on, however, if a client disconnects without voting, the other clients will be stuck until another client votes
- Potential bug: When player disconnects and reconnects, the game will call setTurnPhase and setRoute in order to reestablish the game state.  This MAY cause issues if the game is mid turn or in a route that cannot be initialized more than once. See 1091b4dbb84118dd016bbba75f18a9273f1a656a for explanation.
- Bug: Tooltip may go out of bounds if something hovered is near the edge of the screen and the tooltip is tall
- (M) wsPie: how to handle reconnection
  1. Reconnection when the server goes down and comes back up (loses room state)
    - This currently puts the game in a buggy state
  2. Reconnection when the client goes down and comes back up (keeps room?)
    - How to handle user joining mid stage (say during overworld or during underworld)?
- Restore replay
- What should happen when you clone yourself?
- Stresstest gamestate sync:
    - If you delay messages on the backend are you sure they'll arrive in the right order?
- What if it was in a dungeon instead of outside so there could be rooms?
- Things to sync
    - Add syncing for units
        - when: At start of unit turn
        - position, health, mana, spell effects?
        - Send message at start of units turn which asserts RNG state and unit state; then all simulations calculate together
    - Underworld
        - when: ?
        - Exludes Players, Units
        - Syncing RNG
        - turn state
        - pickups
    - Players
        - when: at start of player turn
        - this will also sync upgrades
- Add tests / refactor into module for syncronous message processing to account for:
    - messages arriving out of order
- When a user disconnects on overworld it doesn't check if everyone has voted (this may not be a problem once
i switch to the cauldron overworld)