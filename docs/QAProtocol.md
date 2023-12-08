# QA Protocol
## Regular
- Run `npm run build_types` to keeps mods types up to date (and push the changes to github)
    - Test mods
- Test Host Local Server, Host via Docker (run `testDockerImage.sh`)
- Test loading a saved multiplayer game
- Test Hotseat multiplayer basics
- Test liquid
- Test rerolling spells and perks
- Test all pickups in singleplayer
- Test all pickups in multiplayer
- Test Pickups + movement spells prediction (trap)
- Test allies carrying on the battle
    - both when you kill yourself and when an enemy kills you
- have a multiplayer game with 1 player, beat a level, then connect with another player

- Test all spells in multiplayer: ~20 minutes
    - and end turn after each to test for desyncs
- Test all spells in singleplayer: ~24 minutes
- Test tutorial ALWAYS on electron build
- Test saving if you modify underworld with new elements added to the level that need to be serialized
- Test hosting LAN server from Electron build
- Test that F12 works in electron build
- Merge master branch to keep it up to date
- Test loading an old save file for backwards compatibility

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