export const PLAYER_BASE_HEALTH = 10;
export const UNIT_BASE_MOVE_DISTANCE = 200;
export const COLLISION_MESH_RADIUS = 32;
export const LOB_PROJECTILE_SPEED = 600; // in millis
export const UNIT_SIZE = COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_HEALTH = 3;
export const UNIT_BASE_MANA = 60;
export const UNIT_BASE_DAMAGE = 1;
export const UNIT_UI_BAR_HEIGHT = 3;
export const UNIT_UI_BAR_WIDTH = 28;
// Ensures that the resolveDoneMoving callback will timeout if it never gets called.
// This ensures that the game doesn't get stuck if, say, the collision system bugs
// out and a unit never comes to rest
export const RESOLVE_DONE_MOVING_TIMEOUT_MS = 2000;
export const UNIT_MOVE_SPEED = 4;
export const NON_HEAVY_UNIT_SCALE = 0.8;
export const START_CARDS_COUNT = 60;
export const NUM_PICKUPS_PER_LEVEL = 2;
export const MILLIS_PER_ANIMATION = 200;
export const MILLIS_PER_SPELL_ANIMATION = 400;
export const PERCENT_CHANCE_OF_HEAVY_UNIT = 10;
export const NUMBER_OF_UPGRADES_TO_CHOOSE_FROM = 5;
// Map
export const OBSTACLE_SECTORS_COUNT_HORIZONTAL = 5;
export const OBSTACLE_SECTORS_COUNT_VERTICAL = 3;
// Obstacle sectors must be squares
export const OBSTACLES_PER_SECTOR_WIDE = 3;
export const OBSTACLES_PER_SECTOR_TALL = OBSTACLES_PER_SECTOR_WIDE;
export const OBSTACLE_SIZE = COLLISION_MESH_RADIUS * 2;
export const MAP_WIDTH = OBSTACLE_SIZE * OBSTACLE_SECTORS_COUNT_HORIZONTAL * OBSTACLES_PER_SECTOR_WIDE;
export const MAP_HEIGHT = OBSTACLE_SIZE * OBSTACLE_SECTORS_COUNT_VERTICAL * OBSTACLES_PER_SECTOR_TALL;

// Mana
export const MANA_GET_PER_TURN = 10;
export const DISTANCE_FAR = 300;
export const DISTANCE_VERY_FAR = 600;