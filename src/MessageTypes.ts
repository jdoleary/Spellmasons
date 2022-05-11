export enum MESSAGE_TYPES {
  SPELL,
  MOVE_PLAYER,
  ENTER_PORTAL,
  CHOOSE_UPGRADE,
  END_TURN,
  // INIT_GAME_STATE is very similar to LOAD_GAME_STATE, in fact, they run identical code
  // paths; however, INIT_GAME_STATE can occur before readyState.isReady() while
  // LOAD_GAME_STATE is used synchronously for an already initialized game that needs to
  // load to a new state
  INIT_GAME_STATE,
  CHANGE_CHARACTER,
  // Occurs synchronously, fully replaces the game state
  LOAD_GAME_STATE,
  // Ping a location on the map
  PING,
  CREATE_LEVEL,
  SET_PHASE,
  // Shows other players what another player is up to
  PLAYER_THINKING,


}
