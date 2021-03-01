- Clean up onDataQueue (is it still necessary?)

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
