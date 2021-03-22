# Notes

- Clients desyncing issue:

  - Seed desynced after portaling
  - this is not due to differing pie messages
  - this is not due to picking up cards
  - **solution** this is because when another player loads they get the gamestate immediately, but not the number of times that the seeded random had already rolled
    - Oddly, sometimes both clients trigger the LOAD_GAME_STATE and sometimes only one does, which is why it desyncs
    - Looks like this can happen when I'm developing and it automatically refreshes

- Upgrades are still granted like cards, so that a user can choose to use 2 aoe as a HUGE AOE or to use smaller AOE's twice
