import type * as PIXI from 'pixi.js';
import * as storage from "../storage";
import * as config from '../config';
import * as Image from '../graphics/Image';
import * as math from '../jmath/math';
import { distance } from '../jmath/math';
import { addPixiSpriteAnimated, containerDoodads, containerUnits, PixiSpriteOptions, startBloodParticleSplatter, updateNameText } from '../graphics/PixiUtils';
import * as colors from '../graphics/ui/colors';
import { UnitSubType, UnitType, Faction } from '../types/commonTypes';
import type { Vec2 } from '../jmath/Vec';
import * as Vec from '../jmath/Vec';
import * as CardUI from '../graphics/ui/CardUI';
import Events from '../Events';
import makeAllRedShader from '../graphics/shaders/selected';
import { addLerpable } from '../lerpList';
import { allUnits, UnitSource } from './units';
import { allCards, allModifiers, EffectState } from '../cards';
import * as immune from '../cards/immune';
import { checkIfNeedToClearTooltip, clearSpellEffectProjection, drawUICircle } from '../graphics/PlanningView';
import floatingText, { queueCenteredFloatingText } from '../graphics/FloatingText';
import Underworld, { turn_phase } from '../Underworld';
import combos from '../graphics/AnimationCombos';
import { raceTimeout } from '../Promise';
import { closestLineSegmentIntersection } from '../jmath/lineSegment';
import { bloodColorDefault } from '../graphics/ui/colors';
import { HasLife, HasMana, HasSpace, HasStamina } from './Type';
import { collideWithLineSegments } from '../jmath/moveWithCollision';
import { calculateGameDifficulty } from '../Difficulty';
import * as inLiquid from '../inLiquid';
import { Modifier } from '../cards/util';
import { explain, EXPLAIN_DEATH, EXPLAIN_MINI_BOSSES } from '../graphics/Explain';
import { ARCHER_ID } from './units/archer';
import { BLOOD_ARCHER_ID } from './units/blood_archer';
import * as Obstacle from './Obstacle';
import { spellmasonUnitId } from './units/playerUnit';
import { findRandomGroundLocation, SUMMONER_ID } from './units/summoner';
import { DARK_SUMMONER_ID } from './units/darkSummoner';
import { bossmasonUnitId } from './units/deathmason';
import deathmason from './units/deathmason';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { StatCalamity } from '../Perk';
import { skyBeam } from '../VisualEffects';
import seedrandom from 'seedrandom';
import { summoningSicknessId } from '../modifierSummoningSickness';
import * as log from '../log';
import { suffocateCardId, updateSuffocate } from '../cards/suffocate';

const elCautionBox = document.querySelector('#caution-box') as HTMLElement;
const elCautionBoxText = document.querySelector('#caution-box-text') as HTMLElement;
const elHealthBar = document.querySelector('#health .fill') as HTMLElement;
const elHealthBarSheild = document.querySelector('#health .fill:nth-child(2)') as HTMLElement;
const elHealthCostSheild = document.querySelector('#health .cost:nth-child(4)') as HTMLElement;
const elHealthCost = document.querySelector('#health .cost') as HTMLElement;
const elHealthLabel = document.querySelector('#health .label') as HTMLElement;
const elManaBar = document.querySelector('#mana .fill:nth-child(1)') as HTMLElement;
const elManaBar2 = document.querySelector('#mana .fill:nth-child(2)') as HTMLElement;
const elManaBar3 = document.querySelector('#mana .fill:nth-child(3)') as HTMLElement;
const elManaCost = document.querySelector('#mana .cost:nth-child(4)') as HTMLElement;
const elManaCost2 = document.querySelector('#mana .cost:nth-child(5)') as HTMLElement;
const elManaCost3 = document.querySelector('#mana .cost:nth-child(6)') as HTMLElement;
const elManaLabel = document.querySelector('#mana .label') as HTMLElement;
const elStaminaBar = document.querySelector('#stamina .fill') as HTMLElement;
const elStaminaBarLabel = document.querySelector('#stamina .label') as HTMLElement;

export interface UnitPath {
  points: Vec2[];
  lastOwnPosition: Vec2;
  targetPosition: Vec2;
}
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IUnitSerialized = Omit<IUnit, "resolveDoneMoving" | "image" | "animations" | "sfx"> & { image?: Image.IImageAnimatedSerialized };
export interface UnitAnimations {
  idle: string;
  hit: string;
  attack: string;
  die: string;
  walk: string;
}
export interface UnitSFX {
  death: string;
  damage: string;
}
export function isUnit(maybeUnit: any): maybeUnit is IUnit {
  return maybeUnit && maybeUnit.type == 'unit';
}
export type IUnit = HasSpace & HasLife & HasMana & HasStamina & {
  type: 'unit';
  // A unique id so that units can be identified
  // across the network
  id: number;
  unitSourceId: string;
  // strength is a multiplier that affects base level stats
  strength: number;
  // true if the unit was spawned at the beginning of the level and not
  // resurrected or cloned.  This prevents EXP scamming.
  originalLife: boolean;
  path?: UnitPath;
  moveSpeed: number;
  // A resolve callback for when a unit is done moving
  resolveDoneMoving: () => void;
  attackRange: number;
  name?: string;
  isMiniboss: boolean;
  // Denotes that this is a prediction copy of a unit
  isPrediction?: boolean;
  // For attention markers
  predictionScale?: number;
  faction: Faction;
  UITargetCircleOffsetY: number;
  defaultImagePath: string;
  shaderUniforms: { [key: string]: any };
  damage: number;
  bloodColor: number;
  manaCostToCast: number;
  manaPerTurn: number;
  unitType: UnitType;
  unitSubType: UnitSubType;
  // Note: flaggedForRemoval should ONLY be changed in Unit.cleanup
  flaggedForRemoval?: boolean;
  // A list of names that correspond to Events.ts functions
  onDamageEvents: string[];
  onDeathEvents: string[];
  onAgroEvents: string[];
  onTurnStartEvents: string[];
  onTurnEndEvents: string[];
  onDrawSelectedEvents: string[];
  animations: UnitAnimations;
  sfx: UnitSFX;
  modifiers: { [key: string]: Modifier };
  // Used for more intelligent AI battles so many unit don't overkill a single unit and leave a bunch of others untouched
  predictedNextTurnDamage: number;
}
// This does not need to be unique to underworld, it just needs to be unique
let lastPredictionUnitId = 0;
export function create(
  unitSourceId: string,
  x: number,
  y: number,
  faction: Faction,
  defaultImagePath: string,
  unitType: UnitType,
  unitSubType: UnitSubType,
  sourceUnitProps: Partial<IUnit> = {},
  underworld: Underworld,
  prediction?: boolean,
): IUnit {
  const health = config.UNIT_BASE_HEALTH;
  const mana = config.UNIT_BASE_MANA;
  const staminaMax = config.UNIT_BASE_STAMINA;
  const sourceUnit = allUnits[unitSourceId];
  if (sourceUnit) {
    const spawnPoint = { x, y, radius: config.COLLISION_MESH_RADIUS }
    // Ensure unit doesn't spawn inside wall
    collideWithLineSegments(spawnPoint, underworld.walls, underworld);
    if (underworld.isCoordOnWallTile(spawnPoint)) {
      console.error('Spawned unit in invalid location, make sure unit spawn logic checks for invalid locations like summon_decoy does before spawning');
    }
    const unit: IUnit = Object.assign({
      type: 'unit',
      id: prediction ? ++lastPredictionUnitId : ++underworld.lastUnitId,
      unitSourceId,
      x: spawnPoint.x,
      y: spawnPoint.y,
      originalLife: false,
      radius: config.UNIT_BASE_RADIUS,
      path: undefined,
      moveSpeed: config.UNIT_MOVE_SPEED,
      resolveDoneMoving: () => { },
      stamina: 0,
      staminaMax,
      attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
      isMiniboss: false,
      faction,
      image: prediction ? undefined : Image.create({ x, y }, defaultImagePath, containerUnits),
      defaultImagePath,
      shaderUniforms: {},
      damage: 0,
      strength: 1,
      // default blood color
      bloodColor: bloodColorDefault,
      health,
      healthMax: health,
      mana,
      manaMax: mana,
      manaCostToCast: 0,
      manaPerTurn: config.MANA_GET_PER_TURN,
      alive: true,
      immovable: false,
      unitType,
      unitSubType,
      onDamageEvents: [],
      onDeathEvents: [],
      onAgroEvents: [],
      onTurnStartEvents: [],
      onTurnEndEvents: [],
      onDrawSelectedEvents: [],
      modifiers: {},
      animations: sourceUnit.animations,
      sfx: sourceUnit.sfx,
      inLiquid: false,
      UITargetCircleOffsetY: -10,
      beingPushed: false,
      predictedNextTurnDamage: 0
    }, sourceUnitProps);


    // Since unit stats can be overridden with sourceUnitProps
    // Ensure that the unit starts will full mana and health
    // --
    // If mana is not defined in sourceUnitProps, default it to max mana
    unit.mana = sourceUnitProps.mana || unit.manaMax;
    unit.health = unit.healthMax;
    if (unit.manaMax === 0) {
      unit.manaPerTurn = 0;
    }
    if (unit.staminaMax === 0) {
      unit.stamina = 0;
    }

    // Set sprite scale before difficulty, due to strength scaling the sprite
    unit.image?.sprite.scale.set(config.NON_HEAVY_UNIT_SCALE);

    // Note: This must be invoked after initial setting of stat and statMax (health, mana, stamina, etc) so that it can scale
    // stat relative to maxStat
    const difficulty = calculateGameDifficulty(underworld);
    adjustUnitDifficulty(unit, difficulty);

    // Apply underworld statCalamities to units
    for (let statCalamity of underworld.statCalamities) {
      adjustUnitStatsByUnderworldCalamity(unit, statCalamity);
    }

    // Note, making miniboss must come AFTER setting the scale and difficulty
    // Note, this is the idempotent way to create a miniboss, pass isMiniboss:true to to the sourceUnitProps override
    // argument so that the unit is made a miniboss BEFORE tryFallInOutOfLiquid is called
    if (unit.isMiniboss) {
      makeMiniboss(unit);
    }
    setupShaders(unit);
    if (sourceUnit.init) {
      // Initialize unit IF unit contains initialization function
      sourceUnit.init(unit, underworld);
    }

    // Ensure all change factions logic applies when a unit is first created
    changeFaction(unit, faction);


    underworld.addUnitToArray(unit, prediction || false);
    // Check to see if unit interacts with liquid
    Obstacle.tryFallInOutOfLiquid(unit, underworld, prediction || false);

    return unit;
  } else {
    throw new Error(`Source unit with id ${unitSourceId} does not exist`);
  }
}
export function adjustUnitStatsByUnderworldCalamity(unit: IUnit, statCalamity: StatCalamity) {
  if (statCalamity.unitId == unit.unitSourceId) {
    if (statCalamity.stat in unit) {
      const stat: keyof IUnit = statCalamity.stat as keyof IUnit;
      if (typeof unit[stat] === 'number') {
        (unit[stat] as number) = Math.round((unit[stat] as number) * (1 + statCalamity.percent / 100));
        if (stat.includes('Max')) {
          const currentStat = stat.replace('Max', '') as keyof IUnit;
          if (currentStat in unit && unit[currentStat] && unit[stat] && typeof unit[stat] === 'number') {
            // Ensure if healthMax or staminaMax increases that it also increases the current value
            // @ts-ignore
            unit[currentStat] = unit[stat];
          }

        }
      }

    }
  }
}
interface DifficultyAdjustedUnitStats {
  healthMax: number;
  manaMax: number;
}
export function adjustUnitPropsDueToDifficulty(source: Partial<UnitSource>, difficulty: number): DifficultyAdjustedUnitStats {
  const returnStats: DifficultyAdjustedUnitStats = {
    healthMax: source.unitProps && source.unitProps.healthMax ? source.unitProps.healthMax : config.UNIT_BASE_HEALTH,
    manaMax: source.unitProps && source.unitProps.manaMax !== undefined ? source.unitProps.manaMax : config.UNIT_BASE_MANA,
  };
  returnStats.healthMax = Math.round(returnStats.healthMax * difficulty);
  returnStats.manaMax = Math.round(returnStats.manaMax);
  return returnStats;
}

