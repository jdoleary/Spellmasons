## Matt Ideas

- Spell pool (3 spells that you channel and build up over time)
- Both players share common deck to pick cards from
  - at the beginning of each turn, they are presented with 8 cards and they pick one at a time until they've each picked 3 which they can apply to spells they're summoning
- Some super powerful cards have secondary negative effects which trigger as soon as you pick them (spawns a golem on your side)
- Golems spawn randomly (not controlled by the players) (they foil your plans)
- (maybe) the more damaged your opponent is the more golums come your way (blue shell)
- Spells fire in a line

Game phases:

- Pick (both players apply "cards" to their spells (one at a time alternating))
- NPC (golems spawn and/or advance)
- Cast (players cast one at a time)

## Elements

Elements as building blocks for combined spells:

- time
- position
  - Aura / AOE
  - Adjacent
- state
  - wet / poisoned / etc
- unit attribute
  - e.g. health, strength, etc
    - e.g. has effect relative to health remaining
- movement / collision
- random chances

## Plan

- Iterate as much as possible through playtesting
- Refactor as necessary to keep the codebase robust and simple to work in

## Game values and Pillars

(via [Charlie Cleveland](https://www.charliecleveland.com/game-pillars/))

- Pillar: Ultimate creativity in Spellcasting

## Pathfinding
- Need only path around outside corners

Ways to determine which points are branchable 
  - If the start point of the intersection is coming from the outside (this would solve both problems of inside corners and going through obstacles
    - requires that memory maintains and understanding of inside and outside
    - works for non squares
  - Collision points on the same shape could reject all but the closest corners (only solves problem 2)
    - requires that memory maintains a list of shapes

  - If there is an intersection keep adding next and prev to 2 new paths until the next line doesn't collide with the same shape