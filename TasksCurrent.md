# Todo

- Feature: Abilities, not cards.

  - Feature: Add upgrading

- Fix replay (control with arrow keys?)
- Wizard customization
- Terrain (stuck units move laterally?)
- Event manager for granting dark card when you slay ally

## Brad 2021-03-21

- BUG: Sometimes it skips other players turn when one goes through the protal
  - Should be fixed now
- "Weird that I got a card and then moved"
- Make turn timer show if you have a move or cast left or both
- BUG: "Closest player" is always seeking brad
- BUG: Dead player still able to cast and keeps moving????
  - Players don't resurrect AGAIN
- BUG: I froze a guy, brad moved, and the guy still hit brad
  - Frozen applied via a trap is instantly removed
    - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
- BUG: Clicking multiple times caused brad to mvoe twice
- IDEA: RATher than cards you have abilities and you can limit strong ones
  by the number of times you can use them in a level
- IDEA: Auto attack is one of the things that can get upgrdaded

## Brad 2021-3-18

- Number keys to queue up spells
- After new level, agro radius doesn't go away
- A move turn and THEN a cast turn rather than both in one turn to reduce friction for players
- Missing a sense of progression
  - character progression is important

## bugs

- **Bug**: "push" spell doesn't work well for multiple units when it would make them run into each other
  - is there a way to batch it?
  - based on order of operations sometimes they don't move, when they should,
    - they're not really blocked by an ally golem, because the ally will move out of the way
- Probability 0 can still spawn if the roll rolls 0
- Bug: Verified, when I alt tab it desyncs
- Fix sometimes Game.playerTurnIndex is out of sync
  - Maybe this happened because I was alt-tabbed when he took his turn
- Shield should apply to a single turn, not to an amount of damage
- restore subsprites after load

## 2021.3.17

- Add taunt agro
- Add more golem types (use tint on white parts of units to give them special colors)
  - Boss (demon)
  - Ranged (blue)
  - Fast (sand)
  - Jumping (red)
- Add "Dark" cards for killing an ally
  - Sacrifice
    - Lose 3 cards at random for health
  - Obliterate
    - Sends everything in range into the void (has a special effect on portals - secret level)
  - Corrupt
- Add more spells
  - Push spell
  - Poison

## Backburner Ideas

- [UDP](https://www.html5rocks.com/en/tutorials/webrtc/datachannels/)

- Mobs that end your turn if you get within range of them
- It would be useful to move spell effects into where each card is defined
- Taunt totem
- Tile effects
  - Lava
  - Tree
  - Burn
  - Poison
- Spells
  - sythe cleaver
  - Vanish (invisible for x number of turns) "creating separation"
- Mega spells that don't combine and fill the whole pool
- Classes with cards for each class
  - each class should have a movement spell
- "blue shell" ability so you're never in doom state
- Wizard modification between levels if you portal

## Other

- Clean up onDataQueue (is it still necessary?)
- Fix replay?
