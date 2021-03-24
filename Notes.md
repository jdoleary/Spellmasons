# Notes

Game Design thoughts:
Each level should be fun, even early on. Prevent "doom state" (impossible scenario based on state). Randomness adds potential for excitement and narrow escapes. Add risk/reward mechanics so users can tune their difficulty.
Progression feels good.
It's not fun to be out of cards, but it's not fun to have infinite damage (there has to be a reason NOT to use it).

- It IS fun planning your approach to beating a level with your friends.
- It IS fun when luck goes your way.
- It IS fun to present risk/reward.
- It is NOT fun to be in doom state.
  - What if every golem you kill grants you a card?
- It is NOT fun when using your "rocket launcher" is disincentivised.
  - What if you can't take them with you to the next level?

---

- Clients desyncing issue:

  - Seed desynced after portaling
  - this is not due to differing pie messages
  - this is not due to picking up cards
  - **solution** this is because when another player loads they get the gamestate immediately, but not the number of times that the seeded random had already rolled
    - Oddly, sometimes both clients trigger the LOAD_GAME_STATE and sometimes only one does, which is why it desyncs
    - Looks like this can happen when I'm developing and it automatically refreshes

- Upgrades are still granted like cards, so that a user can choose to use 2 aoe as a HUGE AOE or to use smaller AOE's twice
