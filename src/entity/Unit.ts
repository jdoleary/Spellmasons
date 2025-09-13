import type * as PIXI from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import * as config from '../config';
import * as Image from '../graphics/Image';
import * as Player from '../entity/Player';
import * as math from '../jmath/math';
import { distance } from '../jmath/math';
import { containerCorpses, containerUnits, PixiSpriteOptions, startBloodParticleSplatter, updateNameText } from '../graphics/PixiUtils';
import * as colors from '../graphics/ui/colors';
import { UnitSubType, UnitType, Faction } from '../types/commonTypes';
import type { Vec2 } from '../jmath/Vec';
import * as Vec from '../jmath/Vec';
import * as CardUI from '../graphics/ui/CardUI';
import Events from '../Events';
import { allUnits } from './units';
import { allCards, allModifiers, eventsSorter, getCardsFromIds, Modifiers } from '../cards';
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
import * as inLiquid from '../inLiquid';
import { Modifier } from '../cards/util';
import { explain, EXPLAIN_DEATH, EXPLAIN_MINI_BOSSES, EXPLAIN_SOUL_DEBT } from '../graphics/Explain';
import { ARCHER_ID } from './units/archer';
import { BLOOD_ARCHER_ID } from './units/blood_archer';
import * as Obstacle from './Obstacle';
import { spellmasonUnitId } from './units/playerUnit';
import { SUMMONER_ID } from './units/summoner';
import { DARK_SUMMONER_ID } from './units/darkSummoner';
import { bossmasonUnitId } from './units/deathmason';
import { summoningSicknessId } from '../modifierSummoningSickness';
import * as log from '../log';
import { suffocateCardId, updateSuffocate } from '../cards/suffocate';
import { doLiquidEffect } from '../inLiquid';
import { freezeCardId } from '../cards/freeze';
import { healSfx, oneOffHealAnimation } from '../effects/heal';
import { soulShardOwnerModifierId } from '../modifierSoulShardOwner';
import { getAllShardBearers } from '../cards/soul_shard';
import { darkTideId } from '../cards/dark_tide';
import { GORU_UNIT_ID, tryCollectSoul } from './units/goru';
import { undyingModifierId } from '../modifierUndying';
import { primedCorpseId } from '../modifierPrimedCorpse';
import { chooseObjectWithProbability, getUniqueSeedStringPerLevel, randInt } from '../jmath/rand';
import { ANCIENT_UNIT_ID } from './units/ancient';
import { IPickup } from './Pickup';
import seedrandom from 'seedrandom';
import { slimeId } from '../modifierSlime';
import { deathmasonCardProbabilities, isRune } from '../cards/cardUtils';
import { VAMPIRE_ID } from './units/vampire';
import { growthId } from '../modifierGrowth';
import { resurrect_id } from '../cards/resurrect';
import { doubledamageId } from '../modifierDoubleDamage';
import { runeHardenedMinionsId } from '../modifierHardenedMinions';
import { runeSharpTeethId } from '../modifierSharpTeeth';
import { isDeathmason, isGoru } from './Player';
import { createFloatingParticleSystem, removeFloatingParticlesFor } from '../graphics/Particles';

const elCautionBox = document.querySelector('#caution-box') as HTMLElement;
const elCautionBoxText = document.querySelector('#caution-box-text') as HTMLElement;
const elHealthBar = document.querySelector('#health .fill') as HTMLElement;
const elHealthBarShield = document.querySelector('#health .fill:nth-child(2)') as HTMLElement;
const elHealthCostShield = document.querySelector('#health .cost:nth-child(4)') as HTMLElement;
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
export type IUnitSerialized = Omit<IUnit, "predictionCopy" | "resolveDoneMoving" | "image" | "animations" | "sfx" | "summonedBy"> & { image?: Image.IImageAnimatedSerialized, summonedById: number | undefined };
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
// NOTE: All **optional** props need to be explicitly in the 
// copyForPredictionUnit Object.assign object
// or else if they are missing from the real and present in the copy
// they will not update.
export type IUnit = HasSpace & HasLife & HasMana & HasStamina & {
  type: 'unit';
  // A unique id so that units can be identified
  // across the network
  id: number;
  soulFragments: number;
  soulLeftToCollect?: number;
  soulLeftToCollectMax?: number;
  // soulsBeingCollected prevents a network latency issue where more souls could leave a body
  // than the body had
  soulsBeingCollected?: boolean;
  unitSourceId: string;
  // if this IUnit is a prediction copy, real is a reference to the real unit that it is a copy of
  real?: IUnit;
  // if this IUnit is a real unit, predictionCopy is a reference to the latest prediction copy.
  // used for diffing the effects of a spell to sync multiplayer
  predictionCopy?: IUnit;
  // Used to substitute for sourceUnit in onKill
  summonedBy?: IUnit;
  // strength is a number that affects the sprite scale of this unit
  strength: number;
  // true if the unit was spawned at the beginning of the level and not
  // resurrected or cloned.  This prevents EXP scamming.
  originalLife: boolean;
  path?: UnitPath;
  moveSpeed: number;
  // A resolve callback for when a unit is done moving
  resolveDoneMoving: (doReturnToDefaultSprite: boolean | PromiseLike<boolean>) => void
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
  events: string[];
  animations: UnitAnimations;
  sfx: UnitSFX;
  modifiers: { [key: string]: Modifier };
  // Used for more intelligent AI battles so many unit don't overkill a single unit and leave a bunch of others untouched
  predictedNextTurnDamage: number;
  // Shows icons above the heads of enemies who will damage you next turn
  // Larger units need their marker positioned higher, which is why we need scaleY
  attentionMarker?: { imagePath: string, pos: Vec2, unitSpriteScaleY: number, markerScale: number, removalTimeout?: number };
  // This boolean is set to true when a unit is taking damage that should NOT
  // be piped through onDealDamage and onTakeDamage events.  This is set to true when
  // the events are triggering to prevent infinite recursion if a damage event does
  // more damage.  This property is attached to the unit to ensure that it is applied
  // regardless of where the damage comes from and is removed as soon as the events are
  // done being processed.
  takingPureDamage?: boolean;
  charges?: { [spellId: string]: number };
  chargesMaxAdditional?: number;
  difficulty: number;
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
  creator?: IUnit,
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
      attackRange: config.UNIT_BASE_RANGE,
      isMiniboss: false,
      faction,
      image: prediction ? undefined : Image.create({ x, y }, defaultImagePath, containerUnits),
      defaultImagePath,
      shaderUniforms: {},
      damage: 0,
      soulFragments: unitSubType == UnitSubType.DOODAD ? 0 : sourceUnit.spawnParams?.budgetCost || 1,
      strength: 1,
      // default blood color
      bloodColor: bloodColorDefault,
      health,
      healthMax: health,
      mana,
      manaMax: mana,
      manaCostToCast: 0,
      manaPerTurn: 0,
      alive: true,
      immovable: false,
      unitType,
      unitSubType,
      events: [],
      modifiers: {},
      animations: sourceUnit.animations,
      sfx: sourceUnit.sfx,
      inLiquid: false,
      UITargetCircleOffsetY: -10,
      beingPushed: false,
      predictedNextTurnDamage: 0,
      // Difficulty will be adjusted according to the underworld later in this function
      difficulty: 1,
    }, sourceUnitProps);

    // Adjust soul fragments based on number of player's connected to balance goru difficulty
    const playerAdjustedSoulFragments = Math.max(0, underworld.players.filter(p => p.clientConnected).length - 1);
    unit.soulFragments += Math.round(playerAdjustedSoulFragments * config.EXTRA_SOULS_PER_EXTRA_PLAYER);

    if (creator) {
      unit.summonedBy = creator;

      const runeHardenedMinions = unit.summonedBy.modifiers[runeHardenedMinionsId];
      if (runeHardenedMinions) {
        unit.healthMax += runeHardenedMinions.quantity;
        unit.health = unit.healthMax;
      }

      const runeSharpTeeth = unit.summonedBy.modifiers[runeSharpTeethId];
      if (runeSharpTeeth) {
        unit.damage += runeSharpTeeth.quantity;
      }
    }

    // Randomize frame so all created units aren't "idle animating" in perfect unison
    // it looks more organic
    if (unit.image) {
      unit.image.sprite.gotoAndPlay(randInt(0, unit.image.sprite.totalFrames - 1));
    }

    if (unit.image && !unit.image.sprite.filters) {
      unit.image.sprite.filters = [];
    }


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

    // Set the sprite scale, factoring in strength
    unit.image?.sprite.scale.set(config.NON_HEAVY_UNIT_SCALE);
    Image.setScaleFromModifiers(unit.image, unit.strength);

    // Note: This must be invoked after initial setting of stat and statMax (health, mana, stamina, etc)
    // so that it can scale stat relative to maxStat
    adjustUnitDifficulty(unit, underworld.difficulty);

    // Note, making miniboss must come AFTER setting the scale and difficulty
    // Note, this is the idempotent way to create a miniboss, pass isMiniboss:true to to the sourceUnitProps override
    // argument so that the unit is made a miniboss BEFORE tryFallInOutOfLiquid is called
    if (unit.isMiniboss) {
      makeMiniboss(unit, underworld);
    }

    if (sourceUnit.init) {
      // Initialize unit IF unit contains initialization function
      sourceUnit.init(unit, underworld);
    }
    // FYI: Subesequent filters must come after init.
    // init filters must come first so that
    // multi-color-replace filter is adjusting the original pixel colors
    // https://github.com/jdoleary/Spellmasons/issues/695
    // [More filters here if needed]  Note: Filters cause a HUGE burden on rendering
    // lag, use sparingly https://github.com/jdoleary/Spellmasons/issues/1006

    // Ensure all change factions logic applies when a unit is first created
    changeFaction(unit, faction);

    underworld.addUnitToArray(unit, prediction || false);
    // Start with a prediction copy so that their health bars will be rendered if they are an ally
    unit.predictionCopy = copyForPredictionUnit(unit, underworld);
    // Check to see if unit interacts with liquid
    Obstacle.tryFallInOutOfLiquid(unit, underworld, prediction || false);

    return unit;
  } else {
    throw new Error(`Source unit with id ${unitSourceId} does not exist`);
  }
}
export function updateAccessibilityOutline(unit: IUnit, targeted: boolean, outOfRange?: boolean) {
  if (!unit.image || !globalThis.accessibilityOutline) {
    return;
  }

  if (!unit.image.sprite.filters) {
    unit.image.sprite.filters = [];
  }
  const outlineSettings = globalThis.accessibilityOutline[unit.faction][outOfRange ? 'outOfRange' : targeted ? 'targeted' : 'regular'];
  let outlineFilter: OutlineFilter | undefined;
  // @ts-ignore __proto__ is not typed
  outlineFilter = unit.image.sprite.filters.find(f => f.__proto__ == OutlineFilter.prototype)
  if (outlineFilter) {
    if (outlineSettings.thickness) {
      // +1 because I want the thickness to be between 2-5 because one is way to pencil thin and looks bad
      outlineFilter.thickness = outlineSettings.thickness + 1;
      outlineFilter.color = outlineSettings.color;
    } else {
      // If thickness is 0, remove the filter:
      unit.image.sprite.filters = unit.image.sprite.filters.filter(x => x !== outlineFilter);
    }
  } else {
    // Only add the filter if thickness is not 0
    if (outlineSettings.thickness) {
      outlineFilter = new OutlineFilter(outlineSettings.thickness, outlineSettings.color, 0.1);
      unit.image.sprite.filters.push(outlineFilter);
    }
  }
}
interface DifficultyAdjustedUnitStats {
  healthMax: number;
  health: number;
}
export function adjustUnitPropsDueToDifficulty(stats: DifficultyAdjustedUnitStats, difficultyRatio: number): DifficultyAdjustedUnitStats {
  const returnStats: DifficultyAdjustedUnitStats = {
    // Max Health is multiplied by the current difficulty
    healthMax: stats.healthMax * difficultyRatio,
    health: stats.health * difficultyRatio,
  };
  return returnStats;
}

