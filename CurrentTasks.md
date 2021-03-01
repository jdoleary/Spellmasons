- Tooltip box (for seeing info when you click on golems / players / spells)
- Refactor game.nextTurn into the game phases
- Clean up onDataQueue (is it still necessary)

- Allow rejoining with saved client id

- Clean up dead units

```js
// Clean up DOM of dead units
// Note: This occurs at the beginning of a turn so that "dead" units can animate to death
// after they take mortally wounding damage without their html elements being removed before
// the animation takes place
for (let u of this.units) {
  if (!u.alive) {
    // Remove image from DOM
    u.image.cleanup();
  }
}
// Remove dead units
this.units = this.units.filter((u) => u.alive);
```

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
