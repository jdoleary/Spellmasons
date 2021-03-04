# Todo

## Ideas

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
