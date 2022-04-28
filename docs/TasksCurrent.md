# Game Breaking Priorities
- Fix multiplayer
    - Experienced a bug where one player portaled on one screen but not on the other
    - I throttled cpu on one client and saw a unit position desync where the non throttled client moved way farther
    - then once their positions were desynced, I tried casting on the desynced unit and it hit on one screen and missed on the other because there positions were different
    - after client 2 died on level 3, and both chose upgrades
        - client 1 experienced a "bad seed - no place to spawn players" but client 2 did not, and so they had different looking levels
# Tasks
- Change portal to just a "go to upgrade" button
    - ~~Fix infinite stamina when you end level~~
- Make selected cards background transparent
- Improved level design with Wave Function Collapse
- Make freeze block pathing
- Allow drag and drop between cards and far left or far right.
- Lerp in and out when WASD camera
- Prevent skipping levels by running to portal or swapping there

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip