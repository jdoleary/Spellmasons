export const PLAYER_BASE_HEALTH = 100;
export const UNIT_BASE_MOVE_DISTANCE = 120;
export const UNIT_BASE_ATTACK_RANGE = 120;
export const COLLISION_MESH_RADIUS = 32;
export const UNIT_BASE_HEALTH = 3;
export const UNIT_BASE_MANA = 10;
export const UNIT_BASE_DAMAGE = 1;
export const UNIT_MOVE_SPEED = 4;
export const NON_HEAVY_UNIT_SCALE = 0.8;
// Stops units from moving when they are close enough
export const UNIT_STOP_MOVING_MARGIN = 1;
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const SECONDS_PER_TURN = 100;
export const START_CARDS_COUNT = 60;
export const NUM_PICKUPS_PER_LEVEL = 2;
export const NUM_OBSTACLES_PER_LEVEL = 10;
export const MILLIS_PER_ANIMATION = 200;
export const MILLIS_PER_SPELL_ANIMATION = 200;
export const PERCENT_CHANCE_OF_HEAVY_UNIT = 10;
export const NUMBER_OF_UPGRADES_TO_CHOOSE_FROM = 5;
export const PORTAL_COORDINATES = {
  x: MAP_WIDTH - COLLISION_MESH_RADIUS,
  y: MAP_HEIGHT / 2,
};

// Overworld
export const OVERWORLD_HEIGHT = 9;
export const OVERWORLD_MAX_WIDTH = 9;
export const OVERWORLD_SPACING = 100;

// Mana
export const MANA_BASE_COST = 8;
// * 1 will not change the mana, therefore 1 is a "none" multiplier
export const MANA_MULTIPLIER_NONE = 1;
export const MANA_MULTIPLIER_SM = 2;
export const MANA_MULTIPLIER_M = 3;
export const MANA_MULTIPLIER_L = 3;
export const MANA_GET_PER_TURN = 5;
// An arbitrary number which affects the multiplying affect that distance has on mana cost
// A bigger number means distance costs less.  
// distance/SPELL_DISTANCE_MANA_DENOMINATOR is what the mana is multiplied by
export const SPELL_DISTANCE_MANA_DENOMINATOR = 100;
