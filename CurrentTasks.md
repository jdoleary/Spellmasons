# Todo

## Bugs
- Loading
  - Fix restore cards after disconnect

- Sometimes one player gets to move and then it goes directly to NPC instead of letting the other player move
- Prevent overlapping units

## 3.14

- Make status modifiers (freeze) stack for x number of turns
- Move and cast in one turn
- Mob agro based on distance
- Fix LOADING
  - maybe "creating" a game and loading a game should be the same. It takes a game state and initializes everything. This would work for saving, loading, or just starting a game, and would enable clients to join part way through.
  - You must decouple the client connection with the game state
- Add tile effects
- Make relics
- Add more spells
  - (buffs / dots)

## Ideas

What if choosing cards collected them in your inventory instead of in a pool and you could combine them at will before you cast them and they would combine in predictable ways ("Binding of Isaac" style). And you could walk around the board with the other player and choose to be verses or cooperative

- Two actions per turn (move, move; move, cast; cast, cast)
- Taunt totem
- Once per game "super moves"
- Spell ideas
  - sythe cleaver
  - Vanish (invisible for x number of turns) "creating separation"
- Larger board size
- Mega spells that don't combine and fill the whole pool
- Relics placed on map with aura effects
- Cusomize wizard stats
- Wizard as unit on map
- Tile effects "burn/poison"
- Allow wizards to join game in progress

## Other

- Fix Mosters can spawn on top of things
- Fix? Brad died after chain healing himself while there were also golems on top of him
- How to know order of operations for golems
- How to handle applying multiple freeze cards??
  - removing one removes them all
- Clean up onDataQueue (is it still necessary?)
- Fix replay?
- Allow rejoining with saved client id
