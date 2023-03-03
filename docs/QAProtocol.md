# QA Protocol
- Run `npm run build_types` to keeps mods types up to date (and push the changes to github)
    - Test mods
- Test Host Local Server, Host via Docker
- Test tutorial
- Test all spells in multiplayer: ~20 minutes
    - and end turn after each to test for desyncs
- Test all spells in singleplayer: ~24 minutes
- Test liquid
- Test all pickups in singleplayer
- Test all pickups in multiplayer
- Test Pickups + movement spells prediction (trap)
- Test allies carrying on the battle
    - both when you kill yourself and when an enemy kills you
- have a multiplayer game with 1 player, beat a level, then connect with another player
- Test rerolling spells and perks

## Validate v.1.8.0
- Test Host Local Server, Host via Docker (particularly because of mods)
- Make Korean as a supported language again
## Validate v.1.7.0
- slow seems to not work right on multiplayer when cast on self
- clone makes pickups dust appear on prediction when portal is up?


# Release protocal
- QA: 1:44
- Announce server down time
- Make build for mac and PC
- Transfer them to main computer and upload to Steam
- Test in `Testing` build

- Release at announced time to normal build
- Update servers (Walrus must be updated manually since it uses docker hub)
- Make post in Steam and ask users to update

## Findings:
- index.fdcafa98.js:5 Dev warning: poison supportsQuantity; however quantity was not provided to the addModifier function.
- unit standing on health pickup looked like it triggered it but then died anyway, this is now due to the async nature of when pickups are handled.  If the unit is taking exactly death damage