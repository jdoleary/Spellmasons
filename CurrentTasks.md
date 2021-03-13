# Todo

## Bugs

- brad got 'cannot read property unit of undefined'
- I'm going twice and brad goes once
- it doesn't wait for both players to enter portal, it ends after one enters the portal
- AI affects player units too, brads guy attacked me
- Dead players can take turns

## 3.12

- Add portal and concept of levels
  - Seed level difficulty based on level number
  - Random mobs, and rocks
- Add pickups

## 3.13

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

- How to handle applying multiple freeze cards??
  - removing one removes them all
- fix floating text position due to pixi js
- Clean up onDataQueue (is it still necessary?)
- Fix replay?

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