// sets all the properties that depend on difficulty
export function adjustUnitDifficulty(unit: IUnit, difficulty: number) {
  // Don't let difficulty be 0 which can occur on 0 player multiplayer games
  // which would initialize all units to 0 health
  if (difficulty == 0) {
    difficulty = 1;
  }
  const source = allUnits[unit.unitSourceId];
  if (source) {
    let { healthMax, manaMax } = adjustUnitPropsDueToDifficulty(source, difficulty);
    // Damage should remain unaffected by difficulty
    unit.damage = Math.round(source.unitProps.damage !== undefined ? source.unitProps.damage : config.UNIT_BASE_DAMAGE);

    // Strength scaling
    const quantityStatModifier = 1 + 0.8 * ((unit.strength || 1) - 1);
    healthMax = Math.round(healthMax * quantityStatModifier);
    manaMax = Math.round(manaMax * quantityStatModifier);
    unit.damage = Math.round(unit.damage * quantityStatModifier);

    if (unit.image) {
      // this final scale of the unit will always be less than the max multiplier
      const maxMultiplier = 4;
      // ensures scale = 1 at strength = 1
      const strAdj = unit.strength - 1;
      // calculate scale multiplier with diminishing formula
      // 11 is an arbitrary number that controls the speed at which the scale approaches the max
      const quantityScaleModifier = 1 + (maxMultiplier - 1) * (strAdj / (strAdj + 6));
      unit.image.sprite.scale.x *= quantityScaleModifier;
      unit.image.sprite.scale.y *= quantityScaleModifier;
    }

    // Maintain Health/Mana Ratios
    const oldHealthRatio = (unit.health / unit.healthMax) || 0;
    unit.healthMax = healthMax;
    unit.health = Math.floor(healthMax * oldHealthRatio);
    const oldManaRatio = (unit.mana / unit.manaMax) || 0;
    unit.manaMax = manaMax;
    unit.mana = Math.floor(manaMax * oldManaRatio);

    // Check for NaN (Can probably remove)
    if (isNaN(unit.health)) {
      unit.health = healthMax;
      console.error('Unit.health is NaN');
    }
    if (isNaN(unit.mana)) {
      unit.mana = manaMax;
      console.error('Unit.mana is NaN');
    }
  } else {
    console.error('missing unit source');
  }
}
function setupShaders(unit: IUnit) {
  if (unit.image) {
    const all_red = makeAllRedShader();
    if (all_red) {
      unit.shaderUniforms.all_red = all_red.uniforms;
      unit.image.sprite.filters = [all_red.filter];
    }
  }
}

export function addModifier(unit: IUnit, key: string, underworld: Underworld, prediction: boolean, quantity?: number, extra?: object) {
  // Call custom modifier's add function
  const modifier = allModifiers[key];
  if (modifier) {
    // Immune units cannot recieve modifier
    if (unit.modifiers[immune.id]) {
      immune.notifyImmune(unit, false);
      return;
    }
    if (modifier.add) {
      if (allCards[key]?.supportQuantity && quantity == undefined) {
        console.error('Dev warning:', key, 'supportsQuantity; however quantity was not provided to the addModifier function.');
      }
      modifier.add(unit, underworld, prediction, quantity || 1, extra);
    } else {
      console.error('No "add" modifier for ', key);
    }
  } else {
    console.error('Modifier ', key, 'never registered.');
  }
}

export function removeModifier(unit: IUnit, key: string, underworld: Underworld) {
  const modifier = allModifiers[key];

  // Call custom modifier's remove function
  const customRemoveFn = allModifiers[key]?.remove;
  if (customRemoveFn) {
    customRemoveFn(unit, underworld);
  }

  if (modifier && modifier.subsprite) {
    Image.removeSubSprite(unit.image, modifier.subsprite.imageName);
  }
  unit.onDamageEvents = unit.onDamageEvents.filter((e) => e !== key);
  unit.onDeathEvents = unit.onDeathEvents.filter((e) => e !== key);
  unit.onAgroEvents = unit.onAgroEvents.filter((e) => e !== key);
  unit.onTurnStartEvents = unit.onTurnStartEvents.filter((e) => e !== key);
  unit.onTurnEndEvents = unit.onTurnEndEvents.filter((e) => e !== key);
  unit.onDrawSelectedEvents = unit.onDrawSelectedEvents.filter((e) => e !== key);
  delete unit.modifiers[key];

}

