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

NEW for July:
- Test disconnection string near backupSaveName jprompt
- Test deathmason discard count on multiplayer (non host)
- Test cardmason sync on new multiplayer game
- Test wizard picker large and small
    - Make sure wizard picker works in hotseat
- i18n:green_portal_desc
- check soul quantity when loading
- deathmason locked discard cards persists on client between turn phases
- Test that deathmason doesn't discard entire hand until beginning of next turn
- Test the "+ soul fragments" floating text doesn't show up on other player's screens above their own player
- Verify that corruption particles don't hang around in multiplayer with multiple deathmasons
- Test peer connection logging.  Limit to only in steam lobby
- export const IS_JULY25_UPDATE_OUT = true;
- Test difficulty of DM and Goru with adjusted Skill Points

--- Archived
- Uncomment: commits: `gate: Temporarily disable Cardmason until update`
- Uncomment: commits: `gate: Temporarily disable new spells until update`
    - config.IS_JULY25_UPDATE_OUT
- Test loading a saved multiplayer game
- Test Hotseat multiplayer basics
    - Test one player dying and next player carrying on to next level and make sure they both spawn
