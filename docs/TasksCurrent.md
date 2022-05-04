- TODO: Unit.syncronize should sync modifier images such as frozen or heavy armor
- TODO: Change obstacles to tiles
    - Since i'll be using wave function collapse obstacles will have different bounds
    - A tile will be an image and bounds (maybe multiple)
- Tiles made up of
    - ground
    - wall
    - water
    - void


- Improve sending castCards with targeting based on id not position
- Separate level data generation with level image generation

- Make an overlay screen that blocks interaction while waiting for sync
- Bug: You can go into negative mana if you fire off spells quickly
- Bug: If active turn player disconnects and reconnects immediately there will be a playerTurnIndex desync
    - Reconnecting client should request new game state
- turn message is not synced after wsPie disconnect
- disconnect image is not synced after reconnect
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- Fix multiplayer
    - Experienced a bug where one player portaled on one screen but not on the other
    - I throttled cpu on one client and saw a unit position desync where the non throttled client moved way farther
    - then once their positions were desynced, I tried casting on the desynced unit and it hit on one screen and missed on the other because there positions were different
    - after client 2 died on level 3, and both chose upgrades
        - client 1 experienced a "bad seed - no place to spawn players" but client 2 did not, and so they had different looking levels
    - Unit attributes that need syncing:
        - x,y
        - health/mana; max and current
        - alive
        - faction
    - ALTERNATIVELY, should all actions just be calculated on the host and sent to all clients:
        - e.g. grunt 1 moves to x,y and does z damage to unit3
        - e.g. summoner summones 1 grunt at x,y
    - What about if host disconnects mid step?
    - Things and times to SYNC from host to all clients
        - Sync level after level generation
        - Sync NPCs/units before NPC turn
        - Sync player after portaling
# Tasks
- **Important** Improved level design with Wave Function Collapse
- Make freeze block pathing
- Lerp in and out when WASD camera

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip