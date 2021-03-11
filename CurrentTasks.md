# Todo

## 3.11

- Convert to pixijs
  - https://github.com/kittykatattack/learningPixi#settingup
- Add player as unit on board
  - Add player movement
- Add portal and concept of levels
- update cards to combine at bottom, remove spell pools, make cards combine only when about to cast
- Add pickups

## 3.12

- Make relics
- Add more spells
- Improve turn management
- Update golems to move toward player

## Ideas

What if choosing cards collected them in your inventory instead of in a pool and you could combine them at will before you cast them and they would combine in predictable ways ("Binding of Isaac" style). And you could walk around the board with the other player and choose to be verses or cooperative

- Larger board size
- Mega spells that don't combine and fill the whole pool
- Relics placed on map with aura effects
- Cusomize wizard stats
- Wizard as unit on map
- Tile effects "burn/poison"

## Other

- Clean up onDataQueue (is it still necessary?)
- Fix replay?
- Hide cards button

- Allow rejoining with saved client id

- Check for game over

```js
for (let p of this.players) {
  // Lastly, Check for gameover
  if (p.heart_health <= 0) {
    this.setGameState(game_state.GameOver);
    this.state = game_state.GameOver;
    alert('Game Over');
  }
}
```
