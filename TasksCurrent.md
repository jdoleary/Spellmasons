# Todo

- Support an Overworld between levels so players can choose where to go (and choose the difficulty). It makes the game feel like a journey and gives it a setting.
- Change clone so that is clones all the targets once, rather than cloning one target as many times as there are empty targets

## 2021.04.22 Playtest with Brad

- We desynced unit positions until brad finished his turn, then it synced back up (one included a new spawned unit from summoner)
- Brad desynced when he charged
- It's somehow not Brad's turn on his screen (timer 0:00), but he's still casting on my screen and I have 0:42 seconds left. It seems to be that our turnTimeRemaining tiimers are far off

## 2021.04.21 Playtest with Rachel

- Rachels screen was too small and the cards overlapped the grid
- Rachel was frozen and I had taken my turn but it said "waiting on others"
- my turns seem to be ending unexpecedly, i just poisoned a guy and i din'dt move

- Rachel's Feedback
  - Multiplayer is awesome
  - She loves stacking the spells
  - Upgrades are a good way to balance the harder levels
  - Doesn't see the point of lance
    - Should it work diagonally?
  - Slay the Spire style chests
  - Make board bigger for more players?
  - Two stage levels? Pull a level to reveal a portal
    - trap doors? Environmental interactions
      - Blow up a square to make it lava
  - Only start timelimit if 2 of 3 players have ended their turn
  - see save('cannotmovehere'), i couldn't move directly to my right or left after i killed the guy to my left, also one of the grunts wasn't moving

---

- "Mind control" spell, changes their faction temporarily?
- Can players still resurrect after being obliterated??
- Allow some spells, like charge and swap, just interact with initial target?
- Idea: A discard card that discards the following cards cast and gets you new cards

- Question for Brad: Should Protection protect any single ally? So that it can work for both players if you stack it?
  - stash: "protection stackable"
- Question for Brad: Do you like charge and should it trigger pickups when it moves you?
  - Bug: Charge doesn't play well with AOE
- Bug: Swapping with the portal while there was an enemy behind it swapped but made me disappear without triggering end of level (even though inPortal is true)
  - Entering the portal doens't currently end my turn because movement does, and if you don't swap into the portal you have to move into it
  - Maybe since there are more movement spells now, move spelling into the portal should end your turn.
- Fixed?: We had some 3 disconnected players, brad killed me, destroyed my corpse and entered the portal and it entered an infinte loop

## Tasks

- Add obstacles to spell effect? So freeze can freeze lava?
- Freezing lava should let you walk over it (casts should work on obstacles)

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
- These bugs occurred while playtesting with Rachel but I haven't been able to reproduce myself
  - chain purify didn't work(didn't remove poison)
  - latency reported negative
- Fix swap
  - Swapping doesn't work with cards, the player picks them up
- Protection doesn't SHOW target being removed because target drawing is additive right now
  - Bug-ish: If you cast, "AOE, damage, protection" it will damage you before the protection removes the target, but Spell Projection doesn't show that

## Spell bugs:

- charge green line doesn't work right if unit is in the way
- Rachel says she moved twice after being frozen
