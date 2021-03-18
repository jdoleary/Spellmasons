# Todo

- Refactor animation manager
  - Redo animation system and make events system to support ALL visuals occurring on a timeline
    - supports triggering things such as getting new cards in hand when you move onto cards or slay an ally mage
  - Because attacks happen instantly and the animations are stuttered, the textual feedback of the effect of the animation is lost because they all happen at the same time (loosing health for example)
    - What if the animations occur directly in the event log rather than in the gameplay functions. This will allow them to trigger one at a time and also allow them to cause NEW gameplay changes (such as get a card for slaying ally mage) right when the animation occurs
    - Improve animation groups. You should be able to play multiple transforms together and trigger callbacks when they are done.
    - If animations cause gameplay changes, will that affect loading? if a load is requested mid-animation?
      - not if the visual are all that's animating and the gameplay state still changes immediately
- The get hit Animation can sometimes bring golems off their location
  - Sometimes after shake due to damage animation a golem will move an entire cell to the left

## bugs

- Bug: Verified, when I alt tab it desyncs
- BUG: Sometimes it skips other players turn when one goes through the protal
- Fix sometimes Game.playerTurnIndex is out of sync
  - Maybe this happened because I was alt-tabbed when he took his turn
- Skipped ally's turn after portaling
  - Could not reproduce
- Frozen applied via a trap is instantly removed
  - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
- Shield should apply to a single turn, not to an amount of damage
- restore subsprites after load

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
