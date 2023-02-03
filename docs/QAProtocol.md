# QA Protocol
- Test all spells in singleplayer: ~24 minutes
- Test all spells in multiplayer: ~20 minutes
    - and end turn after each to test for desyncs
- Test liquid
- Test all pickups in singleplayer
- Test all pickups in multiplayer
- Test Pickups + movement spells prediction (trap)
- Test allies carrying on the battle

# Release protocal
- QA: 1:44
- Announce server down time
- Make build for mac and PC
- Transfer them to main computer and upload to Steam
- Test in `Testing` build

- Release at announced time
- Update servers (Walrus must be updated manually)
- Make post in Steam and ask users to update

## Findings:
- index.fdcafa98.js:5 Dev warning: poison supportsQuantity; however quantity was not provided to the addModifier function.
- unit standing on health pickup looked like it triggered it but then died anyway, this is now due to the async nature of when pickups are handled.  If the unit is taking exactly death damage