// sets all the properties that depend on difficulty
export function adjustUnitDifficulty(unit: IUnit, newDifficulty: number) {
  if (unit.faction == Faction.ALLY) {
    // Difficulty only affects enemy units
    return;
  }
  // Don't let difficulty be 0 which can occur on 0 player multiplayer games
  // which would initialize all units to 0 health
  if (unit.difficulty == 0) {
    unit.difficulty = 1;
  }
  if (newDifficulty == 0) {
    newDifficulty = 1;
  }

  const newDifficultyRatio = newDifficulty / unit.difficulty;

  const newStats = adjustUnitPropsDueToDifficulty(unit, newDifficultyRatio);
  Object.assign(unit, newStats);
  unit.difficulty = newDifficulty;
}

export function addModifier(unit: IUnit, key: string, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: object) {
  // Call custom modifier's add function
  const modifier = allModifiers[key];
  if (modifier) {
    // Immune units cannot recieve modifier
    if (unit.modifiers[immune.id]) {
      immune.notifyImmune(unit, false);
      return;
    }
    if (modifier.add) {
      if (allCards[key]?.supportQuantity && isNullOrUndef(quantity)) {
        console.error('Dev warning:', key, 'supportsQuantity; however quantity was not provided to the addModifier function.');
      }
      modifier.add(unit, underworld, prediction, quantity, extra);
    } else {
      console.error('No "add" modifier for ', key);
    }
    if (modifier.addModifierVisuals && !prediction) {
      modifier.addModifierVisuals(unit, underworld);
    }
    if (globalThis.player && unit == globalThis.player.unit) {
      underworld.syncPlayerPredictionUnitOnly();
      syncPlayerHealthManaUI(underworld);
    }
  } else {
    console.error('Modifier ', key, 'never registered.');
  }
}

// Do not call directly, only invoke via `removeRune` or `removeModifier`
// which supply checks to ensure it isn't called on the wrong unit
function _removeModifierInternal(unit: IUnit, modifier: Modifiers, key: string, underworld: Underworld) {
  // Call custom modifier's remove function
  const customRemoveFn = allModifiers[key]?.remove;
  if (customRemoveFn) {
    customRemoveFn(unit, underworld);
  }

  if (modifier && modifier.subsprite) {
    Image.removeSubSprite(unit.image, modifier.subsprite.imageName);
  }
  unit.events = unit.events.filter((e) => e !== key);
  delete unit.modifiers[key];
}
export function removeRune(unit: IUnit, key: string, underworld: Underworld) {
  const modifier = allModifiers[key];
  if (unit.originalLife) {
    console.error('Attempting to remove runes from player unit.  Aborted.');
    return;
  }
  // Only removes rune modifiers
  if (modifier && isRune(modifier)) {
    _removeModifierInternal(unit, modifier, key, underworld);
  }
}
export function removeModifier(unit: IUnit, key: string, underworld: Underworld) {
  const modifier = allModifiers[key];
  if (modifier) {
    if (isRune(modifier)) {
      // Modifier is a Rune or Persistent and should NOT be removed
      return;
    }
    _removeModifierInternal(unit, modifier, key, underworld);
  }
}

