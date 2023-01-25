
# Critical Path
## Important Tasks Remaining
- TUESDAY
    - Optimize: short circuit bloat movement if it's taking too long
    - QA and push new build
---
- LAN Hosting UI
- Server Browser
- Integrate i18n translations
---
- Cache Targeting to prevent desyncs on multiplayer
- Improve scaling over 4 players
- Update system requirements size requirement now that headless server has it's own node_modules??
- Guard against loading gamestate from a previous version that could cause an error
---
- bug:? White screen if game launches from non C drive?
- bug: toolbar is still moving down on some streamers screens
- copy error: in spells cost more mana explained "spell\'s"
- liquid damage doesn't do enough??
- add more spell refunds
- explain that shields and other blessings are cleared when you go through a portal
- make drown support quantity so it stops notifying refund when it shouldn't
- priest isn't moving closerb
    - he's just running away so he's not near any corpses


## Remaining Validation
- Multiplayer save/load
    - Saved games persist to steam cloud
    - what happens when multiplayer tries to join a singple player save
        - or when there are more players in the lobby than there are players in the save
    - If a player joins a game and then leaves without ever being a part of the game you can "join as that player" but the names get mixed up.

## Schedule
- January 1/22-1/28
    - Test on Slow Computer
    - Verify Cloud Saves
- January 31 (check timezone)
    - Update translations and verify all translators are in credits
    - Verify hardware specs harddrive space requirement
    - Release Game and Demo
        - https://partner.steamgames.com/doc/store/releasing
        - Double check the package content https://partner.steamgames.com/store/packagelanding/574232
    - Make Package Discount
    - Offer Soundtrack for purchase (App 2289100)
        - Make sure soundtrack shows up on main page for purchase
    - Be logged into all socials and be responsive all day
    - Submit to Reviewers
        - Submit to IGN and others

- Beyond
    - Use [Steamworks.js](https://github.com/ceifa/steamworks.js)
        - Lobby (invite friends directly)
        - Leaderboard validity
        - Achievements
        - Note: Use custom clone and add steam SDK yourself for security reasons