export function cleanup(unit: IUnit, maintainPosition?: boolean) {
  // Resolve done moving on cleanup to ensure that there are no forever-blocking promises
  if (unit.resolveDoneMoving) {
    unit.resolveDoneMoving();
  }
  // Prevent id conflicts with other existing units after cleanup
  unit.id = -1;
  // Sometimes you will want to clean up a unit without NaN'ing it's position
  // because it's position may still be used in synchronous events such as
  // an urn exploding (being cleaned up), but there are still other onDeath
  // events that need it's position to function
  if (!maintainPosition) {
    unit.x = NaN;
    unit.y = NaN;
  }
  unit.flaggedForRemoval = true;
  Image.cleanup(unit.image);
  // Setting the entire image to undefined is important
  // because changeImage rejects replacing an image that is undefined.
  // This ensures that units won't get their image sprite changed while
  // they are waiting to be cleaned up, which could result in a dangling sprite
  unit.image = undefined;
}
// Converts a unit entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full unit entity (with callbacks, shaderUniforms, etc - the things
// that can't be saved as JSON)
// This is the opposite of load
export function serialize(unit: IUnit): IUnitSerialized {
  // resolveDoneMoving is a callback that cannot be serialized
  // animations and sfx come from the source unit and need not be saved or sent over
  // the network (it would just be extra data), better to restore from the source unit
  const { resolveDoneMoving, animations, sfx, onDamageEvents, onDeathEvents, onAgroEvents, onTurnStartEvents, onTurnEndEvents, onDrawSelectedEvents, ...rest } = unit
  return {
    ...rest,
    // Deep copy array so that serialized units don't share the object
    onDamageEvents: [...onDamageEvents],
    onDeathEvents: [...onDeathEvents],
    onAgroEvents: [...onAgroEvents],
    onTurnStartEvents: [...onTurnStartEvents],
    onTurnEndEvents: [...onTurnEndEvents],
    onDrawSelectedEvents: [...onDrawSelectedEvents],
    // Deep copy modifiers so that serialized units don't share the object
    modifiers: unit.modifiers ? JSON.parse(JSON.stringify(unit.modifiers)) : undefined,
    // Deep copy path so that the serialized object doesn't share the path object
    path: unit.path ? JSON.parse(JSON.stringify(unit.path)) : undefined,
    image: unit.image ? Image.serialize(unit.image) : undefined,
    // Pick the uniforms needed to rehydrate
    shaderUniforms: Object.entries(unit.shaderUniforms).reduce((obj, cur) => {
      const [key, value] = cur;
      // Pare down shaderUniforms to only the uniforms that the game sets so they
      // can be loaded back in later
      const { filterGlobals, globals, uSampler, ...keep } = value
      obj[key] = { ...keep };
      return obj;
    }, {} as any),
  };
}
// Reinitialize a unit from another unit object
// this is useful when loading game state after reconnect
// This is the opposite of serialize
export function load(unit: IUnitSerialized, underworld: Underworld, prediction: boolean): IUnit {
  const { shaderUniforms, ...restUnit } = unit
  const sourceUnit = allUnits[unit.unitSourceId];
  if (!sourceUnit) {
    console.error('Source unit not found for', unit.unitSourceId);
  }
  // Since resolveDoneMoving is about to be overwritten,
  // call it, just in case there is a pending promise (there shouldn't be)
  // so the promise doesn't hang forever
  let loadedunit: IUnit = {
    // Load defaults for new props that old save files might not have
    ...{ strength: 1 },
    ...{ onDrawSelectedEvents: [] },
    ...restUnit,
    shaderUniforms: {},
    resolveDoneMoving: () => { },
    animations: sourceUnit?.animations || { idle: '', hit: '', walk: '', attack: '', die: '' },
    sfx: sourceUnit?.sfx || { death: '', damage: '' },
    image: prediction
      ? undefined
      : unit.image
        ? Image.load(unit.image, containerUnits)
        : Image.create({ x: unit.x, y: unit.y }, unit.defaultImagePath, containerUnits),
  };

  if (loadedunit.id > underworld.lastUnitId) {
    underworld.lastUnitId = loadedunit.id;
  }
  for (let key of Object.keys(loadedunit.modifiers)) {
    const modifier = allModifiers[key];
    if (modifier && modifier.init) {
      // Invoke modifier.init so that special init logic
      // such as there is in 'poison' will run
      modifier.init(loadedunit, underworld, false);
    } else {
      console.warn('No init for modifier with key', key)
    }
  }
  setupShaders(loadedunit);
  if (sourceUnit && sourceUnit.init) {
    // Initialize unit IF unit contains initialization function
    sourceUnit.init(loadedunit, underworld);
  }
  // Headless server doesn't need to keep track of shader uniforms
  if (!globalThis.headless) {
    // Load in shader uniforms by ONLY setting the uniforms that are saved
    // it is important that the other objects stay exactly the same
    // or else the shader won't render
    for (let [key, uniformObject] of Object.entries(shaderUniforms)) {
      for (let [keyUniform, value] of Object.entries(uniformObject)) {
        try {
          loadedunit.shaderUniforms[key][keyUniform] = value;
        } catch (e) {
          console.error('Err in Unit.load for restoring shaderUniforms', key, keyUniform, e);
        }
      }
    }
  }
  // Override ref since in prediction it makes a copy of the unit
  loadedunit = underworld.addUnitToArray(loadedunit, prediction);
  if (!loadedunit.alive) {
    if (loadedunit.image) {
      // Ensure unit is on die sprite
      changeToDieSprite(loadedunit);
      loadedunit.image.sprite.gotoAndStop(loadedunit.image.sprite.totalFrames - 1);
    }
  }
  // Protect against bug where stamina loads in as null.  Not sure why this is happening but this
  // with prevent it
  if (loadedunit.stamina == null) {
    loadedunit.stamina = loadedunit.staminaMax || config.UNIT_BASE_STAMINA;
  }
  return loadedunit;
}
// Similar but not the same as `load`, syncronize updates (mutates) a unit 
// entity with properties from a unit (in JSON)
// mutates originalUnit
export function syncronize(unitSerialized: IUnitSerialized, originalUnit: IUnit): void {
  if (unitSerialized.id !== originalUnit.id) {
    console.warn('Units array is out of order with canonical record. A full unit.sync should correct this issue.')
  }
  // Note: shaderUniforms should not just be "assign"ed into the object because 
  // it requires special handling to have a valid link to the shader
  // and since syncronize is mainly meant to keep things like health and position in sync,
  // I'm choosing just to omit shaderUniforms from syncronize
  const { image, shaderUniforms, ...rest } = unitSerialized;
  const doResetImage = originalUnit.alive != unitSerialized.alive;
  Object.assign(originalUnit, rest);
  if (!originalUnit.inLiquid) {
    inLiquid.remove(originalUnit);
  }
  if (doResetImage) {
    returnToDefaultSprite(originalUnit);
  }
  // Note: returnToDefaultSprite must be called BEFORE Image.syncronize
  // to ensure that the originalUnit.image.sprite has a parent because
  // the parent could have been cleared previously.
  // TODO: TEMPORARILY DISABLED: How to keep syncronize from interrupting an animation while it's running
  // returnToDefaultSprite(originalUnit);
  // originalUnit.image = Image.syncronize(image, originalUnit.image);
}
export function changeToDieSprite(unit: IUnit) {
  Image.changeSprite(
    unit.image,
    unit.animations.die,
    containerUnits,
    // DieSprite intentionally stops animating when it is complete, therefore
    // resolver is undefined, since no promise is waiting for it.
    undefined,
    { loop: false }
  );
}
// It is important to use this function when returning a unit to the previous
// sprite because it takes into account wether or not a unit is dead.  If a unit
// dies mid-animation and this function is not used, it would return to the default
// LIVING sprite, instead of the dead sprite.
export function returnToDefaultSprite(unit: IUnit) {
  // This check for unit.image prevents creating a corpse image when a predictionUnit
  // dies because a prediction unit won't have an image property
  // Only return to default if it is not currently playing an animation, this prevents
  if (unit.image) {
    if (unit.alive) {
      Image.changeSprite(
        unit.image,
        unit.animations.idle,
        containerUnits,
        undefined
      );
    } else {
      changeToDieSprite(unit);
    }
  }
}

