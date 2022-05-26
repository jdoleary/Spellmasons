export const PLAYER_BASE_HEALTH = 10;
export const UNIT_MOVE_SPEED = 0.25;
export const COLLISION_MESH_RADIUS = 32;
export const LOB_PROJECTILE_SPEED = 600; // in millis
export const UNIT_SIZE = COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_HEALTH = 4;
export const UNIT_BASE_MANA = 60;
export const UNIT_BASE_STAMINA = 200;
export const PLAYER_BASE_STAMINA = UNIT_BASE_STAMINA + 150;
export const UNIT_BASE_DAMAGE = 3;
export const UNIT_UI_BAR_HEIGHT = 3;
export const UNIT_UI_BAR_WIDTH = 28;
export const NON_HEAVY_UNIT_SCALE = 0.8;
export const START_CARDS_COUNT = 60;
export const MILLIS_PER_ANIMATION = 200;
export const MILLIS_PER_SPELL_ANIMATION = 400;
export const PERCENT_CHANCE_OF_HEAVY_UNIT = 10;
export const STARTING_CARD_COUNT = 3;
export const OBSTACLE_SIZE = COLLISION_MESH_RADIUS * 2;
export const MAX_PLAYERS = 8;
export const SAFETY_DISTANCE_FROM_PLAYER_SPAWN = COLLISION_MESH_RADIUS * 10;

// Mana
export const MANA_GET_PER_TURN = 10;
export const DISTANCE_FAR = 300;
export const DISTANCE_VERY_FAR = 600;

// Collision radiuses
// Make the UNIT_BASE_RADIUS a little smaller than the actual size of the image
// so that moving units can overlap with each other a bit so "crowding" looks more
// organic
export const UNIT_BASE_RADIUS = COLLISION_MESH_RADIUS / 4;

export const CAMERA_BASE_SPEED = 20;