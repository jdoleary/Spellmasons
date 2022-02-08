## 2022.02.07 Brad
- There were 3 clients, I closed one client, brad didn't vote.  It moves me into the game but left him on the vote screen
- Revisit the idea of cards if they're not treated like playable cards
- Number below them to show hotkeys
- idea: Pickups should be destroyable if you cast on them
- Feedback UI for mana multiplier
- Why can you target skeles but not destroy them?
- If you have just enough mana, enemies are both targetable and not depending on which side of their circle you hover over.  Make it so that casting on enemies always shows the value of their actual distance.  This was a bug for UI but the game logic didn't let him cast because it's using his location
- On accidental disconnect. it shows him as disconnected on my screen even though he can still take his turn and move around.  He didn't get to pick an upgrade because I moved on beyond that screen. "shouldn't he still get his level up reward?" even if the game has moved on.  Error shows "Client is already associated with a Player instance, so a new one cannot be created. 01c0d178-5b46-4d75-a0f4-98cc3b1c2d46"
- There was a desync with enemy units
  - On brads screen later one of the units went through a wall (didn't collide)
  - It happened again when brad clicked on the portal but there was a wall in the way.  On his screen he stopped and had to manually navigate around it but for me I got to the upgrade screen before he was in which suggests that he wasn't colliding
  - Maybe this happens when animations are occurring while a window loses focus?
- Click for info doesn't conflict with click to cast in brad's opinion he just cleared it out when he needed to inspect (maybe I could change the cursor too to help with this)
- Queued spell should reset on next level
- Need better way to tell what spells are going to do
## 2022.02.07 Erin
- Erin expected to see line from me to enemies when casting chain to show that it's casting from me
- Bug: Summoner was hiding under portal - confusing
- Bug: Protection removes the target but not the drawn line with chain
- Bug: Chain targets dead units
- Bug: Animated sprite caused a dead unit to appear alive.  It was a skeleton for a moment but switched back - maybe mid attack
- Bug: Chain showed up in upgrades when I already had it.  This is because I got it through a pickup so it wasn't listed in the upgrades array
## 2021.04.22 Playtest with Brad

- We desynced unit positions until brad finished his turn, then it synced back up (one included a new spawned unit from summoner)
- Brad desynced when he charged
- It's somehow not Brad's turn on his screen (timer 0:00), but he's still casting on my screen and I have 0:42 seconds left. It seems to be that our turnTimeRemaining timers are far off

## 2021.04.21 Playtest with Rachel

- Fixed now?
  - Rachel was frozen and I had taken my turn but it said "waiting on others"
- my turns seem to be ending unexpecedly, i just poisoned a guy and i din'dt move

## 2021.03.24 Brad feedback
  - Needs balance, at the end you have a lot of cards but you die quickly
  - having less, stronger units is more of a challenge than having many, weak units
  - show the rarity of cards to a player?
    - Expose the raw variables to the player so they can make calculated positions
---


- Question for Brad: Should Protection protect any single ally? So that it can work for both players if you stack it?
  - stash: "protection stackable"
- Question for Brad: Do you like charge and should it trigger pickups when it moves you?