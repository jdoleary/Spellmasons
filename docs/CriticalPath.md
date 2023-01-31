# Critical Path

## Tonight

- "+80%" single turn mana is way to powerful especially when it stacks
  - does it have to do when you spawn on mana bottle?
- target kind animates sequentially not concurrently
  - it also targets already targetd units
- stamina bar doesn't update while spell is casting
- Deathmason gif is missing
- UX shouldn't automatically add spells to the sidebar
- Big: +5% attack range resulted in WAY to much attack range by level 12
- spells can "come off the bar" unexpectedly
- shove radius makes you get too close to minibosses
- multiple suffocates in separate casts doesn't work right
- red portals left over after level turn over

---

- You can cast while a spell is channeling and go negative mana
- Am I accidentally sending the mac build along with the PC build??
- mana badges and red "a card must come after" in the queued spells are offset
  wrong
- green glop has shades of blue in it
  - check when Brad downloads actual game if they aren't colored
- BUG: cast debilitatex2, arrow, bleed, bleed and entered the portal before
  bleed was done and it waited for a full timeout before moving on and the cast
  (and particles are sticking around)
- scrolling on tooltip makes whole game zoom
- He spawned in and his single-turn perks didn't proc (maybe because he got to
  negative mana the game before?)
  - he was queing up a spell while they were procing
- attention markers remain up after phantom arrow if you don't move your mouse,
  check git history
- target kind UI stays up too long for following spells
- decoy spawned in the nether died but still had a health bar
- AOE + Clone on a bunch of corpses is causing lag

## Priorities

- bug: I was able to end my turn while arrows were still flying
- bug?: + 3 single turn mana, it's capacity, not single turn
- balance?: single turn perk stamina can keep stacking to an obsurd degree if
  you don't use it
- disable saving for singleplayer??
- Finish Localization (Monday)
- Validation (Monday)
- Final Builds (Monday)
- idea: throttle runPredictions on mouse move?
- idea: less spell choices, more perk choices?

- Extras
  - Answer emails
  - Support Modding
  - Codex
  - Send Scarlette Seeker a key via Twitter

## Large Tasks

- Mac build
  - Ensure bundle isn't 700mb with extra stuff
    - Something to do with Electron Framework.framework/versions
  - Make package for x64
    - `electron-forge package --arch=x64 --platform=darwin`

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
  - Address Cie's balance ideas
  - Ensure server browser will detect when a server is offline
