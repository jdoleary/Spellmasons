# Game Breaking Priorities
- Upgrade bug where you click more than once and it triggers many levels to generate
    - Add a loading scrren
    - only allow one click
- Chain and AOE use real units array not dryRunUnits array on prediction cast
- Mana per turn upgrade doesn't work at all
- Death circle is gone

# Tasks
- Unfreeze at end of turn, not beginning
- Make selected cards background transparent
- Improved level design with Wave Function Collapse
- Make freeze block pathing
- Improve unit MELEE attack prediction so it will only show exclamation if they will actually hit you
- Allow drag and drop between cards and far left or far right.
- Fix infinite stamina when you end level
- Fix summoner summoning goons right in front of them
- Bug: Is healing prediction bar still broken?
- Cards in upgrade screen should show mana cost
- Lerp in and out when WASD camera
- Prevent skipping levels by running to portal or swapping there
- Add labels to screens (upgrade, char select)

# Stale, but important bugs

- The zoom coordinates off issue between multiplayer sessions when casting
    - hit on one screen, miss on another
- Optimize pathing

# Juice
- Cards flip as you drag-n-drop over them
- Improved unit tooltip