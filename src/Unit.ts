import * as config from './config';
import * as Image from './Image';
import * as math from './math';
import { distance } from './math';
import { addPixiSprite, containerUnits } from './PixiUtils';
import { UnitSubType, UnitType, Faction } from './commonTypes';
import type { Vec2 } from './Vec';
import * as Vec from './Vec';
import Events from './Events';
import makeAllRedShader from './shaders/selected';
import { addLerpable } from './lerpList';
import { findPath } from './Pathfinding';
const elHealthBar: HTMLElement = document.querySelector('#health .fill') as HTMLElement;
const elHealthLabel: HTMLElement = document.querySelector('#health .label') as HTMLElement;
const elManaBar: HTMLElement = document.querySelector('#mana .fill:nth-child(1)') as HTMLElement;
const elManaBar2: HTMLElement = document.querySelector('#mana .fill:nth-child(2)') as HTMLElement;
const elManaBar3: HTMLElement = document.querySelector('#mana .fill:nth-child(3)') as HTMLElement;
const elManaLabel: HTMLElement = document.querySelector('#mana .label') as HTMLElement;

export function getPlanningViewColor(unit: IUnit) {
  if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
    return 0x00ff00;
  }
  return 0xff0000;
}
// Make the UNIT_BASE_RADIUS a little smaller than the actual size of the image
// so that moving units can overlap with each other a bit so "crowding" looks more
// organic
const UNIT_BASE_RADIUS = 0.7 * config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE;
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IUnitSerialized = Omit<IUnit, "resolveDoneMoving" | "resolveDoneMovingTimeout" | "image"> & { image: Image.IImageSerialized };
export interface IUnit {
  // A unique id so that units can be identified
  // across the network
  id: number;
  unitSourceId: string;
  x: number;
  y: number;
  // lastX and lastY are used to determine when a unit has finished
  // moving (because then their current x,y and lastX,lastY will be 
  // identical)
  lastX: number;
  lastY: number;
  path: Vec2[];
  moveSpeed: number;
  // A resolve callback for when a unit is done moving
  resolveDoneMoving: () => void;
  resolveDoneMovingTimeout?: number;
  radius: number;
  moveDistance: number;
  // A counter to keep track of how far a unit has moved this turn
  distanceMovedThisTurn: number;
  attackRange: number;
  name?: string;
  faction: number;
  // If the unit moved this turn
  thisTurnMoved: boolean;
  image: Image.IImage;
  defaultImagePath: string;
  shaderUniforms: { [key: string]: any };
  damage: number;
  health: number;
  healthMax: number;
  mana: number;
  manaMax: number;
  manaPerTurn: number;
  alive: boolean;
  unitType: UnitType;
  unitSubType: UnitSubType;
  flaggedForRemoval?: boolean;
  // A list of names that correspond to Events.ts functions
  onDamageEvents: string[];
  onDeathEvents: string[];
  onMoveEvents: string[];
  onAgroEvents: string[];
  onTurnStartEvents: string[];
  modifiers: {
    [name: string]: {
      isCurse: boolean;
      [key: string]: any;
    };
  };
}
let lastUnitId = -1;
export function create(
  unitSourceId: string,
  x: number,
  y: number,
  faction: Faction,
  defaultImagePath: string,
  unitType: UnitType,
  unitSubType: UnitSubType,
  sourceUnitProps: Partial<IUnit> = {}
): IUnit {
  const unit: IUnit = Object.assign({
    id: ++lastUnitId,
    unitSourceId,
    x,
    y,
    lastX: x,
    lastY: y,
    radius: UNIT_BASE_RADIUS,
    path: [],
    moveSpeed: config.UNIT_MOVE_SPEED,
    resolveDoneMoving: () => { },
    resolveDoneMovingTimeout: undefined,
    moveDistance: config.UNIT_BASE_MOVE_DISTANCE,
    distanceMovedThisTurn: 0,
    attackRange: config.UNIT_BASE_ATTACK_RANGE,
    faction,
    thisTurnMoved: false,
    image: Image.create(x, y, defaultImagePath, containerUnits),
    defaultImagePath,
    shaderUniforms: {},
    damage: config.UNIT_BASE_DAMAGE,
    health: config.UNIT_BASE_HEALTH,
    healthMax: config.UNIT_BASE_HEALTH,
    mana: config.UNIT_BASE_MANA,
    manaMax: config.UNIT_BASE_MANA,
    manaPerTurn: config.MANA_GET_PER_TURN,
    alive: true,
    unitType,
    unitSubType,
    onDamageEvents: [],
    onDeathEvents: [],
    onMoveEvents: [],
    onAgroEvents: [],
    onTurnStartEvents: [],
    modifiers: {},
  }, sourceUnitProps);

  setupShaders(unit);

  // Ensure all change factions logic applies when a unit is first created
  changeFaction(unit, faction);

  unit.image.sprite.scale.set(config.NON_HEAVY_UNIT_SCALE);

  window.underworld.addUnitToArray(unit);

  return unit;
}
function setupShaders(unit: IUnit) {
  const all_red = makeAllRedShader()
  unit.shaderUniforms.all_red = all_red.uniforms;
  unit.image.sprite.filters = [all_red.filter];
}

