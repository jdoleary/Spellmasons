export enum MESSAGE_TYPES {
  SPELL,
  MOVE_PLAYER,
  SPAWN_PLAYER,
  ADMIN_COMMAND,
  ADMIN_CHANGE_STAT,
  // For rearranging player cards
  PLAYER_CARDS,
  PLAYER_CONFIG,
  ENTER_PORTAL,
  CHOOSE_UPGRADE,
  END_TURN,
  // INIT_GAME_STATE is very similar to LOAD_GAME_STATE, in fact, they run identical code
  // paths. 
  // LOAD_GAME_STATE is used synchronously for an already initialized game that needs to
  // load to a new state, while INIT_GAME_STATE is processed immediately
  INIT_GAME_STATE,
  CHANGE_CHARACTER,
  // Occurs synchronously, fully replaces the game state
  LOAD_GAME_STATE,
  REQUEST_SYNC_GAME_STATE,
  // Ping a location on the map
  PING,
  CREATE_LEVEL,
  SET_PHASE,
  SYNC_PLAYERS,
  // Shows other players what another player is up to
  PLAYER_THINKING,


}
