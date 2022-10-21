// These double right click thresholds exist to differentiate
// a double click from two unrelated clicks.
// They are set generously enough to support double clicks for
// people who don't keep the mouse very still or who click slowly
// but constrained enough to reject false positives.
// Same speed as Microsoft: https://docs.microsoft.com/en-us/windows/win32/controls/ttm-setdelaytime?redirectedfrom=MSDN
export const RIGHT_CLICK_DOUBLE_MS_THRESHOLD = 500;
export const RIGHT_CLICK_DOUBLE_DISTANCE_THRESHOLD = 30;

export const PLAYER_BASE_HEALTH = 4;
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

export const HEALTH_BAR_UI_Y_POS = 30;
export const UNIT_UI_BAR_HEIGHT = 5;
export const UNIT_UI_BAR_WIDTH = 34;

export const LOB_PROJECTILE_SPEED = 600; // in millis
export const UNIT_SIZE = COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_HEALTH = 4;
export const UNIT_BASE_MANA = 60;
export const UNIT_BASE_STAMINA = 300;
// For game difficulty, I'm making the attack range less than the unit base stamina
export const PLAYER_BASE_ATTACK_RANGE = UNIT_BASE_STAMINA * 0.8;
// For game difficulty, player stamina less than the unit stamina so they can't run away without upgrading it
export const PLAYER_BASE_STAMINA = UNIT_BASE_STAMINA * 0.7;
export const UNIT_BASE_DAMAGE = 3;
export const NON_HEAVY_UNIT_SCALE = 1.0;
export const STARTING_CARD_COUNT = 3;
export const OBSTACLE_SIZE = COLLISION_MESH_RADIUS * 2;
export const MAX_PLAYERS = 8;
export const NUMBER_OF_TOOLBAR_SLOTS = 10;
export const UNIT_MINIBOSS_HEALTH_MULTIPLIER = 3;
export const UNIT_MINIBOSS_DAMAGE_MULTIPLIER = 2;

// Mana
export const MANA_GET_PER_TURN = 10;

// Collision radiuses
// Make the UNIT_BASE_RADIUS a little smaller than the actual size of the image
// so that moving units can overlap with each other a bit so "crowding" looks more
// organic
export const UNIT_BASE_RADIUS = COLLISION_MESH_RADIUS / 4;

export const CAMERA_BASE_SPEED = 20;
export const ENEMY_ENCOUNTERED_STORAGE_KEY = 'enemyEncountered';
export const DEFAULT_ANIMATION_SPEED = 0.132;

export const CAST_RANGE_COYOTE_MARGIN = 25;
// Used to identify the PIXI.Text element on Player units the show their name
export const NAME_TEXT_ID = 'nameText';
export const NAME_TEXT_DEFAULT_SIZE = 20;
export const NAME_TEXT_Y_OFFSET = 20

export const STORAGE_ID_PLAYER_COLOR = 'player-color';
export const STORAGE_ID_PLAYER_NAME = 'player-name';

// Liquid animation settings
export const LIQUID_X_SCROLL_SPEED = 400; // higher is slower
export const LIQUID_DISPLACEMENT_SPEED = 0.1;
export const LIQUID_DISPLACEMENT_SCALE = 0.6;
export const PIXI_TEXT_DROP_SHADOW = { dropShadow: true, dropShadowDistance: 1 };