export function cleanup(unit: IUnit, maintainPosition?: boolean, forceCleanPlayerUnit?: boolean) {
  // Resolve done moving on cleanup to ensure that there are no forever-blocking promises
  if (unit.resolveDoneMoving) {
    unit.resolveDoneMoving(true);
  }
  if (unit.unitType == UnitType.PLAYER_CONTROLLED && !forceCleanPlayerUnit) {
    console.log('Protection: Do not clean up player unit, instead move to portal');
    // Instead of cleaning up the player unit, move it into the portal
    // represented by (NaN, NaN)
    unit.x = NaN;
    unit.y = NaN
    return;
  }
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
  // If selected unit is cleaned up, close tooltip
  if (unit == globalThis.selectedUnit) {
    globalThis.selectedUnit = undefined;
  }
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

  // omit predictionCopy because it is a transient reference and shouldn't be serialized
  const { resolveDoneMoving, animations, sfx, predictionCopy, events, summonedBy, ...rest } = unit
  return {
    ...rest,
    summonedById: summonedBy?.id || undefined,
    // Deep copy events so that serialized units don't share the object
    events: [...events],
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
  const { shaderUniforms, summonedById, ...restUnit } = unit
  const sourceUnit = allUnits[unit.unitSourceId];
  if (!sourceUnit) {
    console.error('Source unit not found for', unit.unitSourceId);
  }
  // Since resolveDoneMoving is about to be overwritten,
  // call it, just in case there is a pending promise (there shouldn't be)
  // so the promise doesn't hang forever
  let loadedunit: IUnit = {
    // Load defaults for new props that old save files might not have
    ...{ strength: 1, soulFragments: 1, difficulty: underworld.difficulty },
    ...restUnit,
    summonedBy: (prediction ? underworld.unitsPrediction : underworld.units).find(u => u.id == summonedById),
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
  console.debug('Loading unit with difficulty', loadedunit.difficulty, 'from underwrold difficulty:', underworld.difficulty)
  // Randomize frame so all created units aren't "idle animating" in perfect unison
  // it looks more organic
  if (loadedunit.image && loadedunit.image.sprite.imagePath === loadedunit.animations.idle) {
    loadedunit.image.sprite.gotoAndPlay(randInt(0, loadedunit.image.sprite.totalFrames - 1));
  }

  if (!prediction && loadedunit.id > underworld.lastUnitId) {
    underworld.lastUnitId = loadedunit.id;
  }
  for (let key of Object.keys(loadedunit.modifiers)) {
    const modifier = allModifiers[key];
    if (modifier && modifier.addModifierVisuals && !prediction) {
      // Invoke modifier.addModifierVisuals so that special init logic
      // such as there is in 'poison' will run
      modifier.addModifierVisuals(loadedunit, underworld);
    }
  }
  // Init filters array so that the filters can be re-added
  // below
  if (loadedunit.image && !loadedunit.image.sprite.filters) {
    loadedunit.image.sprite.filters = []
  }
  if (sourceUnit && sourceUnit.init) {
    // Initialize unit IF unit contains initialization function
    sourceUnit.init(loadedunit, underworld);
  }
  // FYI: Subesequent filters must come after init.
  // init filters must come first so that
  // multi-color-replace filter is adjusting the original pixel colors
  // https://github.com/jdoleary/Spellmasons/issues/695
  // [More filters here if needed]  Note: Filters cause a HUGE burden on rendering
  // lag, use sparingly https://github.com/jdoleary/Spellmasons/issues/1006


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
  Image.setScaleFromModifiers(loadedunit.image, loadedunit.strength);
  // Recreate floating souls on dead units on load
  if (!loadedunit.alive && !prediction && globalThis.player?.wizardType === 'Goru' && loadedunit.soulFragments > 0) {
    //Show uncollected souls:
    createFloatingParticleSystem(loadedunit, loadedunit.soulFragments);
  }

  // Special edge case protection
  if (loadedunit.unitType === UnitType.PLAYER_CONTROLLED && loadedunit.faction === Faction.ENEMY) {
    // Ensure player units are always ALLY faction
    console.error('Attempted to load a player unit in the Enemy faction');
    loadedunit.faction = Faction.ALLY;
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
  // Special edge case protection
  if (originalUnit.unitType === UnitType.PLAYER_CONTROLLED && originalUnit.faction === Faction.ENEMY) {
    // Ensure player units are always ALLY faction
    console.error('Attempted to syncronize a player unit to the Enemy faction');
    originalUnit.faction = Faction.ALLY;
  }
  // Note: returnToDefaultSprite must be called BEFORE Image.syncronize
  // to ensure that the originalUnit.image.sprite has a parent because
  // the parent could have been cleared previously.
  // TODO: TEMPORARILY DISABLED: How to keep syncronize from interrupting an animation while it's running
  // returnToDefaultSprite(originalUnit);
  // originalUnit.image = Image.syncronize(image, originalUnit.image);
}
export function changeToDieSprite(unit: IUnit) {
  // Early return: Special handling for die sprite.  Since die sprite changes container
  // when done animating, if changeSprite is called again, it'll switch it to containerUnits
  // and replay the animation without this early return
  const imagePath = globalThis.noGore
    ? 'tombstone'
    : unit.animations.die
  if (unit.image?.sprite.imagePath == imagePath) {
    return;
  }

  Image.changeSprite(
    unit.image,
    imagePath,
    containerUnits,
    // DieSprite intentionally stops animating when it is complete, therefore
    // resolver is undefined, since no promise is waiting for it.
    () => {
      // If the unit is still dead...
      if (!unit.alive && unit.image && containerCorpses) {
        // Change to corpses layer so that it doesn't continue to be outlines and doesn't render in front of walls
        containerCorpses.addChild(unit.image.sprite);
      }

    },
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
    const onFrameChange = (isNullOrUndef(finishOnFrame) || isNullOrUndef(keyMoment)) ? undefined : (currentFrame: number) => {
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
  }), { skipSpyPromise: true });
}

// Returns success
export function resurrect(unit: IUnit, underworld: Underworld, preventRepeatRez: boolean = true): boolean {
  // preventRepeatRez keeps players from infinite mana rez exploit: https://github.com/jdoleary/Spellmasons/issues/1140
  // preventRepeatRez also prevents infinite rune loops: https://github.com/jdoleary/Spellmasons/issues/1342
  if (preventRepeatRez) {
    if (unit.modifiers[resurrect_id]) {
      // Currently immune to repeat resurrect, abort
      floatingText({
        coords: unit,
        text: `${i18n(resurrect_id)} ${i18n('immune').toLocaleLowerCase()}`,
        style: { fill: 'red' }
      })
      return false;
    } else {
      // Make immune to future resurrect
      addModifier(unit, resurrect_id, underworld, false);
    }
  }
  unit.alive = true;
  // Return dead units back to full health/stamina/mana
  unit.health = unit.healthMax;
  unit.stamina = unit.staminaMax;
  unit.mana = unit.manaMax;
  if (unit.modifiers[primedCorpseId]) {
    removeModifier(unit, primedCorpseId, underworld);
  }
  // Resurrected units should have their floating souls removed
  removeFloatingParticlesFor(unit);
  returnToDefaultSprite(unit);
  // Unhide subsprites on resurrect
  for (let subsprite of unit.image?.sprite.children || []) {
    // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
    // which is used for identifying the sprite or animation that is currently active
    if (subsprite.imagePath) {
      subsprite.visible = true;
    }
  }
  return true;
}
export function die(unit: IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: IUnit) {
  if (!unit.alive) {
    // If already dead, do nothing
    return;
  }
  if (unit.name && !prediction) {
    underworld.battleLog(`${unit.name} died ${sourceUnit ? `from ${sourceUnit.name || sourceUnit.unitSourceId}` : ''}`);
  }
  // Play death sfx
  if (!prediction && !unit.flaggedForRemoval) {
    playSFXKey(globalThis.noGore ? 'oof' : unit.sfx.death);
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
  unit.resolveDoneMoving(false);
  // Clear unit path to prevent further movement in case of ressurect or similar
  unit.path = undefined;
  if (globalThis.player) {
    tryCollectSoul(globalThis.player, unit, underworld, prediction);
  }

  const events = [...unit.events, ...underworld.events];
  const overriddenSourceUnit = sourceUnit?.summonedBy || sourceUnit;

  for (let eventName of events) {
    if (eventName) {
      const fn = Events.onDeathSource[eventName];
      if (fn) {
        fn(unit, underworld, prediction, overriddenSourceUnit);
      }
    }
  }

  // Run onKill events for the sourceUnit of the lethal damage
  // This must occur before onDeath events are removed (Bounty)
  // Doodads don't trigger onKill effects
  if (overriddenSourceUnit && unit.unitSubType != UnitSubType.DOODAD) {
    const events = [...overriddenSourceUnit.events];
    for (let eventName of events) {
      if (eventName) {
        const fn = Events.onKillSource[eventName];
        if (fn) {
          fn(overriddenSourceUnit, unit, underworld, prediction);
        }
      }
    }
  }

  // Wait to run gameloopHeadless and forceMovePrediction
  // until syncronous code completes.
  // This ensures that if multiple units die at the "same" time
  // their resulting forcemoves (ex from explosion), will be processed
  // the same was it will be on clients
  // So: 
  // die, die, die, all force moves processed
  // rather than:
  // die, force moves, die, force moves, die, force moves
  setTimeout(() => {
    // Invoke simulating forceMovePredictions after onDeath callbacks
    // as the callbacks may create predictions that need to be processed such as
    // bloat + die causing a push.  Otherwise a raceTimeout could occur
    if (prediction) {
      if (underworld.forceMovePrediction.length > 0) {
        console.warn('Old fullySimulateForceMovesPredictions invokation caught unresolved forceMoves, this should not occur any more');
        underworld.fullySimulateForceMovePredictions();
      }
    }
    // Invoke gameLoopHeadless after onDeath callbacks
    // as the callbacks may create predictions that need to be processed such as
    // bloat + die causing a push.  Otherwise a raceTimeout could occur
    if (globalThis.headless) {
      underworld.triggerGameLoopHeadless();
    }
  }, 0);

  // Remove all modifiers
  // Note: This must come AFTER onDeathEvents or else it will remove the modifier
  // that added the onDeathEvent and the onDeathEvent won't trigger
  for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
    if (!modifierProperties.keepOnDeath) {
      removeModifier(unit, modifier, underworld);
    }
  }

  // Hide subsprites on death
  for (let subsprite of unit.image?.sprite.children || []) {
    // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
    // which is used for identifying the sprite or animation that is currently active
    if (subsprite.imagePath) {
      subsprite.visible = false;
    }
  }

  if (globalThis.player && globalThis.player.unit == unit) {
    clearSpellEffectProjection(underworld);
    CardUI.clearSelectedCards(underworld);
    queueCenteredFloatingText(`You Died`, 'red');
    explain(EXPLAIN_DEATH);
    playSFXKey('game_over');
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
  if (!prediction && globalThis.player?.wizardType === 'Goru' && unit.soulFragments > 0) {
    //Show uncollected souls:
    createFloatingParticleSystem(unit, unit.soulFragments);
  }
  // Once a unit dies it is no longer on it's originalLife
  unit.originalLife = false;
}
export function composeOnDealDamageEvents(damageArgs: damageArgs, underworld: Underworld, prediction: boolean): number {
  let { unit, amount, sourceUnit } = damageArgs;
  if (!sourceUnit) return amount;

  // Compose onDamageEvents
  const events = [...sourceUnit.events, ...underworld.events]
  for (let eventName of events) {
    const fn = Events.onDealDamageSource[eventName];
    if (fn) {
      // onDamage events can trigger effects and alter damage amount
      amount = fn(sourceUnit, amount, underworld, prediction, unit);
    }
  }
  return amount;
}
export function composeOnTakeDamageEvents(damageArgs: damageArgs, underworld: Underworld, prediction: boolean): number {
  let { unit, amount, sourceUnit } = damageArgs;

  // Compose onDamageEvents
  const events = [...unit.events, ...underworld.events]
  for (let eventName of events) {
    const fn = Events.onTakeDamageSource[eventName];
    if (fn) {
      // onDamage events can trigger effects and alter damage amount
      amount = fn(unit, amount, underworld, prediction, sourceUnit);
    }
  }
  return amount;
}

interface damageArgs {
  unit: IUnit,
  amount: number,
  sourceUnit?: IUnit,
  fromVec2?: Vec2,
  thinBloodLine?: boolean,
  // Prevents triggering on damage events
  pureDamage?: boolean,
}

// damageFromVec2 is the location that the damage came from and is used for blood splatter
export function takeDamage(damageArgs: damageArgs, underworld: Underworld, prediction: boolean) {
  let { unit, sourceUnit, fromVec2, thinBloodLine, pureDamage } = damageArgs;
  if (!unit.alive) {
    // Do not deal damage to dead units
    return;
  }
  if (unit.id == globalThis.player?.unit.id && !globalThis.player.isSpawned) {
    // Do not take damage while player is in the "Spawning ghost" state
    return;
  }
  // Immune units cannot be damaged
  if (unit.modifiers[immune.id]) {
    immune.notifyImmune(unit, false);
    return
  }
  // Prevent infinite recursion from damage events causing further damage
  if (!unit.takingPureDamage && !pureDamage) {
    // Disable re-processing damage events
    unit.takingPureDamage = true;

    // Process damage events
    damageArgs.amount = composeOnDealDamageEvents(damageArgs, underworld, prediction);
    damageArgs.amount = composeOnTakeDamageEvents(damageArgs, underworld, prediction);

    // re-enable processing damage events
    delete unit.takingPureDamage;
  }

  let amount = damageArgs.amount;
  if (amount == 0) {
    // Even though damage is 0, sync the player UI in the event that
    // the damage took down shield/mana barrier/etc.
    if (unit === globalThis.player?.unit && !prediction) {
      // Now that the player unit's properties have changed, sync the new state
      // with the player's predictionUnit so it is properly refelcted in the bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
      syncPlayerHealthManaUI(underworld);
    }
    return;
  }

  // Clamp the incoming healing amount to 0 to prevent heal over max
  // Don't clamp hp value itself because we dont want to remove existing overhealth
  if (amount < 0) {
    const maxHealingAllowed = Math.max(0, unit.healthMax - unit.health);
    if (Math.abs(amount) > maxHealingAllowed) {
      amount = -maxHealingAllowed;
    }
  }
  unit.health -= amount;
  // Prevent health from going under 0
  unit.health = Math.max(0, unit.health);

  if (!prediction) {
    if (amount > 0) {
      // - - - DAMAGE FX - - -
      playSFXKey(unit.sfx.damage);
      // Interupting an attack animation can skip the unit's action,
      // so we should ensure the unit is not attacking before playing the hit animation
      if (unit.image && !unit.animations.attack.includes(unit.image.sprite.imagePath)) {
        playAnimation(unit, unit.animations.hit, { loop: false, animationSpeed: 0.2 });
      }
      // All units bleed except Doodads
      if (unit.unitSubType !== UnitSubType.DOODAD) {
        if (fromVec2) {
          if (thinBloodLine) {
            startBloodParticleSplatter(underworld, fromVec2, unit, { maxRotationOffset: Math.PI / 16, numberOfParticles: 30 });
          } else {
            startBloodParticleSplatter(underworld, fromVec2, unit);
          }
        }
      }
    } else if (amount < 0) {
      // - - - HEALING FX - - -
      playSFXKey(healSfx);
      floatingText({ coords: unit, text: globalThis.getChosenLanguageCode() == 'en' ? `+${Math.abs(amount)} Health` : `${i18n('heal')} ${Math.abs(amount)}` });
      oneOffHealAnimation(unit);
    }
  }

  // If taking damage (not healing) and health is 0 or less...
  if (amount > 0 && unit.health <= 0) {
    const sourceUnit = damageArgs.sourceUnit;
    die(unit, underworld, prediction, sourceUnit);
  }

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, prediction);
  }

  if (unit.id == globalThis.player?.unit.id && !prediction) {
    // Now that the player unit's properties have changed, sync the new state
    // with the player's predictionUnit so it is properly refelcted in the bar
    // (note: this would be auto corrected on the next mouse move anyway)
    underworld.syncPlayerPredictionUnitOnly();
    syncPlayerHealthManaUI(underworld);
  }
}

// Turns decimals into UI friendly numbers
function txt(attribute: number): number {
  // We use ceil so 0.3 health doesn't display as 0 health
  return Math.ceil(attribute);
}
export function syncPlayerHealthManaUI(underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (!(globalThis.player && elHealthBar && elManaBar && elStaminaBar && elHealthLabel && elManaLabel && elStaminaBarLabel)) {
    return
  }
  const predictionPlayerUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id);

  const unit = globalThis.player.unit;
  const shieldAmount = unit.modifiers.shield?.quantity || 0;
  // Set the health/shield bars that shows how much health/shield you currently have
  elHealthBar.style["width"] = `${100 * unit.health / unit.healthMax}%`;
  elHealthBarShield.style["width"] = `${100 * Math.min(shieldAmount / unit.healthMax, 1)}%`;
  if (shieldAmount) {
    const shieldText = `${Math.round(shieldAmount)} shield`;
    elHealthLabel.innerHTML = `${shieldText} + ${txt(unit.health)} / ${txt(unit.healthMax)}`;
  } else {
    // Label health without shield
    elHealthLabel.innerHTML = `${txt(unit.health)}/${txt(unit.healthMax)}`;
  }

  // Set the health cost bar that shows how much health will be changed if the spell is cast
  if (predictionPlayerUnit) {
    const losingHealth = predictionPlayerUnit.health < unit.health;
    const willDie = predictionPlayerUnit.health <= 0;
    const predictionPlayerShield = predictionPlayerUnit.modifiers.shield?.quantity || 0
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

    // Show death, shield/health text, or health remaining if health has changed
    if (willDie) {
      elHealthLabel.innerHTML = i18n('Death');
    } else if (predictionPlayerShield) {
      const shieldText = `${Math.round(predictionPlayerShield)} shield`;
      elHealthLabel.innerHTML = `${shieldText} + ${txt(predictionPlayerUnit.health)} / ${txt(predictionPlayerUnit.healthMax)}`;
    } else if (predictionPlayerUnit.health != unit.health || predictionPlayerUnit.healthMax != unit.healthMax) {
      elHealthLabel.innerHTML = `${txt(predictionPlayerUnit.health)} ${i18n('Remaining')}`;
    }

    // Set the health bar that shows how much health you have after prediction
    elHealthBar.style["width"] = `${100 * predictionPlayerUnit.health / predictionPlayerUnit.healthMax}%`;
    if (losingHealth) {
      // Visualize health loss
      elHealthCost.style['left'] = `${100 * predictionPlayerUnit.health / predictionPlayerUnit.healthMax}%`;
      elHealthCost.style['width'] = `${100 * (unit.health - predictionPlayerUnit.health) / predictionPlayerUnit.healthMax}%`;
    } else {
      // Visualize health gain
      elHealthCost.style['left'] = `${100 * unit.health / predictionPlayerUnit.healthMax}%`;
      elHealthCost.style['width'] = `${100 * (predictionPlayerUnit.health - unit.health) / predictionPlayerUnit.healthMax}%`;
    }

    elHealthBarShield.style["width"] = `${100 * Math.min(predictionPlayerShield / predictionPlayerUnit.healthMax, 1)}%`;
    if (shieldLost) {
      // Visualize shield loss
      elHealthCostShield.style['left'] = `${100 * predictionPlayerShield / predictionPlayerUnit.healthMax}%`;
      elHealthCostShield.style['width'] = `${100 * (shieldAmount - predictionPlayerShield) / predictionPlayerUnit.healthMax}%`;
    } else {
      // Visualize shield gain
      elHealthCostShield.style['left'] = `${100 * shieldAmount / predictionPlayerUnit.healthMax}%`;
      elHealthCostShield.style['width'] = `${100 * (predictionPlayerShield - shieldAmount) / predictionPlayerUnit.healthMax}%`;
    }
  }

  // Set the 3 mana bars that show how much mana you currently have
  const manaRatio1 = Math.max(0, Math.min(unit.mana / unit.manaMax, 1));
  const manaRatio2 = Math.max(0, Math.min((unit.mana - unit.manaMax) / unit.manaMax, 1));
  const manaRatio3 = Math.max(0, Math.min((unit.mana - unit.manaMax * 2) / unit.manaMax, 1));
  elManaBar.style["width"] = `${100 * manaRatio1}%`;
  elManaBar2.style["width"] = `${100 * manaRatio2}%`;
  elManaBar3.style["width"] = `${100 * manaRatio3}%`;


  // Exception: Deathmason "manabar" becomes a bar that tracks the number of charges or cards the player has
  if (isDeathmason(globalThis.player) && predictionPlayerUnit) {
    elManaBar.style["width"] = `0%`;
    elManaBar2.style["width"] = `0%`;
    const currentCharges = countCharges(predictionPlayerUnit)
    const maxCharges = getMaxCharges(predictionPlayerUnit, underworld);
    const ratio = currentCharges / maxCharges;
    elManaBar3.style["width"] = `${100 * ratio}%`;
    elManaLabel.innerHTML = `${currentCharges}/${maxCharges}`;
  } else if (isGoru(globalThis.player) && predictionPlayerUnit) {
    elManaBar.style["width"] = `0%`;
    elManaBar2.style["width"] = `0%`;
    elManaBar3.style["width"] = `100%`;
    const inSoulDebt = predictionPlayerUnit.soulFragments < 0
    const text = inSoulDebt ? `${Math.floor(predictionPlayerUnit.soulFragments)} ${i18n('Debt')}  : ${unit.soulLeftToCollect} ${i18n('Left')}` : `${Math.floor(predictionPlayerUnit.soulFragments)} ${i18n('Souls')} : ${unit.soulLeftToCollect} ${i18n('Left')}`;
    elManaLabel.dataset.soulFragments = predictionPlayerUnit.soulFragments.toString();
    elManaLabel.classList.toggle('souldebt', inSoulDebt)
    elManaLabel.innerHTML = text;
    if (inSoulDebt) {
      explain(EXPLAIN_SOUL_DEBT);
    }


  } else {
    // Regular spellmasons
    // Set the 3 mana cost bars that show how much mana will be removed if the spell is cast
    if (predictionPlayerUnit) {
      if (predictionPlayerUnit.mana != unit.mana || predictionPlayerUnit.manaMax != unit.manaMax) {
        if (predictionPlayerUnit.mana < 0) {
          // If a player queues up a spell while another spell is casting,
          // it may not block them from adding a spell beyond the mana that they have
          // because the mana is actively changing from the currently casting spell,
          // so rather than showing negative mana, show "Insufficient Mana"
          // (Note, it will still prevent them from casting this spell on click, it's just
          // that it won't prevent them from queing a spell)
          elManaLabel.innerHTML = i18n('Insufficient Mana');
        } else {
          elManaLabel.innerHTML = `${txt(predictionPlayerUnit.mana)} ${i18n('Remaining')}`;
        }
      } else {
        elManaLabel.innerHTML = `${txt(unit.mana)}/${txt(unit.manaMax)}`;
      }

      // Display amount of post-prediction mana in each of the 3 mana bars
      // Cannot be < 0 or more than manaMax (aka 1 full bar)
      const predictionManaRatio1 = Math.max(0, Math.min(predictionPlayerUnit.mana / predictionPlayerUnit.manaMax, 1));
      const predictionManaRatio2 = Math.max(0, Math.min((predictionPlayerUnit.mana - predictionPlayerUnit.manaMax) / predictionPlayerUnit.manaMax, 1));
      const predictionManaRatio3 = Math.max(0, Math.min((predictionPlayerUnit.mana - predictionPlayerUnit.manaMax * 2) / predictionPlayerUnit.manaMax, 1));
      elManaBar.style["width"] = `${100 * predictionManaRatio1}%`;
      elManaBar2.style["width"] = `${100 * predictionManaRatio2}%`;
      elManaBar3.style["width"] = `${100 * predictionManaRatio3}%`;

      elManaCost.style['left'] = `100%`;
      elManaCost2.style['left'] = `100%`;
      elManaCost3.style['left'] = `100%`;

      if (predictionPlayerUnit.mana < unit.mana) {
        // Visualize mana loss
        let leftstart = predictionPlayerUnit.mana / predictionPlayerUnit.manaMax;
        let rightEnd = unit.mana / predictionPlayerUnit.manaMax;

        // First bar
        elManaCost.style['left'] = `${100 * leftstart}%`;
        elManaCost.style['width'] = `${100 * Math.min((rightEnd - leftstart), 1)}%`;

        // Second bar
        elManaCost2.style['left'] = `${100 * (leftstart - 1)}%`;
        elManaCost2.style['width'] = `${100 * Math.min((rightEnd - leftstart), 1)}%`;

        // Third bar
        elManaCost3.style['left'] = `${100 * (leftstart - 2)}%`;
        elManaCost3.style['width'] = `${100 * Math.min((rightEnd - leftstart), 1)}%`;
      } else {
        // Visualize mana gain
        let leftstart = unit.mana / predictionPlayerUnit.manaMax;
        let rightEnd = predictionPlayerUnit.mana / predictionPlayerUnit.manaMax;

        // First bar
        let barStart = Math.max(leftstart, rightEnd - 1);
        elManaCost.style['left'] = `${100 * barStart}%`;
        elManaCost.style['width'] = `${100 * (rightEnd - barStart)}%`;

        // Second bar
        barStart = Math.max(leftstart - 1, rightEnd - 2);
        elManaCost2.style['left'] = `${100 * barStart}%`;
        elManaCost2.style['width'] = `${100 * (rightEnd - 1 - barStart)}%`;

        // Third bar
        barStart = Math.max(leftstart - 2, rightEnd - 3);
        elManaCost3.style['left'] = `${100 * barStart}%`;
        elManaCost3.style['width'] = `${100 * (rightEnd - 2 - barStart)}%`;
      }
    }
  }

  syncStaminaBar();
  const staminaLeft = Math.max(0, unit.stamina);
  if (staminaLeft <= 0 && !player?.endedTurn) {
    // Now that the current player has moved, highlight the "end-turn-btn" to
    // remind them that they need to end their turn before they can move again
    document.querySelector('#end-turn-btn')?.classList.add('highlight');
  } else {
    document.querySelector('#end-turn-btn')?.classList.remove('highlight');
  }
}
export function syncStaminaBar() {
  const unit = globalThis.player?.unit;
  if (unit) {
    const staminaLeft = Math.max(0, unit.stamina);
    elStaminaBar.style["width"] = `${100 * unit.stamina / unit.staminaMax}%`;
    // At the end of the level when stamina is set super high, just show their max stamina so that
    // it appears that moving after level end doesn't decrease your stamina
    elStaminaBarLabel.innerHTML = staminaLeft > 100_000 ? `${txt(unit.staminaMax)}` : `${txt(staminaLeft)}`;
  }
}

