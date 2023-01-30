# Critical Path

## Priorities

- Balance game (Sunday)

- Finish Localization (Monday)
- Validation (Monday)
- Final Builds (Monday)

- Extras
  - Answer emails
  - Support Modding
  - Codex

## Large Tasks

- Mac build
  - Ensure bundle isn't 700mb with extra stuff
    - Something to do with Electron Framework.framework/versions
  - Make package for x64
    - `electron-forge package --arch=x64 --platform=darwin`

- Cache Targeting to prevent desyncs on multiplayer

- Make the bossmason a more obvious boss (change name to deathmason)

## Balance

- Some enemies could start with nullify to reject the first spell that hits
  them??
- Nerf target kind
- Make game harder??

## Sunday

- (m) Integrate i18n translations
- Integrate Chad's copy
- Address Cie's balance ideas
- cap on clone issue? Investigate Cie's comment

## Monday - Validation - Final builds

- Validate difficulty scaling: up to 3 players the enemies get tougher, beyond
  they get more pleantiful
- Multiplayer save/load
  - Saved games persist to steam cloud
  - what happens when multiplayer tries to join a singple player save
    - or when there are more players in the lobby than there are players in the
      save
  - If a player joins a game and then leaves without ever being a part of the
    game you can "join as that player" but the names get mixed up.
- White screen if game launches from non C drive?
- Test on Slow Computer
- Verify Cloud Saves
- Verify multiple games playing on the same server don't cause issues

## Day of

- Check timezone for release
- Update Chad's copy
- Add that cross-platform multiplayer is supported
- Update translations and verify all translators are in credits
- Verify hardware specs harddrive space requirement
- Update Demo
- Update servers
- Release Game and Demo
  - https://partner.steamgames.com/doc/store/releasing
  - Double check the package content
    https://partner.steamgames.com/store/packagelanding/574232
- Offer Soundtrack for purchase (App 2289100)
  - Make sure soundtrack shows up on main page for purchase
- Be logged into all socials and be responsive all day

- Beyond
  - Use [Steamworks.js](https://github.com/ceifa/steamworks.js)
    - Lobby (invite friends directly)
    - Leaderboard validity
    - Achievements
    - Note: Use custom clone and add steam SDK yourself for security reasons
  - [Linux Support](https://www.electronjs.org/docs/latest/tutorial/application-distribution#rebranding-with-downloaded-binaries)
    - Use node.js path object instead of .replace with ///file:
  - Hotseat multiplayer
  - PVP
  - Codex
  - Reach out to `rastabarkan` and `nonotion` for translation support after
