export enum MESSAGE_TYPES {
  SPELL,
  MOVE_PLAYER,
  SET_PLAYER_POSITION,
  SPAWN_PLAYER,
  ADMIN_COMMAND,
  ADMIN_CHANGE_STAT,
  // For rearranging player cards
  PLAYER_CARDS,
  PLAYER_CONFIG,
  ENTER_PORTAL,
  CHOOSE_UPGRADE,
  CHOOSE_PERK,
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
  QUEUE_PICKUP_TRIGGER,
  CREATE_LEVEL,
  SET_PHASE,
  SYNC_PLAYERS,
  SYNC_SOME_STATE,
  // Shows other players what another player is up to
  PLAYER_THINKING,
  // Allows a client to inhabit a disconnected player character
  JOIN_GAME_AS_PLAYER,
  SET_MODS,
  SET_GAME_MODE,
  SPEND_STAT_POINT,
  FORCE_TRIGGER_PICKUP,
  PREVENT_IDLE_TIMEOUT,
  // Could add typing indicator in future
  CHAT_SENT,
}