export function isBoss(unitSourceId: string) {
  const bosses = [bossmasonUnitId, GORU_UNIT_ID]
  return bosses.includes(unitSourceId);
}

// Returns whether or not a unit is truly dead
// Considers game state and undying effects
// to-be-revived enemies are counted in "remaining" units
// Used for game loop logic
export function isRemaining(unit: IUnit, underworld: Underworld, prediction: boolean) {
  return !unit.flaggedForRemoval && (unit.alive
    || (unit.modifiers[undyingModifierId])
    || (unit.modifiers[soulShardOwnerModifierId] && getAllShardBearers(unit, underworld, prediction).length > 0));
}

export function canAct(unit: IUnit): boolean {
  if (!unit.alive) {
    return false;
  }

  // Frozen and newly summoned units can't act
  if ((unit.modifiers[freezeCardId] && unit.modifiers[freezeCardId].quantity > 0) || unit.modifiers[summoningSicknessId]) {
    return false;
  }

  return true;
}

export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    // console.log("canMove: false - unit is not alive")
    return false;
  }
  // Dark Tide is a curse that prevents movement if the unit is in liquid
  if (unit.modifiers[darkTideId] && unit.inLiquid) {
    return false;
  }
  // Do not move if already moved
  if (unit.stamina <= 0) {
    // console.log("canMove: false - unit has already used all their stamina this turn")
    return false;
  }
  // No reason to move if speed is <= 0
  if (unit.moveSpeed <= 0) {
    return false;
  }
  return true;
}
export function deadUnits(unit: IUnit, units: IUnit[]) {
  // u !== unit excludes self from returning as the closest unit
  return units.filter(
    u => u !== unit && !u.alive && u.unitSubType !== UnitSubType.DOODAD,
  );
}
export function livingUnitsInSameFaction(unit: IUnit, units: IUnit[]) {
  // u !== unit excludes self from returning as the closest unit
  return units.filter(
    u => u !== unit && u.faction == unit.faction && u.alive && u.unitSubType !== UnitSubType.DOODAD,
  );
}
export function livingUnitsInDifferentFaction(unit: IUnit, units: IUnit[]) {
  return units.filter(
    u => u.faction !== unit.faction && u.alive && u.unitSubType !== UnitSubType.DOODAD,
  );
}
export function findClosestUnitInSameFaction(unit: IUnit, units: IUnit[]): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInSameFaction(unit, units));
}
export function findClosestUnitInDifferentFactionSmartTarget(
  unit: IUnit,
  units: IUnit[]
): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInDifferentFaction(unit, units)
    .filter(filterSmartTarget)
  );
}
export function closestInListOfUnits(source: Vec2, units: IUnit[]): IUnit | undefined {
  return units.reduce<{ closest: IUnit | undefined; distance: number }>(
    (acc, currentUnitConsidered) => {
      const dist = math.distance(currentUnitConsidered, source);
      if (dist <= acc.distance) {
        return { closest: currentUnitConsidered, distance: dist };
      }
      return acc;
    },
    { closest: undefined, distance: Number.MAX_SAFE_INTEGER },
  ).closest;
}
// To be used in a filterFunction
export function filterSmartTarget(u: IUnit) {
  // Smart Target: Try to attack units that aren't already going to take fatal damage from other ally npc
  // Exception, always allow overkilling a player unit for many reasons:
  // The player unit may be shielded or absorb damage in some way that predictNextTurnDamage doesn't catch
  // also filtering player units out may interfere with prediction attack badges
  return u.unitType == UnitType.PLAYER_CONTROLLED || u.predictedNextTurnDamage < u.health;
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

  return raceTimeout(timeoutMs, `moveTowards; ${unit.unitSourceId}`, new Promise<boolean>((resolve) => {
    // Trigger previous resolveDoneMoving since we're overwriting it:
    unit.resolveDoneMoving(false);
    // Set new resolve done moving, so that this moveTowards can be awaited
    unit.resolveDoneMoving = resolve;
  })).then((doReturnToDefaultSprite) => {
    if (unit.image && doReturnToDefaultSprite) {
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
export function setLocation(unit: IUnit, coordinates: Vec2, underworld: Underworld, prediction: boolean) {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  unit.path = undefined;
  underworld.checkPickupCollisions(unit, prediction);
}
export function changeFaction(unit: IUnit, faction: Faction) {
  // Special edge case: prevent changing a Player unit's faction to Enemy
  if (unit.unitType === UnitType.PLAYER_CONTROLLED && faction == Faction.ENEMY) {
    console.error('Attempted to change a player units faction');
    // Ensure player units remail on the ALLY faction
    unit.faction == Faction.ALLY;
    return;
  }

  unit.faction = faction;
}

// syncImage updates a unit's Image to match it's game state
export function syncImage(unit: IUnit) {
  if (unit.image) {
    unit.image.sprite.x = unit.x;
    unit.image.sprite.y = unit.y;
  }
}
export function getExplainPathForUnitId(id: string): string {
  // Disable explain unit gifs if gore is disabled because they contain gore
  if (globalThis.noGore) {
    return '';
  }
  return "images/explain/units/" + id.split(' ').join('') + ".gif";
}
export function inRange(unit: IUnit, target: Vec2): boolean {
  return math.distance(unit, target) <= unit.attackRange;
}

export async function startTurnForUnits(units: IUnit[], underworld: Underworld, prediction: boolean, faction: Faction) {
  // Add mana to Player units
  for (let unit of units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED && u.alive)) {
    // Restore player to max mana at start of turn
    // Let mana remain above max if it already is
    // (due to other influences like mana potions, spells, etc);
    unit.mana = Math.max(unit.manaMax, unit.mana);
    if (!!unit.soulLeftToCollectMax) {
      unit.soulLeftToCollect = unit.soulLeftToCollectMax;
    }
    // Draw new charges
    if (unit.charges) {
      // Discard cards for Deathmason now that it is a new turn
      const unitsPlayer = underworld.players.find(p => p.unit == unit);
      if (unitsPlayer) {
        // At the beginning of a turn, discard all cards and draw anew
        Player.discardCards(unitsPlayer, underworld, {});
      }
      // Draw up to max charges
      refillCharges(unit, underworld);
    }
  }

  // Regenerate stamina to max
  for (let unit of units.filter(u => u.alive)) {
    // Clear path so they don't start moving from a previous path as soon as they get stamina
    // Units should only move if their path is set anew during their action()
    unit.path = undefined;
    if (unit.stamina < unit.staminaMax) {
      unit.stamina = unit.staminaMax;
    }
  }

  // Trigger start turn events
  const turnStartPromises = [];
  for (let unit of units) {
    turnStartPromises.push(runTurnStartEvents(unit, underworld, prediction, faction))
  }
  await raceTimeout(5000, 'Turn Start Events did not resolve', Promise.all(turnStartPromises));
}

export async function endTurnForUnits(units: IUnit[], underworld: Underworld, prediction: boolean, faction: Faction) {
  // Add mana to AI units
  for (let unit of units.filter(u => u.unitType == UnitType.AI && u.alive)) {
    unit.mana += unit.manaPerTurn;
    // Cap manaPerTurn at manaMax
    unit.mana = Math.min(unit.mana, unit.manaMax);
  }

  // At the end of their turn, deal damage if still in liquid
  for (let unit of units.filter(u => u.inLiquid && u.alive)) {
    doLiquidEffect(underworld, unit, false);
    floatingText({ coords: unit, text: 'Liquid damage', style: { fill: 'red' } });
  }

  // Trigger end turn events
  const turnEndPromises = [];
  for (let unit of units) {
    turnEndPromises.push(runTurnEndEvents(unit, underworld, prediction, faction))
  }
  await raceTimeout(5000, 'Turn End Events did not resolve', Promise.all(turnEndPromises));
}

export async function runTurnStartEvents(unit: IUnit, underworld: Underworld, prediction: boolean, faction: Faction) {
  const events = [...unit.events, ...underworld.events];
  const promises = events.map(
    async (eventName) => {
      const fn = Events.onTurnStartSource[eventName];
      if (fn) {
        await fn(unit, underworld, prediction, faction);
      }
    },
  );
  // Run force moves (onTurnStart events may have created force moves that 
  // the headless underworld needs to run)
  underworld.triggerGameLoopHeadless();
  await Promise.all(promises);
}

export async function runTurnEndEvents(unit: IUnit, underworld: Underworld, prediction: boolean, faction: Faction) {
  const events = [...unit.events, ...underworld.events];
  const promises = events.map(
    async (eventName) => {
      const fn = Events.onTurnEndSource[eventName];
      if (fn) {
        await fn(unit, underworld, prediction, faction);
      }
    },
  )
  // Run force moves (onTurnStart events may have created force moves that 
  // the headless underworld needs to run)
  underworld.triggerGameLoopHeadless();
  await Promise.all(promises);
}

export async function runPickupEvents(unit: IUnit, pickup: IPickup, underworld: Underworld, prediction: boolean) {
  const events = [...unit.events, ...underworld.events];
  await raceTimeout(3000, `RunPickupEvents (Unit: ${unit.unitSourceId} | Pickup: ${pickup.name} | Prediction: ${prediction})`,
    Promise.all(events.map(
      async (eventName) => {
        const fn = Events.onPickupSource[eventName];
        if (fn) {
          await fn(unit, pickup, underworld, prediction);
        }
      },
    ))
  );
}
export function getSoulFragmentsForMiniboss(nonMinibossSoulFragments: number): number {
  return Math.round(nonMinibossSoulFragments * 1.5);
}

export function makeMiniboss(unit: IUnit, underworld: Underworld) {
  unit.isMiniboss = true;
  explain(EXPLAIN_MINI_BOSSES);
  unit.name = unitSourceIdToName(unit.unitSourceId, true);
  unit.radius *= config.UNIT_MINIBOSS_SCALE_MULTIPLIER;
  unit.damage *= config.UNIT_MINIBOSS_DAMAGE_MULTIPLIER;
  unit.healthMax *= config.UNIT_MINIBOSS_HEALTH_MULTIPLIER;
  unit.health *= config.UNIT_MINIBOSS_HEALTH_MULTIPLIER;
  unit.manaMax *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
  unit.mana *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
  unit.manaPerTurn *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
  unit.manaCostToCast *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
  unit.strength *= config.MINIBOSS_STRENGTH_MULTIPLIER;
  unit.soulFragments = getSoulFragmentsForMiniboss(unit.soulFragments);
  Image.setScaleFromModifiers(unit.image, unit.strength);
  const crown = Image.addSubSprite(unit.image, 'crown');
  // Exception: Ancients are short so their crown
  // should be placed lower
  if (crown && unit.unitSourceId == ANCIENT_UNIT_ID) {
    crown.y += config.HEALTH_BAR_UI_Y_POS / 2;
  }

  // dangeLevel: The level when multi-modifier minibosses becomes possible
  const dangerLevel = 7;
  const dangerLevel2 = 10;
  const numLevelsPastDangerLevel = Math.max(0, underworld.levelIndex - dangerLevel);
  const numLevelsPastDangerLevel2 = Math.max(0, underworld.levelIndex - dangerLevel2);
  // A seed unique to each underworld and level and unit (NOT unique to players, intentionally left undefined)
  const seed = seedrandom(getUniqueSeedStringPerLevel(underworld, undefined) + `${unit.id}`);
  const numberOfModifiers = chooseObjectWithProbability([
    {
      num: 1,
      probability: 100,
    },
    {
      num: 2,
      probability: numLevelsPastDangerLevel * 20,
    },
    {
      num: 3,
      probability: 0 + numLevelsPastDangerLevel2 * 10,
    },
  ], seed) || { num: 1 };
  // Filter out modifiers with no probability and add the modifier key to the object.
  let availableSpawnModifiers = Object.entries(allModifiers).flatMap(([key, mod]) => typeof mod.probability === 'number' ? [{ ...mod, id: key }] : [])
    // Remove modifiers that are unavailable until later levels
    .filter(mod => isNullOrUndef(mod.unavailableUntilLevelIndex) || underworld.levelIndex >= mod.unavailableUntilLevelIndex);


  //// start: Special Modifier Exceptions
  // ban "Slime" from Support classes and bosses
  if (unit.unitSubType === UnitSubType.SUPPORT_CLASS || unit.unitSourceId === GORU_UNIT_ID || unit.unitSourceId === bossmasonUnitId) {
    availableSpawnModifiers = availableSpawnModifiers.filter(x => x.id !== slimeId && x.id !== doubledamageId);
  }
  // Growth is OP on vampires because of the extra health on blood curse
  if (unit.unitSourceId === VAMPIRE_ID) {
    availableSpawnModifiers = availableSpawnModifiers.filter(x => x.id !== growthId);
  }
  //// end: Special Modifier Exceptions

  for (let i = 0; i < numberOfModifiers.num; i++) {
    // .map satisfies the compiler's need for certainty that probability is not undefined
    const mod = chooseObjectWithProbability(availableSpawnModifiers.map(m => ({ probability: 0, ...m })), seed);
    if (mod) {
      addModifier(unit, mod.id, underworld, false, 1);
      // Remove mod from next selection
      availableSpawnModifiers = availableSpawnModifiers.filter(m => m !== mod);
    }
  }
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
      // Only copy prediction paths for AI because only AI need to show you if they'll hit you
      if (u.unitType == UnitType.AI) {
        const targets = unitSource.getUnitAttackTargets(u, underworld);
        if (targets && targets[0]) {
          underworld.setPath(u, targets[0]);
        }
      }
    } else {
      console.error('Cannot find unitSource for id', u.unitSourceId);
    }
  }
  const { image, resolveDoneMoving, modifiers, ...rest } = u;
  const predictionUnit = Object.assign(u.predictionCopy || {}, {
    ...rest,
    real: u,
    // If there is a summonedBy reference, make sure it's the predictionCopy
    summonedBy: u.summonedBy?.predictionCopy,
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
    events: [...rest.events],
    // Deep copy modifiers so it doesn't mutate the unit's actual modifiers object
    modifiers: JSON.parse(JSON.stringify(modifiers)),
    shaderUniforms: {},
    resolveDoneMoving: () => { },
    // NOTE: All **optional** props need to be explicitly in this object
    // or else if they are missing from the real and present in the copy
    // they will not update.
    flaggedForRemoval: u.flaggedForRemoval,
  });

  // Remove charges if missing on Unit to sync wizardtype-deathmason state
  if (isNullOrUndef(u.charges)) {
    delete predictionUnit.charges;
  }

  // Prediction units should have full stamina because they will
  // when it is their turn.  This is critical for melee ai attack predictions
  // but is NOT set for player units who may use stamia for casting in which case
  // the stamina must match the real unit so they can get an "insufficient stamina"
  // message.
  // Re: 8557fc
  if (u.unitType == UnitType.AI)
    predictionUnit.stamina = predictionUnit.staminaMax;

  // Kill the ref so prediction unit's charges doesn't modifiy the real units charges
  if (u.charges) {
    predictionUnit.charges = { ...u.charges };
  }
  // Make sure prediction units don't have a ref to themself in predictionCopy
  delete predictionUnit.predictionCopy;
  u.predictionCopy = predictionUnit;
  return predictionUnit;

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
  [UnitSubType.GORU_BOSS]: 'badgeMagic.png',
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

  if (globalThis.headless || prediction || !globalThis.selectedUnitGraphics || globalThis.recordingShorts) return;

  for (let drawEvent of unit.events) {
    const fn = Events.onDrawSelectedSource[drawEvent];
    if (fn) {
      fn(unit, underworld, prediction);
    }
  }

  // TODO - Ideally the logic below would be defined in each Unit's ts file individually
  // Instead of using if/else and unit subtypes
  // Cleanup for AI Refactor https://github.com/jdoleary/Spellmasons/issues/388

  if (unit.alive) {
    // Only use predictionCopy to draw centerpoitn on players turns so that it shows where they **will** be if
    // you push them; however on all other turns use the unit because they may be moving and so their circle should
    // move with them
    const coordinates = underworld.turn_phase == turn_phase.PlayerTurns ? (unit.predictionCopy || unit) : unit;
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
        const nextTarget = findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units)
        if (nextTarget) {
          archerTargets.push(nextTarget);
        }
        // If getBestRangedLOSTarget returns undefined, the archer doesn't have a valid attack target
        canAttack = false;
      }
      const rangeCircleColor = false
        ? colors.outOfRangeGrey
        : unit.faction == Faction.ALLY
          ? colors.attackRangeAlly
          : colors.attackRangeEnemy;

      // Draw outer attack range circle
      drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.attackRange, rangeCircleColor, i18n('Attack Range'));

      // TODO - Consider re-implementing attack lines with AI refactor
      // https://github.com/jdoleary/Spellmasons/issues/408
      // if (archerTargets.length) {
      //   for (let target of archerTargets) {
      //     const attackLine = { p1: unit, p2: target };
      //     globalThis.selectedUnitGraphics.moveTo(attackLine.p1.x, attackLine.p1.y);

      //     // If the los unit can attack you, use red, if not, use grey
      //     const color = canAttack ? colors.healthRed : colors.outOfRangeGrey;

      //     // Draw los line
      //     globalThis.selectedUnitGraphics.lineStyle(3, color, 0.7);
      //     globalThis.selectedUnitGraphics.lineTo(attackLine.p2.x, attackLine.p2.y);
      //     globalThis.selectedUnitGraphics.drawCircle(attackLine.p2.x, attackLine.p2.y, 3);
      //   }
      // }
    } else {
      if (unit.attackRange > 0) {
        if (globalThis.player && globalThis.player.unit == unit && globalThis.player.wizardType === 'Goru') {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, config.GORU_SOUL_COLLECT_RADIUS, 0xd9fff9, 'Soul Collection Radius');

        }
        // TODO - Unused outOfRangeGrey below, consider for AI refactor
        // https://github.com/jdoleary/Spellmasons/issues/388
        const rangeCircleColor = false
          ? colors.outOfRangeGrey
          : unit.faction == Faction.ALLY
            ? colors.attackRangeAlly
            : colors.attackRangeEnemy;
        globalThis.selectedUnitGraphics.lineStyle(2, rangeCircleColor, 1.0);

        if (unit.unitSubType === UnitSubType.RANGED_RADIUS) {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.attackRange, rangeCircleColor, i18n('Attack Range'));
        } else if (unit.unitSubType === UnitSubType.SUPPORT_CLASS) {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.attackRange, rangeCircleColor, i18n('Support Range'));
        } else if (unit.unitSubType === UnitSubType.MELEE) {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.staminaMax + unit.attackRange, rangeCircleColor, i18n('Attack Range'));
        } else if (unit.unitSubType === UnitSubType.DOODAD) {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.attackRange, rangeCircleColor, i18n('Explosion Radius'));
        } else if (unit.unitSubType === UnitSubType.GORU_BOSS) {
          drawUICircle(globalThis.selectedUnitGraphics, coordinates, unit.attackRange, rangeCircleColor, i18n('Attack Range'));
        }
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
    resurrect(unit, underworld);
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
      removeModifier(unit, modifierKey, underworld);
    }
  });

  // Reset mana and health - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  unit.mana = unit.manaMax;
  unit.health = unit.healthMax;
  unit.stamina = unit.staminaMax;
  // Reset size
  unit.strength = 1;
  Image.setScaleFromModifiers(unit.image, unit.strength);

  returnToDefaultSprite(unit);
}

