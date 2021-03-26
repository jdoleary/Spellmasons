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

- restore subsprites after load

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
