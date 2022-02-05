# Notes

- Global coordinates if you need them: `const pixiCoords = app.renderer.plugins.interaction.mouse.global;`

- Make animations trigger based on each card that's cast in order

  - What if rather than using an AnimationTimeline, I just made the turns actually asyncronous and animations happened right when a change occurred?
  - Types of animations
    - Projectiles,
    - Targeting
    - Unit position, rotation, scale animations
    - Unit image changing (skeleton)

- advice: need more diversity of challenge with the enemy types than just "avboid that line"
- [Spell Hooks](https://docs.google.com/spreadsheets/d/1PntBWT4twXoKRKBZBOg7zZtWNzoqtfu6SD-EMQYedt4/edit#gid=0)
- Idea: what if there was a planning phase where you could pick your arsenal of cards once you see the board to prevent doom state?

Added in v6-ordered-spell-system:

- What I need is a SYSTEM that is so expressive you can write all spells using it's API without any logic written elsewhere outside of the spell file.
  - If it can handle obliterate, and swap and others it will be very expressive and powerful
  - If all "hooks" such as "preDamage" are pure and chained then interrupts such as freeze and shield will be possible
  - Hooks may have to have their own state (such as shield)
  - **What if the order that you clicked the spells mattered? Like AOE/Swap is different from Swap/AOE**

---

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

---
## Message order
In order to join a game a client needs a fully readyState (pie connection, pixi assets, pie room joined, underworld setup, player setup)
The underworld setup and player setup need to occur via pie messages: underworld from the LOAD_GAME_STATE message and player from the CHOOSE_CHARACTER and they should happen in that order

## Brad feedback 2022-02-04
- I can't tell who i am
- I want the tooltip menu to happen on click
- I can't tell how far I can move
- Want there to be pathfinding to go around obstacles
- Bug: My cards array emptied somehow.  I got purify from a pickup, picked max health, and now my spell hand are empty
- Assumption: if grunts can move close to me they should also be able to attack me
- UI: mana cost thing disappeared for brad
  - if you press shift while your on a guy it makes the mana tooltip come back (it depends on the existance of the info tooltip)
- when trying to figure out the effect of a spell, he doesn't know what it'll do (damage to enemy and how much health they have)
- Health card description should tell how much it heals
- Health net result for health should show on health/mana tooltip
- I wanna see mana/turn
- On level pick: "Consensus is x location.  Changing in 5... 4.."
- Expectation: health would reset on new level
- Put health/mana (spell effect) tooltip in realestate instead of follow mouse
- Bug: It didn't end brads turn when he died
- Bug: When I pick an upgrade before brad has selected an upgrade it leaves the upgrade screen up while it changes his background to the level select screen
- Shift tooltip should always show something even if it's dirt ("This is dirt, it's not important, I don't recommend casting spells here")
- If I wanna see information on a guy, I don't want to be restricted in hovering over him.  I wanna see that information and still be able to move my mouse, which is why I wanna be able to select
- Click to select (even dirt), then use a cast button with hot key to trigger the spell