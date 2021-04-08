# Todo

- Swapping should only work with a target, not an empty spell
  - Add spell teleport? How would it work with multiple targets?
- Make units clickable for information
  - Need way to count modifiers
- brad says AOE freeze \*4 did nothing
- raise dead units should set units risen to 1 health
- Units dropped into lava should die
- Enemy spellcasters that could poison YOU!
- Enemy priest
- freezing pickup should make it not-pickupable while it's frozen??
- we got too many cards for the end to be challenging
- some units should do extra damage
- bug: 2 vulnerables and a damage only did 2 damage
- feature: Chain should chain through dead bodies
- bug: clearing cards doesn't clear target overlay
- Task: When it says one player left to pick upgrades, still remove the upgrade cards cause you already chose
- task: Push should push away from the target area regardless of how many targets there are
- task: Persist (save/load) (and allow for removing via purify) modifiers, work with poison and purify as examples
- bug: in game.ts sometimes upgrade element content doesn't exist for some reason
- bug: chain swapping didn't move me, this occurs when the chain retarget's self
- bug: When last player dies and there are no NPCs it enters infinite loop

  - bug: checkForEndOfLevel has infinite loop

- Cohesive spells
  - effect: EffectFn
  - modifiers
  - events
- balance

## Brad 2021.04.05

- Every tile should be clickable and give a description
- Freezing lava should let you walk over it (casts should work on obstacles)
- archer hit me after i portaled due to my locationzz
- keybinding common spells
- Holding down "z" should show safe squares to move to

---

- let our faction go before enemy units go

- Add batching to card effects?

## Bugs Suspected Fixed

- BUG: Sometimes it skips other players turn when one goes through the protal

## bugs

- Bug: Loading doesn't work if clientIds have changed reassigning clientIds
