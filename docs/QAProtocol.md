# QA Protocol
- Test tutorial
- Test all spells in singleplayer: ~24 minutes
- Test all spells in multiplayer: ~20 minutes
    - and end turn after each to test for desyncs
- Test liquid
- Test all pickups in singleplayer
- Test all pickups in multiplayer
- Test Pickups + movement spells prediction (trap)
- Test allies carrying on the battle
    - both when you kill yourself and when an enemy kills you
- have a multiplayer game with 1 player, beat a level, then connect with another player
- Test rerolling spells and perks
- Test hosting local server

## v.1.7.0
- bug after dying and starting a new game, spawning a spell makes it jump to me
- target column yields 2 columns when hovering over a pickup
- conserve doesn't show that it works until you move your mouse
- slow seems to not work right on multiplayer when cast on self
- clone makes pickups dust appear on prediction when portal is up?
- BIG BUG: Hotseat multiplayer : `player managed to choose an upgrade without being supposed to` and it doens't let you move on


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