export function removeModifier(unit: IUnit, key: string) {
  Image.removeSubSprite(unit.image, key);
  unit.onDamageEvents = unit.onDamageEvents.filter((e) => e !== key);
  unit.onDeathEvents = unit.onDeathEvents.filter((e) => e !== key);
  unit.onMoveEvents = unit.onMoveEvents.filter((e) => e !== key);
  unit.onAgroEvents = unit.onAgroEvents.filter((e) => e !== key);
  unit.onTurnStartEvents = unit.onTurnStartEvents.filter((e) => e !== key);
  delete unit.modifiers[key];
}

export function cleanup(unit: IUnit) {
  // Resolve done moving on cleanup to ensure that there are no forever-blocking promises
  if (unit.resolveDoneMoving) {
    unit.resolveDoneMoving();
  }
  unit.x = NaN;
  unit.y = NaN;
  unit.flaggedForRemoval = true;
  Image.cleanup(unit.image);
}
// Converts a unit entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full unit entity (with callbacks, shaderUniforms, etc - the things
// that can't be saved as JSON)
// This is the opposite of load
export function serialize(unit: IUnit): IUnitSerialized {
  // resolveDoneMoving is a callback that cannot be serialized
  // resolveDoneMovingTimeout is a setTimeout id that should not be serialized
  const { resolveDoneMoving, resolveDoneMovingTimeout, ...rest } = unit
  return {
    ...rest,
    image: Image.serialize(unit.image),
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
export function load(unit: IUnitSerialized): IUnit {
  const { shaderUniforms, ...restUnit } = unit
  // Since resolveDoneMoving is about to be overwritten,
  // call it, just in case there is a pending promise (there shouldn't be)
  // so the promise doesn't hang forever
  const loadedunit: IUnit = {
    ...restUnit,
    shaderUniforms: {},
    resolveDoneMoving: () => { },
    image: Image.load(unit.image, containerUnits),
  };
  setupShaders(loadedunit);
  // Load in shader uniforms by ONLY setting the uniforms that are saved
  // it is important that the other objects stay exactly the same
  // or else the shader won't render
  for (let [key, uniformObject] of Object.entries(shaderUniforms)) {
    for (let [keyUniform, value] of Object.entries(uniformObject)) {
      loadedunit.shaderUniforms[key][keyUniform] = value;
    }
  }
  window.underworld.addUnitToArray(loadedunit);
  if (!loadedunit.alive) {
    die(loadedunit);
  }
  return loadedunit;
}
// Similar but not the same as `load`, syncronize updates (mutates) a unit 
// entity with properties from a unit (in JSON)
// mutates originalUnit
export function syncronize(unitSerialized: IUnitSerialized, originalUnit: IUnit): void {
  // Note: shaderUniforms should not just be "assign"ed into the object because 
  // it requires special handling to have a valid link to the shader
  // and since syncronize is mainly meant to keep things like health and position in sync,
  // I'm choosing just to omit shaderUniforms from syncronize
  const { image, shaderUniforms, ...rest } = unitSerialized;
  Object.assign(originalUnit, rest);
  originalUnit.image = Image.syncronize(image, originalUnit.image);
}

// It is important to use this function when returning a unit to the previous
// sprite because it takes into account wether or not a unit is dead.  If a unit
// dies mid-animation and this function is not used, it would return to the default
// LIVING sprite, instead of the dead sprite.
export function returnToDefaultSprite(unit: IUnit) {
  const defaultImageString = unit.alive ? unit.defaultImagePath : 'units/corpse.png'
  Image.changeSprite(
    unit.image,
    addPixiSprite(defaultImageString, containerUnits),
  );
}

export function playAnimation(unit: IUnit, spritePath: string): Promise<void> {
  // Change animation and change back to default
  return new Promise<void>((resolve) => {
    Image.changeSprite(unit.image, addPixiSprite(spritePath, unit.image.sprite.parent, {
      loop: false,
      onComplete: () => {
        returnToDefaultSprite(unit);
        resolve();
      }
    }));
  });
}

export function resurrect(unit: IUnit) {
  // Return dead units back to full health
  unit.health = unit.healthMax;
  unit.alive = true;
  returnToDefaultSprite(unit);
}
export function die(unit: IUnit) {
  Image.changeSprite(
    unit.image,
    addPixiSprite('units/corpse.png', unit.image.sprite.parent),
  );
  unit.alive = false;
  // Ensure that the unit resolvesDoneMoving when they die in the event that 
  // they die while they are moving.  This prevents turn phase from getting stuck
  unit.resolveDoneMoving();
  // Remove all modifiers:
  for (let [modifier, _modifierProperties] of Object.entries(unit.modifiers)) {
    removeModifier(unit, modifier);
  }
}
export async function takeDamage(unit: IUnit, amount: number) {
  let alteredAmount = amount;
  // Compose onDamageEvents
  for (let eventName of unit.onDamageEvents) {
    const fn = Events.onDamageSource[eventName];
    if (fn) {
      alteredAmount = fn(unit, alteredAmount);
    }
  }
  unit.health -= alteredAmount;
  // Prevent health from going over maximum or under 0
  unit.health = Math.max(0, Math.min(unit.health, unit.healthMax));
  // If the unit is actually taking damage (not taking 0 damage or being healed - (negative damage))
  if (alteredAmount > 0) {
    // Use all_red shader to flash the unit to show they are taking damage
    unit.shaderUniforms.all_red.alpha = 1;
    addLerpable(unit.shaderUniforms.all_red, "alpha", 0, 200);
  }

  // If taking damage (not healing) and health is 0 or less...
  if (amount > 0 && unit.health <= 0) {
    // if unit is alive, die
    if (unit.alive) {
      die(unit);
    } else {
      // if unit is already dead, fully destroy:
      cleanup(unit);
    }
  }

  if ((window.player && unit === window.player.unit) && elHealthBar && elHealthLabel) {
    syncPlayerHealthManaUI();
  }
}
export function syncPlayerHealthManaUI() {
  if (!window.player) {
    return
  }
  const unit = window.player.unit;
  elHealthBar.style["width"] = `${100 * unit.health / unit.healthMax}%`;
  elHealthLabel.innerHTML = `${unit.health}/${unit.healthMax}`;
  elManaBar.style["width"] = `${100 * unit.mana / unit.manaMax}%`;
  elManaBar2.style["width"] = `${100 * (Math.max(0, unit.mana - unit.manaMax)) / unit.manaMax}%`;
  elManaBar3.style["width"] = `${100 * (Math.max(0, unit.mana - unit.manaMax * 2)) / unit.manaMax}%`;

  elManaLabel.innerHTML = `${unit.mana}/${unit.manaMax}`;
}
export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    console.log("canMove: false - unit is not alive")
    return false;
  }
  // Do not move if already moved
  if (unit.thisTurnMoved) {
    console.log("canMove: false - unit has already moved this turn")
    return false;
  }
  return true;
}
export function livingUnitsInDifferentFaction(unit: IUnit) {
  return window.underworld.units.filter(
    (u) => u.faction !== unit.faction && u.alive,
  );
}
export function livingUnitsInSameFaction(unit: IUnit) {
  // u !== unit excludes self from returning as the closest unit
  return window.underworld.units.filter(
    (u) => u !== unit && u.faction == unit.faction && u.alive,
  );
}
function closestInListOfUnits(
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
): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInDifferentFaction(unit));
}
export function findClosestUnitInSameFaction(unit: IUnit): IUnit | undefined {
  return closestInListOfUnits(unit, livingUnitsInSameFaction(unit));
}
// moveTo moves a unit, considering all the in-game blockers and flags
// the units property thisTurnMoved
export function moveTowards(unit: IUnit, target: Vec2): Promise<void> {
  if (!canMove(unit)) {
    return Promise.resolve();
  }
  let coordinates = math.getCoordsAtDistanceTowardsTarget(
    unit,
    target,
    unit.moveDistance
  );
  // Compose onMoveEvents
  for (let eventName of unit.onMoveEvents) {
    const fn = Events.onMoveSource[eventName];
    if (fn) {
      coordinates = fn(unit, coordinates);
    }
  }
  unit.thisTurnMoved = true;
  // Set path which will be used in the game loop to actually move the unit
  unit.path = findPath(unit, Vec.clone(target), window.underworld.pathingPolygons);
  return new Promise((resolve) => {
    // Clear previous timeout
    if (unit.resolveDoneMovingTimeout !== undefined) {
      clearTimeout(unit.resolveDoneMovingTimeout);
    }
    unit.resolveDoneMoving = resolve;
    unit.resolveDoneMovingTimeout = setTimeout(resolve, config.RESOLVE_DONE_MOVING_TIMEOUT_MS);
  });
}

// setLocation, unlike moveTo, simply sets a unit to a coordinate without
// considering in-game blockers or changing any unit flags
// Note: NOT TO BE USED FOR in-game collision-based movement
export function setLocation(unit: IUnit, coordinates: Vec2): Promise<void> {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  unit.path = [];
  // Animate movement visually
  return Image.move(unit.image, unit.x, unit.y);
}
export function changeFaction(unit: IUnit, faction: Faction) {
  unit.faction = faction;
  if (unit.faction === Faction.PLAYER) {
    // headband signifies a player ally unit
    Image.addSubSprite(unit.image, 'headband');
  } else {
    Image.removeSubSprite(unit.image, 'headband');
  }
}

// syncImage updates a unit's Image to match it's game state
export function syncImage(unit: IUnit) {
  // TODO does scale syncing need to happen here?  I don't think so cause it's
  // just stored in the sprite so it wont get out of sync
  unit.lastX = unit.image.sprite.x;
  unit.lastY = unit.image.sprite.y;
  unit.image.sprite.x = unit.x;
  unit.image.sprite.y = unit.y;
}