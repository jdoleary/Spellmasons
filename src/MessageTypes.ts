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
  // Helps determine if clients are out of sync
  GAMESTATE_HASH,
  // Sent from a client that has detected a desync from the host
  DESYNC
}
