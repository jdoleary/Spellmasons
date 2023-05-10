# Critical Path
  question: did you decrease the amount of enemies?
it feels right in solo play but in 3-player we are often getting 6 5 monsters in a single room even midgame. Thats... uh... not enough monsters 
Jordan - Spellmasons Developer — Today at 10:42 PM
No, I didn’t. It might be a budgeting issue. Which 5 monsters were they? I might just have to adjust their budget value
scojbo — Today at 10:51 PM
cant remember for sure... maybe 2 ancients and 3 blood vampires? but the overall budget could certainly stand to increase more in multiplayer anyways.
Was really hoping for some rooms late-game with a horde of ancients but most I ever saw in one room was 4 (even in 3player round 18)
- enhancement: MrMarblz — Today at 7:04 PM
Also, while playing on my laptop w/ integrated graphics the screen scrolling and zooming in/out is very slow
- i18n: for Dragger
- admin bug: Prevent movement spells from casting devdesync
  - lots of desyncs, cast admin curse (some blew up), then admin target.  Many units changed position.
- bug: validate WhiteSycthe desync report: 2) There appears another desync issue when using a selection spell + dash; I would dash to all targets, but once the turn was ended I would blink back to the initial dash destination.

---
- bug: arrow not killing eenemies as it predicts https://discord.com/channels/1032294536640200766/1069963955092606976/1094617106504491079
- Bug: I ended my turn which resulted in a game over / restart for the host app but it just froze on my end
  - this happened after this message: `Player unit died but could not find them in players array to end their turn`
  - then later:
```
onData: MOVE_PLAYER 
onData 27 : MOVE_PLAYER { type: 1, x: 506.8586951313629, y: 329.24416157481767 }
canMove: false - unit is not alive
```

## For v1.14
- Prevent mana scamming from casting too quickly
- Fix: A player has joined mid-game and didn’t get to choose any spells or upgrades.  When the first level was completed they still weren’t able to pick any.  Rejoining the game didn’t fix it either for that player.
- Calamity
  - Don't increase damage for units that don't deal damage, like summoners.  Change mana instead
  - Add `protection` spell as calamity
---
- Two units moving pushed a third unit through a wall (archers).  See Chase87's photo in Discord
- Address MrMarblz's bugs below

---
- Add turn based cooldowns to spell-state
  - you can get around cooldown by casting quickly, before it has triggered the spell
- Balance Suffocate (TonyFTW from Discord)
However, I think it could be modified in ways that would give it a purpose, as i would consider it currently universally outclassed. My initial thoughts go to making this a high mana cost spell that puts any monster on an unstackable x turn clock (maybe 5-10) regardless of health, or a stackable % of hp turns calc(IE 4% stacking cast 5 times would be a 5 turn clock). In this way it might serve a mid game purpose for killing high hp monsters or boss, or a mid late floor clearing mechanism with stall tactics. In the end there’s a million ways to address the design purpose of this spell if desired.
---
MrMarblz — Yesterday at 12:15 PM
Here are a few of the bugs we’ve encountered in multiplayer.  This is strictly from memory about games we’ve played in the past 2-3 weeks.  I have video of our games that I can more closely review if need be.
•    A player has joined mid-game and didn’t get to choose any spells or upgrades.  When the first level was completed they still weren’t able to pick any.  Rejoining the game didn’t fix it either for that player.
•    Enemies get de-synced.  This seems to happen a lot more the past few weeks.  Monsters die or get damaged and players are observing different (or no) damage delt, some players see the enemy die and others don’t.  Also, some enemies come back to life to some players but not other players.  When this happens we really have no idea what’s true or see any consistency.  There’s been times where others are able to finish the level, the portals appear and we’re able to go through while another player still sees an enemy and doesn’t have a portal until the enemy only seen by them is finished off.
•    Archer pathing seems broken in multiplayer, almost like they forget how to avoid walls.
On another note, there’s a few exploits I’m not sure if you’re aware of…
•    If you cast Conserve, you can chain other spell components like Heal after Conserve in the same casting action as long as you have enough mana for them.  I think the game waits until after that spell with Conserve is finished before it banks your mana, and it uses the current mana value before that spell with Conserve is cast.  So if I had 100 mana before I cast Conserve + Shield + Heal + Heal then it still banks 100 mana for next round.  It can get pretty out of control with Shields, Heals, and Last Wills if you steal a bunch of mana before you Conserve.
Other comments/suggestions…
•    We do not like the new cooldowns on freeze and other spells you’ve added and feel like the increase in mana cost for these spells is enough of a deterrent not to spam them all the time.  We feel like it should be one or the other, not both (and we prefer how it was).

---

- Not really sure about Bleed or Death Wager
-----------------------------------

Tier 0:
target similar.

Tier 0.5:
Debilitate

Tier 1:
Freeze, Vortex, Displace, resurrect, mana steal, target cone, connect, conserve

Tier 2: Plus Radius, repel, push,

Tier 3: Shove, Bleed, Phantom Arrow, Decoy, Clone,  mana Burn, target circle,  Last Will (This might have been tier 1 before the nerf)

Tier 4: Slash, dash, target column

Tier 5: pull, rend, Burst, target kind,

Tier 6: Poison, arrow, split, Death Wager(?)

Tier 7: drown, Swap, 

------------------------------------------------------------------------------------
Now we enter the tiers of spells that are so bad they're NEVER worth picking.

Tier 8:  Target arrow (only useful on maps you've already won. If long-range was important this would be a good spell) , and Capture Soul.  It's so prohibitively expensive that its a joke.

Tier 9: Shield/Heal/purify.  You just shouldn't be taking damage in this game as it is. Ever. I still suggest that you add some 5-damage Ultra-long range cannon-enemies to make these spells useful.
The literal ONLY use of these spells is to let you cast mana steal more times.

Tier 10: Slow, suffocate, blood curse.

Tier 11 Sacrifice

The worst spell in the game:
Fortify. Lol. This spell IS a joke right? 
- Prevent players from killing ally players that haven't spawned yet:
  - mrman227 — Today at 3:00 PM
Another player killed me with Target Cone + Slash before I placed my character down.

Edit: Death Wager also doesn't calculate spell cost reset when used in a chain. 
- MrMarblz — Today at 2:14 PM
When all the players die the game restarts at level one automatically.  When this happens, it seems like you pick as many spells as the level you all were at in the last game.
So for example, if we die on level 12 in the previous game we pick 12 spells at level 1 on the next game.
Scrolls picked up in the next game don't do anything.  I'm not sure if they start giving you spells once you've passed the highest level you reached on the previous game.

- https://discord.com/channels/1032294536640200766/1090050489934172220/1091492132189118545
- So my brother (the other player) suspects that if any action is taken while you're currently making an attack it gets bugged.  He thinks he ended his turn during that single slash - hence why it doesn't look like it took damage.  He also seems to think that's the same case for using stamina.  If you move while you're still casting a spell the stamina isn't used.  Same goes for casting and mana usage, he says that it may not count the mana cost of spells if you're queuing them up while you're casting. - MrMarblz
- MrMarblz — Today at 7:22 PM
If the turn is ending and you're moving a spell at the same time the spell doesn't go away in the previous position and now you have the spell on your hotbar twice.
- ally summoners show attack badge when getting ready to cast

# v1.11
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
