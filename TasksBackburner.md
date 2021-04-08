- quality of life: If you click on the portal and no enemies remain, then auto move there
- There should be an icon for out of range
- Player can still move after freezing themselves on during their turn
- bug: Game over triggers too early if the player is ressed in the same turn that they die
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

- Clean up onDataQueue (is it still necessary?)
- Fix replay?

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
