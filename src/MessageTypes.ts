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
  // JOIN_GAME allows the host to queue up
  // sending a player that just connected the gamestate.
  // It should include all data necessary to fully instantiate a player
  // for the client that just joined
  // Note: Not to be confused with joining a room via wsPie.  This message
  // is specific to Spellmasons, and is how a client gets the current gamestate
  JOIN_GAME,
  // Occurs synchronously, fully replaces the game state
  LOAD_GAME_STATE,
  // Ping a location on the map
  PING,
  // Sent from a client that has detected a major desync from the host
  // TODO: Is this unused now that I'm syncing things independently with the below 3 messages?
  DESYNC,
  CREATE_LEVEL,
  SET_PHASE,


}