// ComboAnimations are a unit's primary animation that has to coordinate with other animations attached to the unit, like a player cast that
// has multiple layers of animations playing simultaneously.
// keyMoment is a callback that can be triggered at a specific frame (even before the animation has finished) to trigger some action, like
// casting the effect of a spell at the apex of an animation.
export function playComboAnimation(unit: IUnit, key: string | undefined, keyMoment?: () => Promise<any>, options?: PixiSpriteOptions): Promise<void> {
  if (!key) {
    console.trace('tried to play missing animation');
    return Promise.resolve();
  }
  // Change animation and change back to default
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called.
  // This raceTimeout may need to be removed because playComboAnimation can have wildly varying execution times becauses it awaits keyMoment
  return raceTimeout(20000, `playComboAnimation: ${key}; note: comboAnimation can have greatly varying execution times due to it awaiting keyMoment`, new Promise<void>((resolve, reject) => {
    let keyMomentPromise = Promise.resolve();
    // Ensure keyMoment doesn't trigger more than once.
    let keyMomentTriggered = false;

    const tryTriggerKeyMoment = () => {
      if (keyMoment && !keyMomentTriggered) {
        // Note: keyMomentTriggered must be set to true BEFORE the following invokation
        // of keyMoment() and the resolve because there is a potential for the
        // keyMoment to change the sprite of this unit which would try to retrigger
        // the keyMoment immediately which would result in an infinite loop.
        // Placing keyMomentTriggered = true BEFORE prevents this from happening
        // because this function (tryTriggerKeyMoment) checks to ensure that it
        // doesn't trigger it more than once.
        keyMomentTriggered = true;
        // Ensure that if keyMoment hasn't been called yet (because)
        // the animation was interrupted, it is called now
        // A keyMoment should ALWAYS be invoked
        keyMomentPromise = keyMoment().then(() => {
          // resolve resolves the promise that the combo animation returns.
          // The keyMoment is the ultimate arbiter of when the combo animation is done
          // since it usually triggers a projectile or spell that will take longer to
          // finish than the primary animation, so whatever's waiting for the combo animation
          // to finish should wait for the keyMoment rather than any of the other animations
          // that occur in the combo
          resolve();
        });
      }
      return keyMomentPromise;

    }
    if (!unit.image) {
      // If the unit has no image than this code path is being run headless,
      // just trigger the key moment immediately and return it's promise
      return tryTriggerKeyMoment();
    }
    const combo = combos[key];
    if (!combo) {
      const err = 'Combo data missing for animation with key ' + key
      console.error(err)
      return reject(err);
    }
    const finishOnFrame = combo.keyFrame;
    const onFrameChange = (finishOnFrame === undefined || keyMoment === undefined) ? undefined : (currentFrame: number) => {
      if (currentFrame >= finishOnFrame && !keyMomentTriggered) {
        // This is when the keyMoment is INTENTED to be triggered: at a specified "finishOnFrame" of the
        // animation
        tryTriggerKeyMoment();
      }

    }
    // Play sound effect
    if (combo.SFX && globalThis.playSFXKey) {
      const key = combo.SFX[Math.floor(Math.random() * combo.SFX.length)];
      if (key) {
        globalThis.playSFXKey(key);
      }
    }
    Image.changeSprite(unit.image, combo.primaryAnimation, unit.image.sprite.parent,
      // It is expected that the key moment will never be triggered here because if the animation
      // gets all the way to the end to the point where it triggers changeSprite's onComplete
      // which calls this callback, the keyMoment should've already happened; however, since
      // we don't want this promise resolving UNTIL the keyMoment is finished, we'll pipe this
      // through tryTriggerKeyMoment which will eventually call resolve when the keyMoment is finished
      tryTriggerKeyMoment,
      {
        loop: false,
        ...options,
        onFrameChange,
        onComplete: () => {
          returnToDefaultSprite(unit);
        }
      });
    // Note: oneOff animations MUST be added after changeSprite because changeSprite wipes any existing oneOff animations
    // with `doRemoveWhenPrimaryAnimationChanges` is set to true
    // This is how these animations are attached to a primary animation, so if the primary animation ends early, so do
    // the currently playing animations with that flag.
    for (let animPath of combo.companionAnimations) {
      Image.addOneOffAnimation(unit, animPath, { doRemoveWhenPrimaryAnimationChanges: true }, options);
    }
  }));
}
export function playAnimation(unit: IUnit, spritePath: string | undefined, options?: PixiSpriteOptions): Promise<void> {
  if (!spritePath) {
    console.trace('tried to play missing animation');
    return Promise.resolve();
  }
  // Change animation and change back to default
  // ---
  // This timeout value is arbitrary, meant to prevent and report an await hang
  // if somehow resolve is never called
  return raceTimeout(6000, `playAnimation: ${spritePath}`, new Promise<void>((resolve) => {
    if (!unit.image) {
      return resolve();
    }

    Image.changeSprite(unit.image, spritePath, unit.image.sprite.parent, resolve, {
      loop: false,
      ...options,
      onComplete: () => {
        returnToDefaultSprite(unit);
        if (options?.onComplete) {
          options.onComplete();
        }
      }
    });
  }));
}

