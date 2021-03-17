# Todo

## brad feedback 2021.03.17

- Do you get anything for killing the golems?
- Click on your hero and right click to move, click on unit to get information
- BUG: When other player picks up cards it doesn't persist correctly to the other client
- BUG: Golems can pickup cards
- BUG: "SHielded from 2 damage" triggered when brad healed
- traps are too common, damage isn't common enough
- Should be able to move, then cast
- BUG: Sometimes after shake due to damage animation a golem will move an entire cell to the left

## bugs

- Fix sometimes Game.playerTurnIndex is out of sync
  - this caused the game to desync golem movement (replays'desync1' and 'desync2')
  - a clue: window.game was unset for the client that was out of sync
  - This happened after a golem picked up a card
  - Maybe this happened because I was alt-tabbed when he took his turn
- Sometimes one player gets to move and then it goes directly to NPC instead of letting the other player move

  - **I think this is now fixed**

- Card's desynced (cannot read property remove of undefined)
- Seed desynced after portaling
  - this is not due to differing pie messages
- Skipped ally's turn after portaling
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

## Other

- Clean up onDataQueue (is it still necessary?)
- Fix replay?
