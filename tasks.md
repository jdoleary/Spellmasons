# Tasks

- MVP

  - Units move when they attack
  - Golems grow rather than spawn and start weaker
  - Show UI for where to allow clicks and UI for pending golem spawn
    - Spells have images too (this is the indicator that shows the player where it's going to be cast)
  - health and damage cell highlights

- Overall

  - Caster is undefined comes from reconnecting with a different clientid
    - Refreshed game doesn't trigger spells (caused by parent issue of clientIds changing)
  - Waiting for player to reconnect should only change if one of the two active players leave

- Spells
  - Physical Movement Spells
  - Modifiers
    - Trap
    - Turn

## Notes

- Do not mix Svelte with the gamestate
