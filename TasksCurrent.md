# Todo

- Feature: Abilities, not cards. (Wizard customization)
  - After every level, you choose things that modify your character, you choose from a few options like choosing heros in autochess which allows your character to evolve uniquely and bit by bit over the course of the game
  - IDEA: RATher than cards you have abilities and you can limit strong ones by the number of times you can use them in a level
  - IDEA: Auto attack is one of the things that can get upgrdaded
- Turn abilitiy indicator "move", "cast", "skip"
- **Bug**: "push" spell doesn't work well for multiple units when it would make them run into each other
  - based on order of operations sometimes they don't move, when they should,
    - they're not really blocked by an ally golem, because the ally will move out of the way
- Terrain (stuck units move laterally?)

## Bugs Suspected Fixed

- BUG: Sometimes it skips other players turn when one goes through the protal
- BUG: Dead player still able to cast and keeps moving????
  - Players don't resurrect AGAIN
- After new level, agro radius doesn't go away

## Brad 2021-03-21

- "Weird that I got a card and then moved"
- Make turn timer show if you have a move or cast left or both
- BUG: "Closest player" is always seeking brad
- BUG: I froze a guy, brad moved, and the guy still hit brad
  - Frozen applied via a trap is instantly removed
    - How to solve status changes (poison, frozen) that can be applied at any time but are supposed to trigger after a unit takes their turn
- BUG: Clicking multiple times caused brad to mvoe twice

## bugs

- Shield should apply to a single turn, not to an amount of damage
