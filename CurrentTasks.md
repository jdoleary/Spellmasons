# Todo

## Bugs

---

- PieClient reports "cyclic object value" when one client refreshes and then another does
  - This is probably due to loading game state, not pie client

## 3.14

- Fix LOADING
  - Image.ts adds sprite
    - Pickups add images
    - Units add images
  - Gmae.ts adds tile sprites
- Add tile effects
- Make relics
- Add more spells
  - (buffs / dots)

## Ideas

What if choosing cards collected them in your inventory instead of in a pool and you could combine them at will before you cast them and they would combine in predictable ways ("Binding of Isaac" style). And you could walk around the board with the other player and choose to be verses or cooperative

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
