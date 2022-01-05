
- [Learn Pixi shaders](https://blog.cjgammon.com/pixijs-filters/)
    - https://filters.pixijs.download/main/docs/index.html
    - See branch "shaders-yay" in this repo
- Optional: (M) Interactive terrain (grass spreads fire, water can be frozen to walk on, boulders can be destroyed)
- Potential bug: This may not be a bug once overworld is replaced with Cauldron but currently voteForLevel waits until all clients have voted to move on, however, if a client disconnects without voting, the other clients will be stuck until another client votes
- Potential bug: When player disconnects and reconnects, the game will call setTurnPhase and setRoute in order to reestablish the game state.  This MAY cause issues if the game is mid turn or in a route that cannot be initialized more than once. See 1091b4dbb84118dd016bbba75f18a9273f1a656a for explanation.
- Bug: Tooltip may go out of bounds if something hovered is near the edge of the screen and the tooltip is tall
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
- Restore save/load/replay