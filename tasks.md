# Tasks

- Overall
  - Fix incorrect client count
  - Caster is undefined comes from reconnecting with a different clientid
  - Waiting for player to reconnect should only change if one of the two active players leave
  - Allow single player early start game for testing quickly
  - Stats UI
  - Damage/spell effects

- Spells

  - Physical Movement Spells
  - Steal life
  - Modifiers
    - Trap
  - Golem Modifiers
    - set destruct

- Figure out how to allow units to all move and attack in the context of destruct, because it changes it's health when it destructs

## Notes
- Do not mix Svelte with the gamestate