export function unitSourceIdToName(unitSourceId: string, asMiniboss: boolean): string {
  return unitSourceId + (asMiniboss ? ' Miniboss' : '');
}

export function getFactionsOf(units: { faction: Faction }[]): Faction[] {
  const factions = units.map(u => u.faction);
  // This removes all duplicate entries from the list
  return [...new Set(factions)];
}

export function addEvent(unit: IUnit, eventId: string) {
  if (!unit.events.includes(eventId)) {
    unit.events.push(eventId);
    unit.events.sort(eventsSorter(allModifiers));
  }
}

export function countCharges(unit: IUnit): number {
  return isNullOrUndef(unit.charges) ? 0 : Object.values(unit.charges).reduce((count: number, cardCharges) => count + cardCharges, 0);
}

export function refillCharges(unit: IUnit, underworld: Underworld) {
  drawCharges(unit, underworld, getMaxCharges(unit, underworld) - countCharges(unit));
}
export function drawCharges(unit: IUnit, underworld: Underworld, count: number = 1) {
  const player = underworld.players.find(p => p.unit == unit);
  if (!player) {
    console.error('No associated player found for unit to drawCharges from');
    return;
  }
  if (!isDeathmason(player)) {
    console.warn('Aborting drawCharges for non-wizardtype-deathmason player');
    return;
  }
  let cards = getCardsFromIds(player.inventory);
  const replacedCardIds = cards.flatMap(card => card.replaces || []);
  // Exclude replaced cards from being drawn
  cards = cards.filter(c => !replacedCardIds.includes(c.id))
  const rSeed = `${underworld.seed}-${player.playerId}-${player.drawChargesSeed}-${player.inventory.filter(x => !!x).length}`;
  const random = seedrandom(rSeed);
  if (isNullOrUndef(unit.charges)) {
    unit.charges = {};
  }

  const cardsWithManaBasedProbability = deathmasonCardProbabilities(cards, unit);
  // Debug probabilities
  const maxProb = cardsWithManaBasedProbability.reduce((sum, cur) => sum + cur.probability, 0);
  console.table(cardsWithManaBasedProbability.map(c => ({ id: c.id, p: c.probability, percent: `${(100 * c.probability / maxProb).toFixed(2)}%` })).sort((a, b) => a.p - b.p));

  const TOTAL_ANIMATION_TIME = math.lerp(500, 2000, Math.min(1, count / 16));
  const delayBetweenAnimations = count > 1 ? TOTAL_ANIMATION_TIME / (count - 1) : 0;

  for (let i = 0; i < count; i++) {
    const alteredCard = chooseObjectWithProbability(cardsWithManaBasedProbability, random);
    // Add a charge
    if (alteredCard) {
      unit.charges[alteredCard.id] = (unit.charges[alteredCard.id] || 0) + 1;
      if (player == globalThis.player) {
        setTimeout(() => {
          playSFXKey('cardDraw');
          CardUI.animateDrawCard(alteredCard.card, underworld);
        }, i * delayBetweenAnimations);
      }
    }
  }
  if (globalThis.player && unit == globalThis.player.unit) {
    CardUI.updateCardBadges(underworld);
    underworld.syncPlayerPredictionUnitOnly();
    syncPlayerHealthManaUI(underworld);
  }

}
export function getMaxCharges(unit: IUnit, underworld: Underworld): number {
  if (unit.charges) {
    return 3 + underworld.levelIndex * 3 + (unit.chargesMaxAdditional || 0)
  } else {
    return 0;
  }
}