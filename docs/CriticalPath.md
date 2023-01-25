
# Critical Path

## Important Tasks Remaining
- Wednesday
---
- LAN Hosting UI
- Server Browser
- Integrate i18n translations
    - Optimize: short circuit bloat movement if it's taking too long
    - QA and push new build
---
- Cache Targeting to prevent desyncs on multiplayer
- Improve scaling over 4 players
- Update system requirements size requirement now that headless server has it's own node_modules??
- Guard against loading gamestate from a previous version that could cause an error
---
- bug:? White screen if game launches from non C drive?
- copy error: in spells cost more mana explained "spell\'s"
- liquid damage doesn't do enough??
- explain that shields and other blessings are cleared when you go through a portal

- Extra work needed on mana refunds
    - bug: phantom arrow did damage but didn't subtract mana
    - add more spell refunds
- Balance: Chain and other targeting spells should eventually target you if it doesn't have any other targets so that you can't nuke the entire map without any danger to yourself

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
    - MacOS and Linux builds
        - Change steam listing to say it supports them and cross platform multiplayer
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