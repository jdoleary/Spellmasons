- why does swap use Unit.setLocation but charge uses Unit.moveTo? Is there a bug here?
- What about a prisoner AI that you can unleash, or traps that you can unlease in a line
- keybinding common spells
- Holding down "z" should show safe squares to move to
- What's to stop player from just bumming around to get extra cards via turnsPerCard?
  - Maybe only as long as there are enemies alive? Or set a hand max?
  - Or just make sure the enemies are hard enough that killing time is dangerous, also since cards now reset between levels this may not be a problem
- Maybe refactor how setWalkableAt works rather than doing it piece-meal, doing it all at once, once the grid is needed? to prevent bugs where a cell will appear walkable but wont be because some odd state left it as false walkable instead of true walkable
- After I disconnected, I closed my browser, rejoined, Brad's player was stuck between two cells and i joined as a new player instead of the old
  - Make loading occur only after animations are done
- It's possible that summoner could block you from finishing the level by summoning too many allies
- enemies should not be able to be on the portal
- Try to reproduce: Game.findPath (114) cannot set property 'g' of undefined
  - pathfinding.js:1286 endNode.g = 0
- Reproduce: wehn you choose ALL the spells in your hand, the active spell div shifts down because the card hand div is now empty
- projectiles are on the containerSpells container and so get cleared when mouse moves
  - Do i need to make AI casts work the same way that player casts do??
- Convert console.error(s) to Sentry.captureException?? before deployment?
- let our faction go before enemy units go
- How to best handle not being able to find a random empty cell? This can mess up things like entering a portal
  - see all `if(coords){...}` or all calls to `getRandomEmptyCell`
- Swapping should only work with a target, not an empty spell
- Does swap overlay (green line) still show?
- is removing units when their bones take damage a footgun? See Unit.ts: `window.game.units = window.game.units.filter((u) => u !== unit);`
- quality of life: If you click on the portal and no enemies remain, then auto move there
- There should be an icon for out of range
- Player can still move after freezing themselves on during their turn
- "level 1" text never appears on load
- Refactor, card UI reconciliation algorithm is slow
- corpse image doesn't save when a game is loaded and a unit is dead
  - textures should be saved using pixi sprite texture cache instead of this.imageName
- Card Push needs some work, it doesn't work great due to not using initiateIntelligentAIMovement and order of operations
- Swap can have unexpected effects if the aoe swap targets overlap with the caster original location, units may end up in an unexpected position, need batching to solve this
- 2021-03-24 Brad feedback
  - Needs balance, at the end you have a lot of cards but you die quickly
  - having less, stronger units is more of a challenge than having many, weak units
  - show the rarity of cards to a player?
    - Expose the raw variables to the player so they can make calculated positions
- Don't let players cast fizzle spells (AOE or chain without damage)
- How do players know what their upgrades are
- notify which players have left to upgrade
- why do we keep accidentally ending our turns (force of habit with spacebar being used in auto chess?)
- You get "cannot move more than once per turn" while spell animations are firing
- Celebratory damage counter for huge combos!
- Event manager for granting dark card when you slay ally
- Number keys to queue up spells

- Probability 0 can still spawn if the roll rolls 0
- Bug: Verified, when I alt tab it desyncs

- Fix sometimes Game.playerTurnIndex is out of sync

  - Maybe this happened because I was alt-tabbed when he took his turn

- Fix replay?

  - This should be easy now that onDataQueue has been restored

- Taunt totem
- Tile effects
  - Lava
  - Tree
  - Burn
  - Poison
- Spells

  - sythe cleaver
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)

- Add "Dark" cards for killing an ally
  - Sacrifice
    - Lose 3 cards at random for health
  - Obliterate
    - Sends everything in range into the void (has a special effect on portals - secret level)
  - Corrupt
- OMA asked for cooperative AI to play with
