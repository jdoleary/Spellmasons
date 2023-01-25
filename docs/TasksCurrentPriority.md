
## Bugs 
- bug: **important** White screen if game launches from non C drive?
- bug: **important** mana cost badge of spells in extra side toolbar doesn't update when mana cost changes
- **important** Cache targeting from spells before sending it in a SPELL network message to prevent desyncs in multiplayer
- head x5 + vortex if portal is out makes the portal smoke on prediction
- Desync during ally turn (as seen in brad playthrough)
- mana says it's being refunded but isn't for overkill arrows
- bug: He was able to have the spell continue to cast even after he went through a portal
- bug: Best spell wasn't accurate
- copy error: in spells cost more mana explained "spell\'s"
## Content
- arrow copy: "Ignores cast range"
- Endgame Looping (1/28)
    - (see branch `loop-tint-level`)
- **important** poisoner should have a cost to cast
    - it does, maybe show in tooltip?
- explain that shields and other blessings are cleared when you go through a portal
    - This could be explained if you self cast after a portal is opened

## Balance
- **important** Improve difficulty scaling with over 4 players (1/20)
    - Wow used 10man and 25man variations
    - Increase unit quantity for over 4 players?
    - Introduce tougher enemies sooner?
    - Diversity of playstyle (classes?)
- liquid damage doesn't do enough??

## Validate
- validate: Ending turn more than once
    - validate ending turn rapidly at end of level
## Performance
- Testing on worse devises
    - Test on worse processor
    - Test on less RAM
- Test in offline mode
    - Does Golems-Menu Playfair display font load

## Features
- Guard against loading gamestate from a previous version that could cause an error
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
- MacOS / Linux support
- Hotseat multiplayer
- QualityOfLife.md