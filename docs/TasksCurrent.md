- Bug: Got a "player is udnefined" error from checkForGetCardOnTurn Player.js:58 immediately after closing a tab of a connected client
```
TypeError: player is undefined
    checkForGetCardOnTurn http://localhost:8081/dist/Player.js:58
    initializePlayerTurn http://localhost:8081/dist/Underworld.js:270
    endPlayerTurn http://localhost:8081/dist/Underworld.js:321
    onClientPresenceChanged http://localhost:8081/dist/wsPieHandler.js:172
```
- Ideas 2021-12-17
  - (L) Mana Update
    - (M) Cost mana for each card and the farther away you cast so there is no range limit (this allows for more strategy, more tradeoffs)
    - (S) Never run out of cards, you're limited by mana instead (this way you don't get stuck)
      - Update Card management, how do you get new cards now?
    - (S) New cards for mana, mana potions
  - (L) Get rid of cells / Allow free movement
    - This might make judgements about AI danger more dynamic and less boring and mathematical
    - This may simplify movement code as it relates to units getting in each others way
    - Update pathing
    - Cast spells with base radius, or on nearest enemy or cursor?
    - (S) Lots of little bad guys, some big ones; Smaller units visually
  - (S) Heros have much more health, bad guys die more quickly, getting hit isn't as big of a deal, so you don't have to worry about overcalculating agro range, you can be more **intuitive** in your play.
  - (s) Categories of spells, the combinable ones (cards), the special spells (teleport and such) limited in use - represent them differently (with, say, a hexagon, for the ones that can get used up)
    - Make these pickupable (call them runes?) and they persist between levels
  - (L) Rather than an overworld, what if you and your team have to mix potions in a cauldron to create a portal that leads you to a unique level? (The cauldron makes the portal)
    - This adds another tradeoff, the more dangerous the portal, the greater the reward for surviving it.
    - Should cauldron have bounds so players can't under do the difficulty or over do it?
    - Should there be a time constraint for end game? so you can only make so many culdrons?
    - In the boss battle, maybe you need to protect the culdron and there's no portal?
- (M) wsPie: how to handle reconnection
  1. Reconnection when the server goes down and comes back up (loses room state)
  2. Reconnection when the client goes down and comes back up (keeps room?)
  - How to handle user joining mid stage (say during overworld or during underworld)?
- More spells:
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)
- Improve / Fix Spells:
  - What happens when you clone yourself?
  - Charge doesn't play well with AOE
  - chain purify didn't work(didn't remove poison)
