## 2022.02.08 Brad
- If i have someone selected and click off it should deselect
- Brad pickuped cards and kept playing and was later suprised at his new cards. Make it obvious
- Poison unit AI is broken, didn't attack when resurrected
- Way to see how much mana a card costs without clicking on it
- Need pathfinding so you can't just hide and get all your mana back
- Chain needs a radius to show how far away chaining will occur, maybe
- Movement spells could help you cast farther than you should be able to and move a far unit into another group and chain them, cause it should keep the target after they move
- I wish i could bring goons with me through the portal
- Cloned unit didn't get a headband
- Brad got confused about the order of chain and damage; there should be a UI element to help 
- Clone caused guys to spawn out of bounds
- Animating golem attack causes it to change z-index; or maybe clones of brad's player unit is turning into an attack golem and attacking
- Chaining too many units crashed the game
- If there are too many units they can stutter their position and it gets stuck on NPC turn cause they don't resolve the move promise; add a timeout to the move promise
- comments on mana:  there's too many times where i run out of mana and have to run around until it gets back
- Chain clone is too cheap
- UI issue where top yellow bar didn't render and the whole UI was messed up and there was a space at the bottom of the canvas
## 2022.02.08 Brad discussion
 Talked about making spells more expensive as you use them to incentivize creativity and to remove the possibility where there are ever moments where the solution is to just fireball everything on screen (which is boring).  He also suggested maybe adding another tradeoff for surplus mana, like spending it to do something somehow, maybe purchase something?
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
  - I'm not actually sure how this happened since the host does send out sync messages via hostSendSync already.
- No action needed: Click for info doesn't conflict with click to cast in brad's opinion he just cleared it out when he needed to inspect (maybe I could change the cursor too to help with this)
- Queued spell should reset on next level
- Need better way to tell what spells are going to do
## 2022.02.07 Erin
- Erin expected to see line from me to enemies when casting chain to show that it's casting from me
- WONT DO: Bug: Summoner was hiding under portal - confusing
- WONT DO: Bug: Protection removes the target but not the drawn line with chain
- WONT DO: Bug: Chain targets dead units
- DONE: Bug: Animated sprite caused a dead unit to appear alive.  It was a skeleton for a moment but switched back - maybe mid attack
- DONE: Bug: Chain showed up in upgrades when I already had it.  This is because I got it through a pickup so it wasn't listed in the upgrades array
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


- Question for Brad: Do you like charge and should it trigger pickups when it moves you?