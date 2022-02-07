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