There are two game loops in Spellmasons.
1. For singleplayer, the gameLoop() function in Underworld.  For multiplayer, the _gameLoopHeadless() function.
    - This main gameLoop manages:
        - UI updates
        - forceMove calculations
        - Sprite Image position syncing
        - Unit movement
        - Collision Detection
        - Image draw order management
        - Particles
        - Camera
    - In multiplayer, only the non visible portions need to be considered, so _gameLoopHeadless runs a subset of these
    - In singleplay gameLoop runs as an actual loop, every X frames because it's responsible for updating visible elements that are rendered
    - In multiplayer, the _gameLoopHeadless() only runs when needed so as to not waste cycles when nothing is happening (for example, if an instance is idle, or if the players are just not acting at the moment).  Also it runs all at once, not every X frames, because it needs to run the computations as fast as possible and send the results back to the clients that have their own gamestate (there are various points in the game when clients wait for a "sync" from the server to make sure they all have the same state).
2. The second game loop is related to underworld.broadcastTurnPhase() and underworld.initializeTurnPhase().  Since Spellmasons is turn-based, these manage which faction's turn it is and it keeps the turns moving when one faction is done with their turn (this is why it's a loop).
    - In multiplayer, it will stop looping if:
        - there is only one faction left alive
        - all players are dead
        - all players are disconnected