# Todo
- Support recentering the screen when the window resizes
- Support smaller screens (like Rachels) that don't show the whole map
- Networking: Fix desync issues by making the server the single source of truth
  - See DesyncTHoughts.md
- More spells:
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)
- Improve / Fix Spells:
  - What happens when you clone yourself?
  - Charge doesn't play well with AOE
  - chain purify didn't work(didn't remove poison)
  - Some kind of visible error mechanism to show when cards don't apply
    - Don't let players cast fizzle spells (AOE or chain without damage)
    - Like if you cast "Protection" on yourself and then AOE it does nothing because there are no targets to AOE off of
    - Or if you cast cards out of order like Dicard without a card after it
- Rather than an overworld, what if you and your team have to mix potions in a culdrun to create a portal that leads you to a unique level?
- More interaction with tiles / obstacles
  - Maybe pushing an enemy into another unit does damage, into a wall does damage, into a movable obstacle appplys the obstacle's "arrived" effect
  - Freezing lava should let you walk over it (casts should work on obstacles)
  - Add tree, which can spread burn?
- Moving or dropping enemies or self into lava
- Juice: Animate cards


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

## bugs

- These bugs occurred while playtesting with Rachel but I haven't been able to reproduce myself
  - chain purify didn't work(didn't remove poison)
  - latency reported negative
