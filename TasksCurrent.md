# Todo
## 2021.3.16
- restore subsprites after load
---
- Event.ts file where you can add content based on events that happened
- Show health when damaged or on hover
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
- Add Relics
- Add more spells
  - Push spell
  - Poison
- Add tiles
  - Lava
  - Tree

## Bugs
- Fix sometimes Game.playerTurnIndex is out of sync
  - this caused the game to desync golem movement (replays'desync1' and 'desync2')
  - a clue: window.game was unset for the client that was out of sync
  - **I think this is now fixed**
- Sometimes one player gets to move and then it goes directly to NPC instead of letting the other player move
  - **I think this is now fixed**

## Content
- Add tile effects
- Make relics

## Ideas
- [UDP](https://www.html5rocks.com/en/tutorials/webrtc/datachannels/)

- Mobs that end your turn if you get within range of them
- Taunt totem
- Spell ideas
  - sythe cleaver
  - Vanish (invisible for x number of turns) "creating separation"
- Mega spells that don't combine and fill the whole pool
- Relics placed on map with aura effects
- Cusomize wizard stats
- Tile effects "burn/poison"

## Other

- How to know order of operations for golems
- Clean up onDataQueue (is it still necessary?)
- Fix replay?
