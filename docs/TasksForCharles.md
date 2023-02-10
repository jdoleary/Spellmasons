
- bug: Pickup text is weird on scrolls that are restored from desync
- UI bug: conserve appears to not work until you move your mouse (or after mana vampire hits you) because the mana bar doesn't refresh after it triggers until you move mouse
- balance: debilitate should not stack exponentially (it should go x2, x4, x6 instead of x2,x4,x8)
- optimization: shrink data being sent in SET_PHASE, especially for pickups, you don't need much to recreate a pickup
- UX: show how much a summon will cost before using Capture Soul https://steamcommunity.com/app/1618380/discussions/0/3766733981707919283/
- bug: poisoner miniboss with debilitate got 5.33333 health in tooltip

- bug: Poison floating text doesn't account for debilitate, if a unit has debilitate on them poison deals 20 damage but the floating text says "10" the floating text should use the correct damage number 
- Stats bars refreshing bugs:
  - bug: health bars aren't refreshed on start of turn, you have to move your mouse
  - ui bug: when a new player joins, enemy health shows as half until you move your mouse
- Split ally players still stay split after going through portal when the portal is supposed to clear modifiers
- when mana vamp removes your max mana it shouldn't also remove overflow mana
- fortify doesn't reduce damage when shield is applied
- put a visual limit on animation of absurdly high rend stacks (https://discord.com/channels/1032294536640200766/1072755895911587963/1072755898688217128)
    - no spell should take that long
- UI: Limit queued spells box growth for chains over 50, it should just obscure the earlier ones and show the late ones


https://docs.google.com/spreadsheets/d/1q8psSC162NBjcVUzBNM4Ci5XQlv3KDphSnMAIBHvGTk