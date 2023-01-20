## Bugs 
- Desync during ally turn (as seen in brad playthrough)
- Cache targeting from spells before sending it in a SPELL network message to prevent desyncs in multiplayer
## Content
- Bossmason (1/20)
    - Implement aoe damage against enemies chain+hurt?
    - todo: Bossmasons' casts aren't limited when he's out of mana
- Sand vampire should be more than just a color reskin (1/20)
    - Could pull your max mana
- Endgame Looping (1/28)
    - (see branch `loop-tint-level`)

## Balance
- **important** Improve difficulty scaling with over 4 players (1/20)
    - Wow used 10man and 25man variations
    - Increase unit quantity for over 4 players?
    - Introduce tougher enemies sooner?
    - Diversity of playstyle (classes?)

## Performance
- **important** Prediction slowing down on huge spells (1/19)
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
    - Stats in gameover screen
        - Duration
        - Kills
        - Most effective spell
    - Leaderboards
    - Multiplayer
        - LAN hosting: Support hosting a server from in the game exe
        - Server Browser
        - Multiplayer save load with "take over player"
        - Ws pie room privacy
    - Dynamic "Server Maintenance" notice
        - other dynamic "non deploy" notices

## Clean

## Nice to haves
- Modding (1/30)
    - Include instructions from Modding.md
- QualityOfLife.md