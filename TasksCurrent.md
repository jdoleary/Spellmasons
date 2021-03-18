# Todo

- Remove select in favor of Alt key view/planning mode
- redo action points so that actions are number of cast per turn and walking can't go twice
- Prevent golems from attacking each other / set golem health to 1 instead of 4

## brad feedback 2021.03.17

- Bug: Verified, when I alt tab it desyncs
- The get hit Animation can sometimes bring golems off their location
- BUG: Sometimes it skips other players turn when one goes through the protal
- BUG: After death and on new level I didn't return visible but could still move
- What happens if one player is already portaled but the other player dies (does incrementPlayerTurn stack overflow)
- BUG: Alt key doesn't trigger after you've held it down, release and pressed it again until you click, then it works again

## bugs

- Sometimes after shake due to damage animation a golem will move an entire cell to the left
- Fix sometimes Game.playerTurnIndex is out of sync
  - Maybe this happened because I was alt-tabbed when he took his turn
- Seed desynced after portaling
  - this is not due to differing pie messages
  - this is not due to picking up cards
  - **solution** this is because when another player loads they get the gamestate immediately, but not the number of times that the seeded random had already rolled
    - Oddly, sometimes both clients trigger the LOAD_GAME_STATE and sometimes only one does, which is why it desyncs
    - Looks like this can happen when I'm developing and it automatically refreshes
- Skipped ally's turn after portaling
  - Could not reproduce
- Frozen applied via a trap is instantly removed
  - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
- Shield should apply to a single turn, not to an amount of damage
- restore subsprites after load
- Because attacks happen instantly and the animations are stuttered, the textual feedback of the effect of the animation is lost because they all happen at the same time (loosing health for example)
  - What if the animations occur directly in the event log rather than in the gameplay functions. This will allow them to trigger one at a time and also allow them to cause NEW gameplay changes (such as get a card for slaying ally mage) right when the animation occurs
  - Improve animation groups. You should be able to play multiple transforms together and trigger callbacks when they are done.
  - If animations cause gameplay changes, will that affect loading? if a load is requested mid-animation?

## 2021.3.17

- Add more golem types (use tint on white parts of units to give them special colors)
  - Boss (demon)
  - Ranged (blue)
  - Fast (sand)
  - Jumping (red)
- Add "Dark" cards for killing an ally
  - Sacrifice
    - Lose 3 cards at random for health
  - Obliterate
    - Sends everything in range into the void (has a special effect on portals - secret level)
  - Corrupt
- Add more spells
  - Push spell
  - Poison

## Backburner Ideas

- [UDP](https://www.html5rocks.com/en/tutorials/webrtc/datachannels/)

- Mobs that end your turn if you get within range of them
- It would be useful to move spell effects into where each card is defined
- Taunt totem
- Tile effects
  - Lava
  - Tree
  - Burn
  - Poison
- Spells
  - sythe cleaver
  - Vanish (invisible for x number of turns) "creating separation"
- Mega spells that don't combine and fill the whole pool
- Classes with cards for each class
  - each class should have a movement spell
- "blue shell" ability so you're never in doom state
- Wizard modification between levels if you portal

## Other

- Clean up onDataQueue (is it still necessary?)
- Fix replay?
