# Todo

- Fix all known bugs
- Fix replay (control with arrow keys?)
- Projectile Animation
- Ranged blue golem
- Movement spells "swap"
- Wizard customization
- Terrain (stuck units move laterally?)
- Event manager for granting dark card when you slay ally

## Brad 2021-3-18

- Number keys to queue up spells
- After new level, agro radius doesn't go away

## bugs

- The get hit Animation can sometimes bring golems off their location
  - Sometimes after shake due to damage animation a golem will move an entire cell to the left
- Bug: Verified, when I alt tab it desyncs
- BUG: Sometimes it skips other players turn when one goes through the protal
- Fix sometimes Game.playerTurnIndex is out of sync
  - Maybe this happened because I was alt-tabbed when he took his turn
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
