## Features

- Alt click to ping a cell on the board to other players
- Use window.save and window.load to persist the game state
- Left click to select or cast, right-click to move
- Press 'Z' key to toggle planning view
- Press 'Escape' to clear selected cards

## Setting

8x8 board
Wizard's heart on either end
Turn based - Players turns execute simultaneous (but do wait for the other to finish). When they are both done, spells will take effect, then the units will move
First player to have their "heart" destroyed loses
Player's summons have no loyalty! They just attack in the direction they are moving, which makes turning them potentially make them a problem for the other player

## Cards, Modifiers and Effects

Cards use a common api to allow for them to compose with each other.
Some cards add modifiers and modifiers add events. Events are functions that are triggered when certain events occur.

See Cards.ts, Modifiers.ts, and Events.ts for more information

## Spells

- Summon
  - Summon Hefty Golem
    - More health, more damage, can blast through multiple and keep moving
  - Summon golem
    - Golems move like pawns automatically
    - Golems do not have "owners", they just move in the direction they're facing
      - This is core to the gameplay, it means that any unit could be an ally or enemy and their position and the direction that they are facing matters a lot.
    - -2 mana
    - TODO balance cost of summoning golem with golem health and cost to destroy golem (should be equal probably)
  - Summon Boulder
    - -3 mana
    - Has health equal to golem health
    - Remains on field until it is destroyed
    - Summon on any tiles
- Direct Health
  - Deal damage -1 mana -1 health
  - Heal
    - -2 mana +1 health
- Physical Movement
  - Force push
    - -2 mana / cell moved (any direction)
  - Force rotate
    - Rotates the direction a golem is facing
    - RANDOM direction left or right so it takes two successful rotations to make them attack the enemy
- Freeze
  - Prevent golem from moving for x turns
  - -1 mana / turn
  - Can't apply freeze to an already frozen golem, so when you decide how many turns to freeze them you have to be careful because after that time is up, they are guarunteed at least one move
  - Frozen units can't deal damage
- Steal Life
  - -x own health for +x mana

## Assets

Using kenny game assets

## Notes

Minor versions are incremented for functional non-broken commit states that should be able to run without changes.
