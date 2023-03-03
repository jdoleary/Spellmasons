# Critical Path
- UI: Perks are not translated
- UI Feedback for spawning player while cast is in progress
- was able to create a desync with pickups (error and portal sticking around) when moving from one multiplayer game to another
## Friday's update
- Fix desync caused by someone spawning while a spell is being cast
- French, Japanese
- Optimizations done today
- Fix overpopulation
- Do something about explaining scroll disappear now that level ups are done differently
## Priorities
- Re-add Japanese and notify journalists
- Look for Korean translation
- Address crashes due to too many units due to summoners
- Balance Perks
- Address Desync issues
- Add French Skornette translation
- State machine for turn_phases


## Tonight

- perk issues:
  - "+80%" single turn mana is way to powerful especially when it stacks
    - does it have to do when you spawn on mana bottle?
  - Big: +5% attack range resulted in WAY to much attack range by level 12
- target kind animates sequentially not concurrently
  - it also targets already targetd units
- stamina bar doesn't update while spell is casting
- shove radius makes you get too close to minibosses
- multiple suffocates in separate casts doesn't work right
- red portals left over after level turn over
- perks didn't trigger for him once, i'm wondering if it resetPlayerForNextLevel
  or something after the perks had triggered, like resetting a stalled game

---

- You can cast while a spell is channeling and go negative mana
- BUG: cast debilitatex2, arrow, bleed, bleed and entered the portal before
  bleed was done and it waited for a full timeout before moving on and the cast
  (and particles are sticking around)
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
- idea: throttle runPredictions on mouse move?
- idea: less spell choices, more perk choices?

- Extras
  - Codex


- Beyond
  - Use [Steamworks.js](https://github.com/ceifa/steamworks.js)
    - Lobby (invite friends directly)
    - Leaderboard validity
    - Achievements
    - Note: Use custom clone and add steam SDK yourself for security reasons
  - [Linux Support](https://www.electronjs.org/docs/latest/tutorial/application-distribution#rebranding-with-downloaded-binaries)
    - Use node.js path object instead of .replace with ///file:
  - PVP
  - Codex
  - Reach out to `rastabarkan` and `nonotion` for translation support after
  - Address Cie's balance ideas
  - Ensure server browser will detect when a server is offline
