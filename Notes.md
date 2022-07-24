# Notes
- Sometimes player 2's cards get clobbered via a syncPlayers but is fixed on the next sync players.  I think this only occurs due to devMode choosing upgrades really fast but it might be worth watching carefully
---
Into the breach notes:
  - Shows what's going to happen next turn
  - Shows when something's going to die
  - Makes ONE button the obvious next choice
    - (click to cast, backspace to cancel)
  - everything labeled
  - doesn't waste your time
  - Menu screen shows faded game in background to show you are still in a game
  - Uses gifs to show how moves work
---
[How to destroy](https://www.html5gamedevs.com/topic/30539-correct-way-to-remove-sprites-container/):
```
correct way is

IKnowParentContainer.removeChild(thisSmallThingy);

but sometimes you dont remember where did you put it!

myContainer.parent.removeChild(myContainer);

and sometimes you know that it wont be used anymore AT ALL. Then if all Text and Sprites elements doesnt have textures that you will use in future, you can destroy all textures inside

myContainer.parent.removeChild(myContainer);
myContainer.destroy({children:true, texture:true, baseTexture:true});

But dont worry. If you dont destroy things, javascript gc and our own pixi gc will take care of that in a few minutes.

The only evil thing is generated textures, its better if you destroy renderTextures you created. If you dont know whats a renderTexture, dont worry ;)
```
---
Current server url: https://play.spellmasons.com/?pieUrl=wss%3A%2F%2Fwebsocketpie-3oyno.ondigitalocean.app%2F&game=abc
---
Requirements for animation management
- A callback can be triggered at a key Moment in an animation, for example: to launch a projectile
- The game must be able to wait for an animation to complete before moving on
- Be able to change animations without interrupting the above requirements
---

- Global coordinates if you need them: `const pixiCoords = app.renderer.plugins.interaction.mouse.global;`

- Make animations trigger based on each card that's cast in order

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
The underworld setup and player setup need to occur via pie messages: underworld from the LOAD_GAME_STATE message and player from the CHANGE_CHARACTER and they should happen in that order

## Brad feedback 2022-02-04
- I can't tell who i am
- I want the tooltip menu to happen on click
- I can't tell how far I can move
- Want there to be pathfinding to go around obstacles
- Assumption: if grunts can move close to me they should also be able to attack me
  - This is blocked because there's no longer a resolveDoneMoving promise due to how it can cause desync
- when trying to figure out the effect of a spell, he doesn't know what it'll do (damage to enemy and how much health they have)
- Health net result for health should show on health/mana tooltip
- Expectation: health would reset on new level
- "Control key" tooltip should always show something even if it's dirt ("This is dirt, it's not important, I don't recommend casting spells here")
- If I wanna see information on a guy, I don't want to be restricted in hovering over him.  I wanna see that information and still be able to move my mouse, which is why I wanna be able to select
- Click to select (even dirt), then use a cast button with hot key to trigger the spell