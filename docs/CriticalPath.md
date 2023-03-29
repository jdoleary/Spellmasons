# Critical Path
- Fix not allowing multiple spell mods due to asset loading: https://discord.com/channels/1032294536640200766/1069963955092606976/1088726491434602506

- If you press "Escape" during View.Disconnect is messes up the flow and even if you connect again successfully you can't get back in because it only shows the quit button
# v1.11
- Hotseat is bugged, only one player can enter the portal https://steamcommunity.com/app/1618380/discussions/0/3819654644922993969/

---
- using split on yourself also sometimes permanently reduces your mana going forward, it wont reset after the round ends 
- Madgod — Yesterday at 11:56 PM
found a bug, if you hover your unspawned character over the map (to choose a spot) and its near the effect radius of another players attack, you will take damage before youve even spawned
i.e if your friend bloats and pull enemies to a spot and they die and explode, and you are hovering over that, youll take the boat damage beforew youve even spawned
- See modgod's recordings
- Separate Joining a Game from Hosting a Game so that server crashes and reconnects can be distinguished from client disconnect and reconnect
  - Client reconnect should go right back to View.Game
  - whereas server disconnect should save the game and go to lobby.
## Critical bugs:
- sJacob — Today at 3:25 PM
im getting some level skipping again not near as bad as last time, ill do some more runs and try to record it this time/ from 1 to 3 to 9
---
- Prevent going to the next level until casting is done
---
- I was able to induce a desync when testing all category spells.  The player's location was visually different than it was in state
## v1.10

---
- Post on Epic Games Store and Itch.io
- Improve 'Join game as player' ux, it should assume if the names match who you are joining as
---
- AFter perk refactor make sure summons are still viable (such as death mason's 1200 mana)
- Current changes make it so you could potentially get stuck with endedTurn set to true if there's a desync?
- What if there was an "attrition" feature where after you beat the deathmason the "perks" turn into curses which affect your stats or modify or remove your spells?
- Update Korean language (changes after v1.8)
- release demo
- UI: Perks are not translated
- UI Feedback for spawning player while cast is in progress
- was able to create a desync with pickups (error and portal sticking around) when moving from one multiplayer game to another
## Priorities
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