export function resurrect(unit: IUnit) {
  // Return dead units back to full health
  unit.health = unit.healthMax;
  unit.alive = true;
  returnToDefaultSprite(unit);
}
export function die(unit: IUnit, underworld: Underworld, prediction: boolean) {
  if (!unit.alive) {
    // If already dead, do nothing
    return;
  }
  // Play death sfx
  if (!prediction && !unit.flaggedForRemoval) {
    playSFXKey(unit.sfx.death);
  }
  // Health should already be 0 but make sure it is for the sake of the UI bar
  unit.health = 0;
  unit.alive = false;
  // This check for unit.image prevents creating a corpse image when a predictionUnit
  // dies because a prediction unit won't have an image property
  if (unit.image) {
    changeToDieSprite(unit);
  }

  // Generally a dead units mana should ALWAYS be set to 0 so there aren't floating
  // mana bars hanging around above corpses, but there is one exception:
  // The prediction copy of the player unit is used to determine if a player has
  // enough mana to cast a spell.  This is so that when the effects of the spell
  // influence how much mana you get you can use that mana in the same spell chain
  // for example with steal_mana.  However, implementing this created an issue
  // where you got an "insufficient mana" message when attempting to cast
  // a spell that would kill you.  This is undesireable, you should be able to
  // cast a spell that can kill you if you want, so this special check ensures
  // the prediction copy of a player unit doesn't get their mana set to 0 on death.
  if (!(unit.unitType == UnitType.PLAYER_CONTROLLED && unit.isPrediction)) {
    unit.mana = 0;
  }
  // Ensure that the unit resolvesDoneMoving when they die in the event that 
  // they die while they are moving.  This prevents turn phase from getting stuck
  unit.resolveDoneMoving();

  for (let i = 0; i < unit.onDeathEvents.length; i++) {
    const eventName = unit.onDeathEvents[i];
    if (eventName) {
      const fn = Events.onDeathSource[eventName];
      if (fn) {
        fn(unit, underworld, prediction);
      }
    }
  }

  // Invoke simulating forceMovePredictions after onDeath callbacks
  // as the callbacks may create predictions that need to be processed such as
  // bloat + die causing a push.  Otherwise a raceTimeout could occur
  if (prediction) {
    underworld.fullySimulateForceMovePredictions();
  }
  // Invoke gameLoopHeadless after onDeath callbacks
  // as the callbacks may create predictions that need to be processed such as
  // bloat + die causing a push.  Otherwise a raceTimeout could occur
  if (globalThis.headless) {
    underworld.triggerGameLoopHeadless();
  }

  // Remove all modifiers
  // Note: This must come AFTER onDeathEvents or else it will remove the modifier
  // that added the onDeathEvent and the onDeathEvent won't trigger
  for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
    if (!modifierProperties.keepOnDeath) {
      removeModifier(unit, modifier, underworld);
    }
  }

  if (globalThis.player && globalThis.player.unit == unit) {
    clearSpellEffectProjection(underworld);
    CardUI.clearSelectedCards(underworld);
    queueCenteredFloatingText(`You Died`, 'red');
    explain(EXPLAIN_DEATH);
    playSFXKey('game_over');
  }
  if (unit.unitType == UnitType.PLAYER_CONTROLLED && !prediction) {
    const player = underworld.players.find(p => p.unit == unit);
    if (!player) {
      console.error('Player unit died but could not find them in players array to end their turn');
    } else if (player == globalThis.player) {
      // Send an end turn message rather than just invoking endPlayerTurn
      // so that it waits to execute until the spell is done casting.
      // This change was made in response to self kill + resurrect 
      // triggering the end of your turn before the spell finished
      // (before the resurrect occurred)
      underworld.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
    }
  }
  // In the event that this unit that just died is the selected unit,
  // this will remove the tooltip:
  checkIfNeedToClearTooltip();

  if (!prediction && unit.originalLife && unit.faction !== globalThis.player?.unit.faction) {
    underworld.reportEnemyKilled(unit);
  }
  if (unit.originalLife && unit.faction == Faction.ENEMY) {
    // Reset kill switch since the allies are making progress
    underworld.allyNPCAttemptWinKillSwitch = 0;
  }
  // Once a unit dies it is no longer on it's originalLife
  unit.originalLife = false;
  // For the bossmason level, if there is only 1 bossmason, when it dies, spawn 3 more:
  if (underworld.levelIndex === config.LAST_LEVEL_INDEX && underworld.units.filter(u => u.unitSourceId == bossmasonUnitId).length == 1) {
    if (unit.unitSourceId == bossmasonUnitId) {
      const mageTypeWinsKey = storage.getStoredMageTypeWinsKey(player?.mageType || 'Spellmason');
      const currentMageTypeWins = parseInt(storageGet(mageTypeWinsKey) || '0');
      storageSet(mageTypeWinsKey, (currentMageTypeWins + 1).toString());
      (prediction
        ? underworld.unitsPrediction
        : underworld.units).filter(u => u.unitType == UnitType.AI && u.unitSubType !== UnitSubType.DOODAD).forEach(u => die(u, underworld, prediction));
      if (!prediction) {
        let retryAttempts = 0;
        for (let i = 0; (i < 3 && retryAttempts < 10); i++) {
          const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
          const coords = findRandomGroundLocation(underworld, unit, seed);
          if (!coords) {
            retryAttempts++;
            i--;
            continue;
          } else {
            retryAttempts = 0;
          }
          // Animate effect of unit spawning from the sky
          const newBossmason = create(
            bossmasonUnitId,
            coords.x,
            coords.y,
            Faction.ENEMY,
            deathmason.info.image,
            UnitType.AI,
            deathmason.info.subtype,
            deathmason.unitProps,
            underworld,
            prediction
          );
          const givenName = ['Darius', 'Magnus', 'Lucius'][i] || '';
          const dialogue = [
            'deathmason dialogue 1',
            'deathmason dialogue 2',
            'deathmason dialogue 3',
          ][i];
          newBossmason.name = `${givenName}`;
          // If deathmasons are spawned during the NPC_ALLY turn
          // meaning an ally killed the first deathmason, give them
          // summoning sickness so they can't attack right after spawning
          if (underworld.turn_phase == turn_phase.NPC_ALLY) {
            addModifier(newBossmason, summoningSicknessId, underworld, false);
          }
          skyBeam(newBossmason);
          if (dialogue) {
            floatingText({ coords: newBossmason, text: dialogue, valpha: 0.005, aalpha: 0 })
          }
        }
      }

    }
  }
}
export function composeOnDamageEvents(unit: IUnit, damage: number, underworld: Underworld, prediction: boolean): number {
  // Compose onDamageEvents
  for (let eventName of unit.onDamageEvents) {
    const fn = Events.onDamageSource[eventName];
    if (fn) {
      // onDamage events can alter the amount of damage taken
      damage = fn(unit, damage, underworld, prediction);
    }
  }
  return damage

}
// damageFromVec2 is the location that the damage came from and is used for blood splatter
export function takeDamage(unit: IUnit, amount: number, damageFromVec2: Vec2 | undefined, underworld: Underworld, prediction: boolean, state?: EffectState, options?: { thinBloodLine: boolean }) {
  if (!unit.alive) {
    // Do not deal damage to dead units
    return;
  }
  // Immune units cannot be damaged
  if (unit.modifiers[immune.id]) {
    immune.notifyImmune(unit, false);
    return
  }
  amount = composeOnDamageEvents(unit, amount, underworld, prediction);
  if (amount == 0) {
    // Even though damage is 0, sync the player UI in the event that the
    // damage took down shield
    if (unit === globalThis.player?.unit) {
      syncPlayerHealthManaUI(underworld);
    }
    return;
  }
  if (!prediction) {
    // console.log(`takeDamage: unit ${unit.id}; amount: ${amount}; events:`, unit.onDamageEvents);
    // Only play hit animation if taking actual damage,
    // note: heals call takeDamage with a negative amount, so we don't want to play a hit animation when
    // player is healed
    if (amount > 0) {
      playSFXKey(unit.sfx.damage);
      playAnimation(unit, unit.animations.hit, { loop: false, animationSpeed: 0.2 });
      // All units bleed except Doodads
      if (unit.unitSubType !== UnitSubType.DOODAD) {
        if (damageFromVec2) {
          if (options?.thinBloodLine) {
            startBloodParticleSplatter(underworld, damageFromVec2, unit, { maxRotationOffset: Math.PI / 16, numberOfParticles: 30 });
          } else {
            startBloodParticleSplatter(underworld, damageFromVec2, unit);
          }
        }
      }
    }
  }
  // if healing
  if (amount < 0) {
    // Ensure it doesn't heal over max health
    const maxHealingAllowed = Math.max(0, unit.healthMax - unit.health);
    if (Math.abs(amount) > maxHealingAllowed) {
      amount = -maxHealingAllowed;
    }
  }
  unit.health -= amount;
  // Prevent health from going under 0
  unit.health = Math.max(0, unit.health);
  // Ensure health is a whole number
  unit.health = Math.floor(unit.health);
  // If the unit is actually taking damage (not taking 0 damage or being healed - (negative damage))
  if (!prediction) {
    if (amount > 0) {
      // Use all_red shader to flash the unit to show they are taking damage
      if (unit.shaderUniforms.all_red) {
        unit.shaderUniforms.all_red.alpha = 1;
        addLerpable(unit.shaderUniforms.all_red, "alpha", 0, 200);
      }
    }
  }

  // If taking damage (not healing) and health is 0 or less...
  if (amount > 0 && unit.health <= 0) {
    die(unit, underworld, prediction);
  }

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, prediction);
  }

  if (unit.id == globalThis.player?.unit.id && !prediction) {
    // Now that the player unit's properties have changed, sync the new
    // state with the player's predictionUnit so it is properly
    // refelcted in the bar
    // (note: this would be auto corrected on the next mouse move anyway)
    underworld.syncPlayerPredictionUnitOnly();
    syncPlayerHealthManaUI(underworld);
  }

}
export function syncPlayerHealthManaUI(underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (!(globalThis.player && elHealthBar && elManaBar && elStaminaBar && elHealthLabel && elManaLabel && elStaminaBarLabel)) {
    return
  }
  const predictionPlayerUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id);

  const unit = globalThis.player.unit;
  const healthRatio = unit.health / unit.healthMax
  // Set the health bar that shows how much health you currently have
  elHealthBar.style["width"] = `${100 * healthRatio}%`;
  const shieldAmount = unit.modifiers.shield?.damage_block || 0;
  const shieldRatio = shieldAmount / unit.healthMax;
  elHealthBarSheild.style["width"] = `${100 * Math.min(shieldRatio, 1)}%`;
  if (shieldAmount) {
    const shieldText = `${unit.modifiers.shield?.damage_block} shield`;
    elHealthLabel.innerHTML = `${shieldText} + ${unit.health} / ${unit.healthMax}`;
  } else {
    // Label health without shield
    elHealthLabel.innerHTML = `${unit.health}/${unit.healthMax}`;
  }
  if (predictionPlayerUnit && predictionPlayerUnit.health !== unit.health) {
    if (predictionPlayerUnit.health <= 0) {
      elHealthLabel.innerHTML = i18n('Death');
    } else {
      elHealthLabel.innerHTML = `${predictionPlayerUnit.health} ${i18n('Remaining')}`;
    }
  }

  // Set the health cost bar that shows how much health will be changed if the spell is cast
  if (predictionPlayerUnit) {
    const losingHealth = predictionPlayerUnit.health < unit.health;
    const willDie = predictionPlayerUnit.health <= 0;
    const predictionPlayerShield = predictionPlayerUnit.modifiers.shield?.damage_block || 0
    const shieldLost = predictionPlayerShield < shieldAmount;
    if (elCautionBox) {
      if (elCautionBoxText) {
        const cursingSelf = Object.values(predictionPlayerUnit.modifiers).filter(m => m.isCurse).length > Object.values(unit.modifiers).filter(m => m.isCurse).length;
        elCautionBoxText.innerText = '';
        const warnings = [];
        if (losingHealth || shieldLost) {
          if (willDie) {
            warnings.push('kill');
          } else {
            warnings.push('damage');
          }
        }

        if (cursingSelf) {
          warnings.push('curse');
        }
        if (warnings.length) {
          elCautionBoxText.innerText += i18n('This spell will ' + warnings.join(' & ') + ' you');
        }

        // Make visible if it has a message to share
        elCautionBox.classList.toggle('visible', underworld.isMyTurn() && warnings.length > 0);
      }
    }
    if (losingHealth) {
      // Visualize health loss
      elHealthCost.style['left'] = `${100 * predictionPlayerUnit.health / unit.healthMax}%`;
      elHealthCost.style['width'] = `${100 * (unit.health - predictionPlayerUnit.health) / unit.healthMax}%`;
    } else {
      // Visualize health gain
      elHealthCost.style['left'] = `${100 * unit.health / unit.healthMax}%`;
      elHealthCost.style['width'] = `${100 * (predictionPlayerUnit.health - unit.health) / unit.healthMax}%`;
    }
    if (shieldLost) {
      // Visualize shield loss
      elHealthCostSheild.style['left'] = `${100 * predictionPlayerShield / unit.healthMax}%`;
      elHealthCostSheild.style['width'] = `${100 * (shieldAmount - predictionPlayerShield) / unit.healthMax}%`;
    } else {
      // Visualize shield gain
      elHealthCostSheild.style['left'] = `${100 * shieldAmount / unit.healthMax}%`;
      elHealthCostSheild.style['width'] = `${100 * (predictionPlayerShield - shieldAmount) / unit.healthMax}%`;
    }
  }

  // Set the 3 mana bars that show how much mana you currently have
  const manaRatio = unit.mana / unit.manaMax;
  elManaBar.style["width"] = `${100 * Math.min(manaRatio, 1)}%`;
  const manaRatio2 = (Math.max(0, unit.mana - unit.manaMax)) / unit.manaMax
  elManaBar2.style["width"] = `${100 * Math.min(manaRatio2, 1)}%`;
  const manaRatio3 = (Math.max(0, unit.mana - unit.manaMax * 2)) / unit.manaMax;
  elManaBar3.style["width"] = `${100 * Math.min(manaRatio3, 1)}%`;
  if (predictionPlayerUnit && predictionPlayerUnit.mana !== unit.mana) {
    if (predictionPlayerUnit.mana < 0) {
      // If a player queues up a spell while another spell is casting,
      // it may not block them from adding a spell beyond the mana that they have
      // because the mana is actively changing from the currently casting spell,
      // so rather than showing negative mana, show "Insufficient Mana"
      // (Note, it will still prevent them from casting this spell on click, it's just
      // that it won't prevent them from queing a spell)
      elManaLabel.innerHTML = i18n('Insufficient Mana');
    } else {
      elManaLabel.innerHTML = `${predictionPlayerUnit.mana} ${i18n('Remaining')}`;

    }
  } else {
    elManaLabel.innerHTML = `${unit.mana}/${unit.manaMax}`;
  }

  // Set the 3 mana cost bars that show how much mana will be removed if the spell is cast
  if (predictionPlayerUnit) {
    // Show cost bar from current mana location minus whatever it's value is
    elManaCost.style['left'] = `${100 * predictionPlayerUnit.mana / unit.manaMax}%`;
    elManaCost.style['width'] = `${100 * Math.min(((unit.mana - predictionPlayerUnit.mana) / unit.manaMax), 1)}%`;

    elManaCost2.style['left'] = `${100 * (predictionPlayerUnit.mana - unit.manaMax) / unit.manaMax}%`;
    let cost2Left = 100 * (predictionPlayerUnit.mana - unit.manaMax) / unit.manaMax;
    if (cost2Left < 0) {
      elManaBar2.style['left'] = `${cost2Left}%`;
      elManaCost2.style['left'] = `0%`;
    } else {
      elManaBar2.style['left'] = '0%';
      elManaCost2.style['left'] = `${cost2Left}%`;
    }
    elManaCost2.style['width'] = `${100 * Math.min(manaRatio2, 1)}%`;

    let cost3Left = 100 * (predictionPlayerUnit.mana - unit.manaMax * 2) / unit.manaMax;
    if (cost3Left < 0) {
      elManaBar3.style['left'] = `${cost3Left}%`;
      elManaCost3.style['left'] = `0%`;
    } else {
      elManaBar3.style['left'] = '0%';
      elManaCost3.style['left'] = `${cost3Left}%`;
    }
    elManaCost3.style['width'] = `${100 * Math.min(manaRatio3, 1)}%`;
  } else {
    elManaCost.style['left'] = `100%`;
    elManaCost2.style['left'] = `100%`;
    elManaCost3.style['left'] = `100%`;
  }

  const staminaLeft = Math.max(0, Math.round(unit.stamina));
  elStaminaBar.style["width"] = `${100 * (unit.stamina) / unit.staminaMax}%`;
  elStaminaBarLabel.innerHTML = `${staminaLeft}`;
  if (staminaLeft <= 0 && !player?.endedTurn) {
    // Now that the current player has moved, highlight the "end-turn-btn" to
    // remind them that they need to end their turn before they can move again
    document.querySelector('#end-turn-btn')?.classList.add('highlight');
  } else {
    document.querySelector('#end-turn-btn')?.classList.remove('highlight');

  }
}
export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    // console.log("canMove: false - unit is not alive")
    return false;
  }
  // Do not move if already moved
  if (unit.stamina <= 0) {
    // console.log("canMove: false - unit has already used all their stamina this turn")
    return false;
  }
  return true;
}
export function livingUnitsInDifferentFaction(unit: IUnit, underworld: Underworld) {
  return underworld.units.filter(
    (u) => u.faction !== unit.faction && u.alive && u.unitSubType !== UnitSubType.DOODAD,
  );
}
export function livingUnitsInSameFaction(unit: IUnit, underworld: Underworld) {
  // u !== unit excludes self from returning as the closest unit
  return underworld.units.filter(
    (u) => u !== unit && u.faction == unit.faction && u.alive && u.unitSubType !== UnitSubType.DOODAD,
  );
}
export function closestInListOfUnits(
  sourceUnit: IUnit,
  units: IUnit[],
): IUnit | undefined {
  return units.reduce<{ closest: IUnit | undefined; distance: number }>(
    (acc, currentUnitConsidered) => {
      const dist = distance(currentUnitConsidered, sourceUnit);
      if (dist <= acc.distance) {
        return { closest: currentUnitConsidered, distance: dist };
      }
      return acc;
    },
    { closest: undefined, distance: Number.MAX_SAFE_INTEGER },
  ).closest;
}
export function findClosestUnitInDifferentFaction(
  unit: IUnit,
  underworld: Underworld
): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInDifferentFaction(unit, underworld)
    .filter(filterSmartTarget)
  );
}
// To be used in a filterFunction
export function filterSmartTarget(u: IUnit) {
  // Smart Target: Try to attack units that aren't already going to take fatal damage from other ally npc
  // Exception, always allow overkilling a player unit for many reasons:
  // The player unit may be shielded or absorb damage in some way that predictNextTurnDamage doesn't catch
  // also filtering player units out may interfere with prediction attack badges
  return u.unitType == UnitType.PLAYER_CONTROLLED || u.predictedNextTurnDamage < u.health;
}
export function findClosestUnitInSameFaction(unit: IUnit, underworld: Underworld): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInSameFaction(unit, underworld));
}
export function orient(unit: IUnit, faceTarget: Vec2) {
  // Orient; make the sprite face it's enemy
  if (unit.image) {
    if (faceTarget.x > unit.x) {
      // Assuming all units are left facing, if the enemy is to the right, make it right facing
      unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
    } else {
      unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);
    }
    // Update the orientation of the possible player's nametext so that it doesn't display backwards
    // @ts-ignore jid is a custom identifier to id the text element used for the player name
    const nameText = unit.image.sprite.children.find(c => c.jid == config.NAME_TEXT_ID) as undefined | PIXI.Text;
    updateNameText(nameText, undefined);
  }

}

