- Headless Server
  - Contrary thought: May not need headless server:
    - So long as turn order is enforced, even wsPie should be sufficient
    - There are only 2 things that change state
      1. Player action
      2. CPU turn
      - So long as the game state is identical between clients before CPU turn occurs (and the RNG is in the same state). the clients should remain synced.
      - Maybe I can hash the gamestate and compare to validate that the clients' gamestates are the same. Try npm's object-hash for this
        - object-hash can hash a string of 1120398 bytes in 3.8ms
  - When client joins, server sends client full game state
  - When client takes action
    - It is sent to server which updates it's local state and sends the message (with message id to all clients)
  - Q: How to build clients so that it can update it's state out of order, so if it starts with state A, executes order C and then recieves B? Could it rollback to A, play B and then replay C?
  - Should all messages be reversable?  Is this over engineering? Or would it never get to the point where it executes out of order because users can only act when it's their turn, so if it's their turn, they act (it's reflected immediately on the client) and then it waits to execute all new messages until it receives the one it just sent.
  - RNG will have to be able to be synced over the network, RNG desynces feel more likely, like with AI movement.  So if I send messages like grunt at 3B moves to 7D and if there is no grunt at 3B the client will trigger a desync error and request the full gamestate from the server and 
  force update it's local.  I should collect metrics on how often this happens, because ideally it should never happen. 
- Ideas 2021-12-17
  - Smaller and more units
  - Get rid of cells / Allow free movement
    - This might make judgements about AI danger more dynamic and less boring and mathematical
  - Cast spells with base radius
  - Cost mana for each card and the farther away you cast so there is no range limit (this allows for more strategy, more tradeoffs)
  - Never run out of cards, you're limited by mana instead (this way you don't get stuck)
  - New cards for mana, mana potions
  - Interactive environment (freeze water to walk on, ignite grass to spread fire)
  - Lots of little bad guys, some big ones
    - Heros have much more health, bad guys die more quickly, getting hit isn't as big of a deal, so you don't have to worry about overcalculating agro range, you can be more **intuitive** in your play.
  - Categories of spells, the combinable ones (cards), the special spells (teleport and such) limited in use
- wsPie: how to handle reconnection
  1. Reconnection when the server goes down and comes back up (loses room state)
  2. Reconnection when the client goes down and comes back up (keeps room?)
- More spells:
  - Vanish (loses agro) (invisible for x number of turns) "creating separation"
  - Taunt (gain agro)
- Improve / Fix Spells:
  - What happens when you clone yourself?
  - Charge doesn't play well with AOE
  - chain purify didn't work(didn't remove poison)
- Rather than an overworld, what if you and your team have to mix potions in a culdrun to create a portal that leads you to a unique level?
- More interaction with tiles / obstacles
  - Maybe pushing an enemy into another unit does damage, into a wall does damage, into a movable obstacle appplys the obstacle's "arrived" effect
  - Freezing lava should let you walk over it (casts should work on obstacles)
  - Add tree, which can spread burn?
- Moving or dropping enemies or self into lava