# QA Protocol
## Regular
- Run `npm run build_types` to keeps mods types up to date (and push the changes to github)
    - Test mods
    - Push types to spellmasons-mods
- Test Host Local Server, Host via Docker (run `testDockerImage.sh`)

- Test multiple separate games on the same server
- Make sure the AI can take their turn
- Test saving if you modify underworld with new elements added to the level that need to be serialized
- Test loading an old save file for backwards compatibility
- Test hosting LAN server from Electron build
- Test tutorial ALWAYS on electron build
- Run `npm run headless-build-only` to check tsc errors which `npm run bun-headless` will not catch


NEW for June:
- Make sure that p2p update doesn't break dedicated servers
NEW for July:
- Test cardmason sync on new multiplayer game
- Test wizard picker large and small
    - Make sure wizard picker works in hotseat
- Rename cardmason as deathmason with clouds and everything "Play as the Deathmason!"

--- Archived
- Uncomment: commits: `gate: Temporarily disable Cardmason until update`
- Uncomment: commits: `gate: Temporarily disable new spells until update`
    - config.IS_JULY25_UPDATE_OUT
- Test loading a saved multiplayer game
- Test Hotseat multiplayer basics
    - Test one player dying and next player carrying on to next level and make sure they both spawn



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