// This _ version of moveTowards does not return a promise and is used
// specifically for moving the current player character which does not await 
// movement since they hold RMB to move, the target may be constantly changing
export function _moveTowards(unit: IUnit, target: Vec2, underworld: Underworld) {
  if (!canMove(unit)) {
    log.client('cannot move');
    return
  }
  if (unit.image) {
    Image.changeSprite(
      unit.image,
      unit.animations.walk,
      unit.image.sprite.parent,
      undefined
    );
  }
  orient(unit, target);

  // Set path which will be used in the game loop to actually move the unit
  underworld.setPath(unit, Vec.clone(target));
}
// moveTo moves a unit, considering all the in-game blockers
// Multi: many points to move towards in sequence.
export function moveTowardsMulti(unit: IUnit, points: Vec2[], underworld: Underworld): Promise<void> {
  // Do not calculate for a path with 0 points
  if (points[0] === undefined) {
    return Promise.resolve();
  }
  if (!canMove(unit)) {
    log.client('cannot move');
    return Promise.resolve();
  }
  const [firstPoint, ...followingPoints] = points;
  let lastPoint = firstPoint;
  _moveTowards(unit, firstPoint, underworld);
  if (unit.path) {

    for (let point of followingPoints) {
      const nextPath = underworld.calculatePathNoCache(lastPoint, point);
      // Add the new points to the array
      unit.path.points = unit.path.points.concat(nextPath.points);
      unit.path.targetPosition = Vec.clone(point);

      lastPoint = point;
    }
  } else {
    console.error('Unexpected, unit does not have path object and so cannot add secondary point');
  }
  // 300 + is an arbitrary time buffer to ensure that the raceTimeout
  // doesn't report a false positive if the duration it takes the moveTowards promise
  // to resolve is within a reasonable range
  const timeoutMs = 300 + unit.stamina / unit.moveSpeed;

  return raceTimeout(timeoutMs, `moveTowards; ${unit.unitSourceId}`, new Promise<void>((resolve) => {
    // Set new resolve done moving
    unit.resolveDoneMoving = resolve;
  })).then(() => {
    if (unit.image) {
      // When done moving return to default
      returnToDefaultSprite(unit);
    }
  });
}
// moveTo moves a unit, considering all the in-game blockers
export function moveTowards(unit: IUnit, point: Vec2, underworld: Underworld): Promise<void> {
  return moveTowardsMulti(unit, [point], underworld);
}

