// These double right click thresholds exist to differentiate
// a double click from two unrelated clicks.
// They are set generously enough to support double clicks for
// people who don't keep the mouse very still or who click slowly
// but constrained enough to reject false positives.
// Same speed as Microsoft: https://docs.microsoft.com/en-us/windows/win32/controls/ttm-setdelaytime?redirectedfrom=MSDN
export const RIGHT_CLICK_DOUBLE_MS_THRESHOLD = 500;
export const RIGHT_CLICK_DOUBLE_DISTANCE_THRESHOLD = 30;

export const PLAYER_BASE_HEALTH = 60; //previously 40
export const UNIT_MOVE_SPEED = 0.15;
export const COLLISION_MESH_RADIUS = 32;
// Though the size of the images for units are generally 64x64, the unit doesn't take up the full height
// and the unit is generally 50px tall.
export const UNIT_SIZE_RADIUS = 50 / 2;
// Caution: Changing this may make scroll pickups that spawn in liquid
// due to units falling in liquid unobtainable without movement spells.
// SELECTABLE_RADIUS determines the radius of both pickups and 
// the radius within which a mouse will create a target for a spell
// from a unit
export const SELECTABLE_RADIUS = 36;
export const OBSTACLE_SIZE = COLLISION_MESH_RADIUS * 2;

export const HEALTH_BAR_UI_Y_POS = 30;
export const UNIT_UI_BAR_HEIGHT = 6;
export const UNIT_UI_BAR_WIDTH = 36;

export const ARROW_PROJECTILE_SPEED = 1.5;
export const LOB_PROJECTILE_SPEED = 800; // in millis
export const UNIT_SIZE = COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_DAMAGE = 30;
// Primarily for melee Units
export const UNIT_BASE_RANGE = 10 + COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_STAMINA = 300;
export const UNIT_BASE_HEALTH = 40;
export const UNIT_BASE_MANA = 60;
// For game difficulty, I'm making the attack range less than the unit base stamina
export const PLAYER_BASE_ATTACK_RANGE = 200; // previously 240 | UNIT_BASE_STAMINA * 0.8
// For game difficulty, player stamina less than the unit stamina so they can't run away without upgrading it
export const PLAYER_BASE_STAMINA = 200; //previously 210 | UNIT_BASE_STAMINA * 0.7
export const NON_HEAVY_UNIT_SCALE = 1.0;
export const STARTING_CARD_COUNT = 3;
export const MAX_PLAYERS = 8;
export const NUMBER_OF_TOOLBAR_SLOTS = 9;
export const UNIT_MINIBOSS_SCALE_MULTIPLIER = 1.7;
export const UNIT_MINIBOSS_DAMAGE_MULTIPLIER = 2;
export const UNIT_MINIBOSS_HEALTH_MULTIPLIER = 3;
export const UNIT_MINIBOSS_MANA_MULTIPLIER = 2;

// Collision radiuses
// Make the UNIT_BASE_RADIUS a little smaller than the actual size of the image
// so that moving units can overlap with each other a bit so "crowding" looks more
// organic
export const UNIT_BASE_RADIUS = COLLISION_MESH_RADIUS / 4;

export const CAMERA_BASE_SPEED = 1500;
export const DEFAULT_ANIMATION_SPEED = 0.132;

export const CAST_RANGE_COYOTE_MARGIN = 25;
// Used to identify the PIXI.Text element on Player units the show their name
export const NAME_TEXT_ID = 'nameText';
export const NAME_TEXT_DEFAULT_SIZE = 20;
export const NAME_TEXT_Y_OFFSET = 20

// Liquid animation settings
export const LIQUID_X_SCROLL_SPEED = 400; // higher is slower
export const LIQUID_DISPLACEMENT_SPEED = 0.1;
export const LIQUID_DISPLACEMENT_SCALE = 0.6;
export const PIXI_TEXT_DROP_SHADOW = { dropShadow: true, dropShadowDistance: 1 };

// Unit difficulty will increase up to X number of players, after that the quantity of 
// units increases
export const NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES = 2;

// The boss is on this level.  Levels beyond are considered "loop" levels
export const LAST_LEVEL_INDEX = 11;
export const GORU_LEVEL_INDEX = 9; // Temporarily "turned off" by being set too high to prevent game from getting stuck on level 9
export const NUMBER_OF_UNITS_TO_MERGE = 5;
export const IS_ANNIVERSARY_UPDATE_OUT = true;
export const IS_JULY25_UPDATE_OUT = true;

// The percentage of mana Timemason drains every second
export const TIMEMASON_PERCENT_DRAIN = 1.6;

// Force Moves timeout must be changable and resettable and NOT use raceTimeout
// due to: https://github.com/jdoleary/Spellmasons/issues/352
export const FORCE_MOVE_PROMISE_TIMEOUT_MILLIS = 2_000;
export const SERVER_HUB_URL = 'https://server-hub-d2b2v.ondigitalocean.app';
export const PATHING_POLYGON_OFFSET = 10;
// WallN tiles' bounds don't fill the full 64x64 square because at "unit height", you should
// be able to see past and shoot past a wall up until, say eye level, it looks more realistic.
// the corner of a WallN tile that touches the floor shouldn't block arrows flying at 
// eye level for example.  This is what WALL_BOUNDS_OFFSET accounts for
export const WALL_BOUNDS_OFFSET = 14;
export const STAT_POINTS_PER_LEVEL = 120;
export const RUNES_PER_LEVEL = 6;
export const getSmartTargetsChunkSize = 50;
export const spawnSize = 16;
export const predictionGlowStrength = 4;
export const SPACIAL_HASH_CELL_SIZE = 128;
export const DEATHMASON_DISCARD_DRAW_RATIO = 2;
export const GORU_PLAYER_STARTING_SOUL_FRAGMENTS = 2;
export const GORU_SOUL_COLLECT_RADIUS = 100;
// percent / 100
export const GORU_SOUL_DEBT_PROPORTION_HEALTH_COST = 5 / 100;
export const NUMBER_OF_TOOLBARS = 7;
export const EXTRA_SOULS_PER_EXTRA_PLAYER = 0.7;
export const MINIBOSS_STRENGTH_MULTIPLIER = 7;
export const BASE_SOULS_LEFT_TO_COLLECT = 20;