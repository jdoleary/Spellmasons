- Fix issue where mobs can continue to move after their turn has ended
    - When this happens it can also fail to show the attention sword icon

- Lochlan feedback
    - Not enough cover to stay out of LOS of archer
    - Damage dropoff for range
    - Better archer AI, move to LOS but out of range of attack; optimal distance from character
    - Archers could have a minimal range so they can't "hip fire"
    - Special unit "marksman archers"
    - Spell to deflect projectiles to hostile targets nearby
    - Damage reduction, negation, absorbtion (anti-archer defense spells)
        - Think of faster than light or into the breach

- Bug: An archer with their center inside a wall cannot attack you
- Bug: Can go negative mana if you cast too quickly
- Bug: Had a scenario where i had a debugger on enterPortal and on image.show
and 2nd client got `Cannot change character, player not found with id 8c502be8-631c-482a-9398-40155f77c21f`
    - maybe in this case, re-request player sync??
- Bug: Spell range line stays fixed if unit is moving and mouse doesn't move
- TODO: Unit.syncronize should sync modifier images such as frozen or heavy armor
- Improve sending castCards with targeting based on id not position
- Make loading screen
- Make an overlay screen that blocks interaction while waiting for sync
- Bug: If active turn player disconnects and reconnects immediately there will be a playerTurnIndex desync
    - Reconnecting client should request new game state
- turn message is not synced after wsPie disconnect
- Unit movement desync occurred between clients when one client has CPU throttled, the non throttled client has the unit move much farther
- Fix multiplayer
    - Experienced a bug where one player portaled on one screen but not on the other
    - I throttled cpu on one client and saw a unit position desync where the non throttled client moved way farther
    - then once their positions were desynced, I tried casting on the desynced unit and it hit on one screen and missed on the other because there positions were different
    - after client 2 died on level 3, and both chose upgrades
        - client 1 experienced a "bad seed - no place to spawn players" but client 2 did not, and so they had different looking levels
    - What about if host disconnects mid step?
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