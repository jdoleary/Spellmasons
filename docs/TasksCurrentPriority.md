## Bugs 
- Esc hotkey to menu doesn't work if you're hovering a inspect unit while spawning
- Desync during ally turn (as seen in brad playthrough)
- Ask server for latest state after returning from alt-tab
- **important** Loading a game with a portal up - the portal comes back as a blood portal and you have no stamina
## Content
- Bossmason
    - Implement aoe damage against enemies chain+hurt?
    - todo: Bossmasons' casts aren't limited when he's out of mana
- Sand vampire should be more than just a color reskin
- Endgame Looping
    - (see branch `loop-tint-level`)

## Balance
- **important** Improve difficulty scaling with over 4 players
    - Wow used 10man and 25man variations
    - Increase unit quantity for over 4 players?
    - Introduce tougher enemies sooner?
    - Diversity of playstyle (classes?)

## Performance
- **easy** Connect spell is slow when cast with multiple targets (after another targeting spell); make it concurrent like the others
- **important** Prediction slowing down on huge spells
    - "You may still cast this spell, but it is too powerful to predict" (Get copy review)
- Testing on worse devises
    - Test on worse processor
    - Test on less RAM
- Test in offline mode

## Features
- **easy** Double check Electron Security
    - Since I'm using electron, I should evaluate my dependencies for safety: https://www.electronjs.org/docs/latest/tutorial/security#security-is-everyones-responsibility
    - [Security Recommendations](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)
- Supporting app with Edge DB
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
- Ensure center text like "You died" doesn't overlap with other text

## Nice to haves
- Modding
    - Include instructions from Modding.md
- QualityOfLife.md