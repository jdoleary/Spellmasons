## Monday
- validate: Ending turn more than once
    - validate ending turn rapidly at end of level
- Multiplayer Save/Load
    - Saved games should persist to steam cloud
    - Only host should be able to Load a game
    - what happens when multiplayer tries to join a singple player save
        - or when there are more players in the lobby than there are players in the save
- WSPie Private Games
- Cache Targeting to prevent desyncs on multiplayer

## Bugs 
- head x5 + vortex if portal is out makes the portal smoke on prediction
- Desync during ally turn (as seen in brad playthrough)
- **important** Cache targeting from spells before sending it in a SPELL network message to prevent desyncs in multiplayer
## Content
- Endgame Looping (1/28)
    - (see branch `loop-tint-level`)

## Balance
- **important** Improve difficulty scaling with over 4 players (1/20)
    - Wow used 10man and 25man variations
    - Increase unit quantity for over 4 players?
    - Introduce tougher enemies sooner?
    - Diversity of playstyle (classes?)

## Performance
- More Upgrades
    - Modify enemies or global stats
    - Modify cards themselves, just like how cards have the optional add() and remove() functions, they could also have a level up function.
- Prediction slowing down on huge spells (1/19)
    - Use web workers for predictions
    - I can call terminate() on a web worker to stop it if I detect that a new prediction has started processing
    - A prediction web worker must return
        - prediction units / pickups with health changes
        - attention markers (in drawHealthBarAboveHead)
- Testing on worse devises
    - Test on worse processor
    - Test on less RAM
- Test in offline mode
    - Does Golems-Menu Playfair display font load

## Features
- Supporting app with Edge DB (1/19)
    - Stats in gameover screen (local, not in database)
        - Duration
        - Kills
        - Most effective spell
    - Leaderboards
        - userId
        - date
        - score: json
    - Multiplayer
        - Server Browser
            - schema
                - name
                - url
                - uptime
                - cpu
                - clients
                - rooms
    - Dynamic "Server Maintenance" notice
        - other dynamic "non deploy" notices


## Nice to haves
- Modding (1/30)
    - Include instructions from Modding.md
- QualityOfLife.md