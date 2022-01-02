
- [Learn Pixi shaders](https://blog.cjgammon.com/pixijs-filters/)
    - https://filters.pixijs.download/main/docs/index.html
    - See branch "shaders-yay" in this repo
- Optional: (M) Interactive terrain (grass spreads fire, water can be frozen to walk on, boulders can be destroyed)
- Potential bug: This may not be a bug once overworld is replaced with Cauldron but currently voteForLevel waits until all clients have voted to move on, however, if a client disconnects without voting, the other clients will be stuck until another client votes
- Potential bug: When player disconnects and reconnects, the game will call setTurnPhase and setRoute in order to reestablish the game state.  This MAY cause issues if the game is mid turn or in a route that cannot be initialized more than once. See 1091b4dbb84118dd016bbba75f18a9273f1a656a for explanation.
- Bug: Tooltip may go out of bounds if something hovered is near the edge of the screen and the tooltip is tall