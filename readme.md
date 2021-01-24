## Setting
8x8 board
Wizard's heart on either end
Turn based
    - Players turns execute simultaneous (but do wait for the other to finish).  When they are both done, spells will take effect, then the units will move
Mana
    - Player one starts with 2 max
    - Player two starts with 3 max
    - Each turn gain 1 max until 8 (or 10?)
First player to have their "heart" destroyed loses
Player's summons have no loyalty!  They just attack in the direction they are moving, which makes turning them potentially make them a problem for the other player


## Summons 
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
    - Already has "Destruct" modifier
    - Remains on field until it is destroyed
    - Summon on any tiles

## Spells
- Deal damage -1 mana -1 health 
- Heal 
    - -2 mana +1 health
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

## Spell Modifiers
- Trap
    - Spell lies latent on a tile until it is triggered
    - -4 mana
- Time delay
    - Sets spell on tile like a trap but to execute at a given time (turn)
    - +1 mana per turn delayed
- Area Of Effect
    - Affect a cell and the cells directly around it
    - -2 mana
- Chain 
    - Duplicates spell for any touching cells recursively
    - -3 mana
- Greater Chain 
    - Duplicates spell for any spells with 2 squares recursively
    - -8

## Golem Modifier Spells
- Avoid obstacles 
    - Move diagonal when facing an obstacle rather than attacking
- Destruct
    - Deal health as damage to self and target

## Tech
- Typescript
- DOM not pixijs for now
- Lots of tests for game state, build from day 1 with WebsocketPie contract