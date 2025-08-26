# QA Protocol
## Regular
- Run `npm run headless-build-only` to check tsc errors which `npm run bun-headless` will not catch
- Test hosting LAN server from Electron build
- Test tutorial ALWAYS on electron build
- Test Host Local Server, Host via Docker (run `testDockerImage.sh`)
- Run `npm run build_types` to keeps mods types up to date (and push the changes to github)
    - Test mods
    - Push types to spellmasons-mods
- Make sure the AI can take their turn
- Test saving if you modify underworld with new elements added to the level that need to be serialized
- Test loading an old save file for backwards compatibility

Next:
- [ ] Back compat: underworld.events is not iterable

August:
- [x] Verify that new license is included with game
- [x] Disable doom scroll mod for now
- [x] Single player difficulty increases on load
- [x] Check Remote Play Together on Default build



NEW Content for July:
- [x] After playing a game as deathmason if you switch to spellmason you have no mana
- [x] Test deathmason discard count on multiplayer (non host)
- [x] Test cardmason sync on new multiplayer game
- [x] Test wizard picker large and small
    - [x] Make sure wizard picker works in hotseat
- [x]check soul quantity when loading
- [x] test tutorial for deathmason and goru
- [x] deathmason locked discard cards persists on client between turn phases
- [x]Test that deathmason doesn't discard entire hand until beginning of next turn
- [x]Test the "+ soul fragments" floating text doesn't show up on other player's screens above their own player
- Verify that corruption particles don't hang around in multiplayer with multiple deathmasons
- Test peer connection logging.  Limit to only in steam lobby
- [x] export const IS_JULY25_UPDATE_OUT = true;
- [x] fix: Stamina bar not updating while another player is casting
- [x] Test Goru soul fragment desync by swappign with corpses as soon as you kill them in multiplayer to see if the number of soul fragments remains stable
- [x] Test hotseat with Goru and Deathmason
- [x] 2nd player goru should start with the right amount of souls
- [x] set IS_JULY25_UPDATE_OUT to true

- Peer verification
    - [x] Test: Version mismatch jprompt in p2p - 85ece8e50b6834ad01f5e56aedf3410e71319ee7
    - Test that syncPlayers will remove extra players locally if the host is sending a smaller players list.  Also test with a larger players list
    - [x] Verify that peer send isn't sending message to self
    - [x] Verify non host can't see difficulty options
    - [x] Playing singleplayer to joining from invite
    - [x] Play singleplayer, quit, host, invite friend, start game


--- Archived
- Test loading a saved multiplayer game
- Test Hotseat multiplayer basics
    - Test one player dying and next player carrying on to next level and make sure they both spawn
