# Todo

## 2021.04.21 Playtest with Rachel

- Rachels screen was too small and the cards overlapped the grid
- Rachel keeps disconnecting, make it auto reconnect
- Support click and drag for queued cards
- latency graph is broken
- carge green line doesn't work right if unit is in the way
- Rachel was frozen and I had taken my turn but it said "waiting on others"
- Rachel says she moved twice after being frozen
- A damage spell is out of order, ended up on the end
  - This seems to happen right after I cast a single card, I get it back
- my turns seem to be ending unexpecedly, i just poisoned a guy and i din'dt move
- see save('cannotmovehere'), i couldn't move directly to my right or left after i killed the guy to my left, also one of the grunts wasn't moving
- Clarify descriptions for "more cards" and "card frequency" (also show how much cast range increases, give the player ALL the info to make the best decision)
- Out of time timer didn't reset and it just ended our turn over and over again until the NPCs killed us all

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
  - chain purify didn't work(didn't remove poison)

---

- Support an Overworld between levels so players can choose where to go (and choose the difficulty). It makes the game feel like a journey and gives it a setting.
- latency reported negative
- ```
  Player.js:10 Uncaught TypeError: Cannot read property 'unit' of undefined
      at Module.isTargetInRange (Player.js:10)
      at updatePlanningView (UserInterface.js:83)
      at setPlanningView (UserInterface.js:53)
      at UserInterface.js:19

      I pressed 'z' before the game was finsihed initializing
  ```

- "Mind control" spell, changes their faction temporarily?
- Change clone so that is clones all the targets once, rather than cloning one target as many times as there are empty targets
- Make websockets respond immediately to the sender to reduce latency
- Can players still resurrect after being obliterated??
- Setup steam page
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
- Protection doesn't SHOW target being removed because target drawing is additive right now
- Bug-ish: If you cast, "AOE, damage, protection" it will damage you before the protection removes the target, but Spell Projection doesn't show that

---

## Tasks

- Fix swap
  - bug: chain swapping didn't move me, this occurs when the chain retarget's self
  - Swapping doesn't work with cards, the player picks them up
- Add obstacles to spell effect? So freeze can freeze lava?

## Brad 2021.04.05

- Freezing lava should let you walk over it (casts should work on obstacles)

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds

## Features

- Units dropped into lava should die
- freezing pickup should make it not-pickupable while it's frozen??
- task: Push should push away from the target area regardless of how many targets there are

```

```