// setLocation, unlike moveTo, simply sets a unit to a coordinate without
// considering in-game blockers or changing any unit flags
// Note: NOT TO BE USED FOR in-game collision-based movement
export function setLocation(unit: IUnit, coordinates: Vec2) {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  unit.path = undefined;
}
export function changeFaction(unit: IUnit, faction: Faction) {
  unit.faction = faction;
  if (unit.faction === Faction.ALLY) {
    // headband signifies a player ally unit
    // Image.addSubSprite(unit.image, 'headband');
  } else {
    // Image.removeSubSprite(unit.image, 'headband');
  }
}

// syncImage updates a unit's Image to match it's game state
export function syncImage(unit: IUnit) {
  if (unit.image) {
    unit.image.sprite.x = unit.x;
    unit.image.sprite.y = unit.y;
  }
}
export function getExplainPathForUnitId(id: string): string {
  return "images/explain/units/" + id.split(' ').join('') + ".gif";
}
export function inRange(unit: IUnit, coords: Vec2): boolean {
  return math.distance(unit, coords) <= unit.attackRange;
}

// return boolean signifies if unit should abort their turn
export async function runTurnStartEvents(unit: IUnit, prediction: boolean = false, underworld: Underworld): Promise<boolean> {
  // Note: This must be a for loop instead of a for..of loop
  // so that if one of the onTurnStartEvents modifies the
  // unit's onTurnStartEvents array (for example, after death)
  // this loop will take that into account.
  let abortTurn = false;
  for (let i = 0; i < unit.onTurnStartEvents.length; i++) {
    const eventName = unit.onTurnStartEvents[i];
    if (eventName) {
      const fn = Events.onTurnStartSource[eventName];
      if (fn) {
        const shouldAbortTurn = await fn(unit, prediction, underworld);
        // Only change abort turn from false to true,
        // never from turn to false because if any one
        // of the turn start events needs the unit to abort
        // their turn, the turn should abort, regardless of
        // the other events
        if (shouldAbortTurn) {
          abortTurn = true;
        }
      } else {
        console.error('No function associated with turn start event', eventName);
      }
    } else {
      console.error('No turn start event at index', i)
    }
  }
  return abortTurn

}
export function makeMiniboss(unit: IUnit) {
  if (unit.unitSourceId == bossmasonUnitId) {
    // Bossmasons is already a boss and should not be made into a miniboss
    return;
  }
  unit.isMiniboss = true;
  explain(EXPLAIN_MINI_BOSSES);
  unit.name = `${unit.unitSourceId} MiniBoss`;
  if (unit.image) {
    unit.image.sprite.scale.x *= config.UNIT_MINIBOSS_SCALE_MULTIPLIER;
    unit.image.sprite.scale.y *= config.UNIT_MINIBOSS_SCALE_MULTIPLIER;
  }
  unit.radius *= config.UNIT_MINIBOSS_SCALE_MULTIPLIER;
  unit.healthMax *= config.UNIT_MINIBOSS_HEALTH_MULTIPLIER;
  unit.health = unit.healthMax;
  unit.damage *= config.UNIT_MINIBOSS_DAMAGE_MULTIPLIER;
}
// Makes a copy of the unit's data suitable for 
// a predictionUnit
export function copyForPredictionUnit(u: IUnit, underworld: Underworld): IUnit {
  // Ensure that units have a path before they are copied
  // so that the prediction unit will have a reference to
  // a real path object
  if (!u.path) {
    const unitSource = allUnits[u.unitSourceId];
    if (unitSource) {
      const targets = unitSource.getUnitAttackTargets(u, underworld);
      if (targets && targets[0]) {
        underworld.setPath(u, targets[0]);
      }
    } else {
      console.error('Cannot find unitSource for id', u.unitSourceId);
    }
  }
  const { image, resolveDoneMoving, modifiers, ...rest } = u;
  return {
    ...rest,
    isPrediction: true,
    // A copy of the units current scale for the prediction copy
    // prediction copies do not have an image property, so this property is saved here
    // so that it may be accessed without making prediction units have a partial Image property
    // (prediction units are known to not have an image, this shall not change, other parts of the code
    // depends on this expectation)
    predictionScale: image?.sprite.scale.y,
    // prediction units INTENTIONALLY share a reference to the original
    // unit's path so that we can get the efficiency gains of
    // cached paths per unit.  If we made a deep copy instead, the
    // prediction unit would cache-miss each time it was recreated
    // and needed a path
    path: rest.path,
    // Prediction units should have full stamina because they will
    // when it is their turn
    stamina: rest.staminaMax,
    onDamageEvents: [...rest.onDamageEvents],
    onDeathEvents: [...rest.onDeathEvents],
    onAgroEvents: [...rest.onAgroEvents],
    onTurnStartEvents: [...rest.onTurnStartEvents],
    onTurnEndEvents: [...rest.onTurnEndEvents],
    onDrawSelectedEvents: [...rest.onDrawSelectedEvents],
    // Deep copy modifiers so it doesn't mutate the unit's actual modifiers object
    modifiers: JSON.parse(JSON.stringify(modifiers)),
    shaderUniforms: {},
    resolveDoneMoving: () => { }
  };

}

