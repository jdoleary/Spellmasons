
## Bugs 
- **important** Cache targeting from spells before sending it in a SPELL network message to prevent desyncs in multiplayer
- head x5 + vortex if portal is out makes the portal smoke on prediction
- Desync during ally turn (as seen in brad playthrough)
- mana says it's being refunded but isn't for overkill arrows
- bug: He was able to have the spell continue to cast even after he went through a portal
- bug: Best spell wasn't accurate
- copy error: in spells cost more mana explained "spell\'s"
- target similar / connect line animates farther than it should
## Content
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
- Extra work needed on mana refunds
    - bug: phantom arrow did damage but didn't subtract mana
    - add more spell refunds


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