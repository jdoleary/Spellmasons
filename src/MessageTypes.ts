export enum MESSAGE_TYPES {
  SPELL,
  MOVE_PLAYER,
  CHOOSE_UPGRADE,
  END_TURN,
  LOAD_GAME_STATE,
  // Ping a location on the map
  PING,
  // Vote for a level to go to in the overworld
  VOTE_FOR_LEVEL,
  SELECT_CHARACTER,
  // Sent from a client that has detected a major desync from the host
  // TODO: Is this unused now that I'm syncing things independently with the below 3 messages?
  DESYNC,
  // Used to ensure that all clients have up-to-date unit state (and RNG seed as a ride-along) before
  // the AI takes their turn
  // Note: It is important that sync messages are handled synchonously, especially when the RNG seed is
  // involved or else it could sync in parallel with a codepath that would quickly unsync it
  SYNC_UNITS,
  // Ensures that Players are syncronized between clients
  // Note: Excludes player units because units are already synced with SYNC_UNITS message
  SYNC_PLAYERS,
  SYNC_UNDERWORLD


}