// A utility function for updating the player's mana max since
// there's a few considerations that I kept forgetting to update with it:
// Notably: rounding and updating manaPerTurn too
export function setPlayerAttributeMax(unit: IUnit, attribute: 'manaMax' | 'healthMax' | 'staminaMax', newValue: number) {
  if (unit.unitSourceId !== spellmasonUnitId) {
    console.error('setPlayerAttributeMax attempted on non player unit. This function is designed to update manaPerTurn too and so should only be used on player units.');
  }
  // Round to a whole number
  newValue = Math.ceil(newValue);
  if (attribute == 'manaMax') {
    unit.manaMax = newValue;
    unit.manaPerTurn = newValue;
    unit.mana = newValue;
  } else if (attribute == 'healthMax') {
    unit.healthMax = newValue;
    unit.health = newValue;
  } else if (attribute == 'staminaMax') {
    unit.staminaMax = newValue;
    unit.stamina = newValue;
  }
}
// Returns true if it is currently this unit's turn phase
export function isUnitsTurnPhase(unit: IUnit, underworld: Underworld): boolean {
  const { turn_phase: phase } = underworld;
  if (unit.unitType == UnitType.PLAYER_CONTROLLED) {
    return phase == turn_phase.PlayerTurns;
  } else {
    if (unit.faction == Faction.ALLY) {
      return phase == turn_phase.NPC_ALLY;
    } else {
      return phase == turn_phase.NPC_ENEMY;
    }
  }
}

const subTypeAttentionMarkerMapping = {
  [UnitSubType.MELEE]: 'badgeSword.png',
  [UnitSubType.RANGED_LOS]: 'badgeMagic.png',
  [UnitSubType.RANGED_RADIUS]: 'badgeMagic.png',
  [UnitSubType.SUPPORT_CLASS]: 'badgeMagic.png',
  [UnitSubType.SPECIAL_LOS]: 'badgeMagic.png',
  [UnitSubType.DOODAD]: 'badgeMagic.png',

}
export function subTypeToAttentionMarkerImage(unit: IUnit): string {
  if (unit.unitSourceId == ARCHER_ID || unit.unitSourceId == BLOOD_ARCHER_ID) {
    // Return a special archer badge for archers since they are ranged but don't use magic
    return 'badgeArcher.png';
  } else if (unit.unitSourceId == SUMMONER_ID || unit.unitSourceId == DARK_SUMMONER_ID || unit.unitSourceId == bossmasonUnitId) {
    return 'badgeSummon.png';
  } else {
    return subTypeAttentionMarkerMapping[unit.unitSubType];
  }
}
// In a circle around the target with a radius of target to unit, find locations that have line of sight
// and return them in an array
export function findLOSLocation(unit: IUnit, target: Vec2, underworld: Underworld): Vec2[] {
  const dist = distance(unit, target);
  const angleToEnemy = Vec.getAngleBetweenVec2s(target, unit);
  const degAwayFromTarget = 30 * Math.PI / 180;
  const increments = 1 * Math.PI / 180;
  const LOSLocations = [];
  for (let rad = angleToEnemy - degAwayFromTarget; rad <= angleToEnemy + degAwayFromTarget; rad += increments) {
    let pos = math.getPosAtAngleAndDistance(target, rad, dist)
    const intersection = closestLineSegmentIntersection({ p1: target, p2: pos }, underworld.walls);
    // globalThis.debugGraphics?.lineStyle(3, 0xff00ff, 1);
    if (intersection) {
      // globalThis.debugGraphics?.lineStyle(3, 0x0000ff, 1);
      pos = intersection;
    }
    LOSLocations.push(pos);

    // globalThis.debugGraphics?.drawCircle(pos.x, pos.y, 4);
  }
  return LOSLocations;

}


// handles drawing attack range, bloat radius, and similar graphics each frame while a unit is selected
export function drawSelectedGraphics(unit: IUnit, prediction: boolean = false, underworld: Underworld) {

  if (globalThis.headless || prediction || !globalThis.selectedUnitGraphics) return;

  for (let drawEvent of unit.onDrawSelectedEvents) {
    if (drawEvent) {
      const fn = Events.onDrawSelectedSource[drawEvent];
      if (fn) {
        fn(unit, prediction, underworld);
      } else {
        console.error('No function associated with onDrawSelected event', drawEvent);
      }
    }
  }

  // TODO - Ideally the logic below would be defined in each Unit's ts file individually
  // Instead of using if/else and unit subtypes

  // If unit is an archer, draw LOS attack line
  // instead of attack range for them
  if (unit.unitSubType == UnitSubType.RANGED_LOS || unit.unitSubType == UnitSubType.SPECIAL_LOS) {
    const unitSource = allUnits[unit.unitSourceId];
    let archerTargets: IUnit[] = [];

    if (unitSource) {
      archerTargets = unitSource.getUnitAttackTargets(unit, underworld);
    } else {
      console.error('Cannot find unitSource for ', unit.unitSourceId);
    }
    // If they don't have a target they can actually attack
    // draw a line to the closest enemy that they would target if
    // they had LOS
    let canAttack = true;
    if (!archerTargets.length) {
      const nextTarget = findClosestUnitInDifferentFaction(unit, underworld)
      if (nextTarget) {
        archerTargets.push(nextTarget);
      }
      // If getBestRangedLOSTarget returns undefined, the archer doesn't have a valid attack target
      canAttack = false;
    }

    if (archerTargets.length) {
      for (let target of archerTargets) {
        const attackLine = { p1: unit, p2: target };
        globalThis.selectedUnitGraphics.moveTo(attackLine.p1.x, attackLine.p1.y);

        // If the los unit can attack you, use red, if not, use grey
        const color = canAttack ? colors.healthRed : colors.outOfRangeGrey;

        // Draw los line
        globalThis.selectedUnitGraphics.lineStyle(3, color, 0.7);
        globalThis.selectedUnitGraphics.lineTo(attackLine.p2.x, attackLine.p2.y);
        globalThis.selectedUnitGraphics.drawCircle(attackLine.p2.x, attackLine.p2.y, 3);

        // Draw outer attack range circle
        drawUICircle(globalThis.selectedUnitGraphics, unit, unit.attackRange, color, i18n('Attack Range'));
      }
    }
  } else {
    if (unit.attackRange > 0) {
      const rangeCircleColor = false
        ? colors.outOfRangeGrey
        : unit.faction == Faction.ALLY
          ? colors.attackRangeAlly
          : colors.attackRangeEnemy;
      globalThis.selectedUnitGraphics.lineStyle(2, rangeCircleColor, 1.0);

      if (unit.unitSubType === UnitSubType.RANGED_RADIUS) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, unit.attackRange, rangeCircleColor, i18n('Attack Range'));
      } else if (unit.unitSubType === UnitSubType.SUPPORT_CLASS) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, unit.attackRange, rangeCircleColor, i18n('Support Range'));
      } else if (unit.unitSubType === UnitSubType.MELEE) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, unit.staminaMax + unit.attackRange, rangeCircleColor, i18n('Attack Range'));
      } else if (unit.unitSubType === UnitSubType.DOODAD) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, unit.attackRange, rangeCircleColor, i18n('Explosion Radius'));
      }
    }
  }
}

export async function demoAnimations(unit: IUnit) {
  for (let animKey of Object.keys(unit.animations)) {
    if (animKey === 'idle') {
      // Skip idle, since idle loops
      continue;
    }

    floatingText({
      coords: { x: unit.x, y: unit.y - config.COLLISION_MESH_RADIUS },
      text: animKey
    });

    await new Promise<void>(resolve => {
      Image.changeSprite(
        unit.image,
        // @ts-ignore
        unit.animations[animKey],
        containerUnits,
        resolve,
        { loop: false }
      );
    });
  }
  returnToDefaultSprite(unit);

}
export function resetUnitStats(unit: IUnit, underworld: Underworld) {
  if (!unit.alive) {
    resurrect(unit);
  }

  if (unit.image) {
    // Remove liquid mask which may be attached if the player died in liquid
    inLiquid.remove(unit);
  }

  // Remove all modifiers between levels
  // This prevents players from scamming shields at the end of a level
  // on infinite mana
  Object.keys(unit.modifiers).forEach(modifierKey => {
    const modifier = unit.modifiers[modifierKey];
    if (modifier) {
      if (!modifier.keepBetweenLevels) {
        removeModifier(unit, modifierKey, underworld);
      }
    }
  });

  // Reset mana and health - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  unit.mana = unit.manaMax;
  unit.health = unit.healthMax;
  unit.stamina = unit.staminaMax;

  returnToDefaultSprite(unit);

}