import * as PIXI from 'pixi.js';
import * as config from './config';
import floatingText from './FloatingText';
import * as Image from './Image';
import * as math from './math';
import { distance } from './math';
import { addPixiSprite, containerUnits } from './PixiUtils';
import { Vec2, UnitSubType, UnitType, Faction } from './commonTypes';
import Events from './Events';
import makeAllRedShader from './shaders/selected';
import { addLerpable } from './lerpList';
const elHealthBar: HTMLElement = document.querySelector('#health .fill') as HTMLElement;
const elHealthLabel: HTMLElement = document.querySelector('#health .label') as HTMLElement;
const elManaBar: HTMLElement = document.querySelector('#mana .fill') as HTMLElement;
const elManaLabel: HTMLElement = document.querySelector('#mana .label') as HTMLElement;

export function getPlanningViewColor(unit: IUnit) {
  if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
    return 0x00ff00;
  }
  switch (unit.unitSubType) {
    case UnitSubType.AI_bishop:
      return 0x0000ff;
    default:
      return 0xff0000;
  }
}
const UNIT_BASE_RADIUS = config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE;
export interface IUnit {
  unitSourceId: string;
  x: number;
  y: number;
  // lastX and lastY are used to determine when a unit has finished
  // moving (because then their current x,y and lastX,lastY will be 
  // identical)
  lastX: number;
  lastY: number;
  moveTarget?: Vec2;
  moveSpeed: number;
  // A resolve callback for when a unit is done moving
  resolveDoneMoving: () => void;
  radius: number;
  moveDistance: number;
  attackRange: number;
  name?: string;
  faction: number;
  // If the unit moved this turn
  thisTurnMoved: boolean;
  intendedNextMove?: Vec2;
  image: Image.IImage;
  shaderUniforms: { [key: string]: any };
  damage: number;
  health: number;
  healthMax: number;
  mana: number;
  manaMax: number;
  manaPerTurn: number;
  healthText: PIXI.Text;
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
export function create(
  unitSourceId: string,
  x: number,
  y: number,
  faction: Faction,
  imagePath: string,
  unitType: UnitType,
  unitSubType: UnitSubType,
  sourceUnitProps: Partial<IUnit> = {}
): IUnit {
  const unit: IUnit = Object.assign({
    unitSourceId,
    x,
    y,
    lastX: x,
    lastY: y,
    radius: UNIT_BASE_RADIUS,
    moveTarget: undefined,
    moveSpeed: config.UNIT_MOVE_SPEED,
    resolveDoneMoving: () => { },
    moveDistance: config.UNIT_BASE_MOVE_DISTANCE,
    attackRange: config.UNIT_BASE_ATTACK_RANGE,
    faction,
    thisTurnMoved: false,
    intendedNextMove: undefined,
    image: Image.create(x, y, imagePath, containerUnits),
    // TODO restore shaderUniforms on load
    shaderUniforms: {},
    damage: config.UNIT_BASE_DAMAGE,
    health: config.UNIT_BASE_HEALTH,
    healthMax: config.UNIT_BASE_HEALTH,
    mana: config.UNIT_BASE_MANA,
    manaMax: config.UNIT_BASE_MANA,
    manaPerTurn: config.MANA_GET_PER_TURN,
    healthText: new PIXI.Text('', {
      fill: 'red',
      // Allow health hearts to wrap
      wordWrap: true,
      wordWrapWidth: 120,
      breakWords: true,
    }),
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

  const all_red = makeAllRedShader()
  unit.shaderUniforms.all_red = all_red.uniforms;
  unit.image.sprite.filters = [all_red.filter];

  // Ensure all change factions logic applies when a unit is first created
  changeFaction(unit, faction);

  unit.image.scale = config.NON_HEAVY_UNIT_SCALE;
  unit.image.sprite.scale.set(unit.image.scale);

  window.underworld.addUnitToArray(unit);

  return unit;
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

export function deselect(unit: IUnit) {
  // Hide health text
  if (unit.healthText.parent) {
    unit.healthText.parent.removeChild(unit.healthText);
  }
}
export function select(unit: IUnit) {
  // Show health text
  unit.image.sprite.addChild(unit.healthText);
  updateSelectedOverlay(unit);
}
export function updateSelectedOverlay(unit: IUnit) {
  // Update to current health
  let healthString = '';
  for (let i = 0; i < unit.health; i++) {
    healthString += '❤️';
  }
  unit.healthText.text = healthString;
  unit.healthText.anchor.x = 0.5;
  unit.healthText.anchor.y = -0.2;
}
export function cleanup(unit: IUnit) {
  unit.x = NaN;
  unit.y = NaN;
  unit.flaggedForRemoval = true;
  Image.cleanup(unit.image);
  deselect(unit);
}
// Reinitialize a unit from another unit object, this is used in loading game state after reconnect
export function load(unit: IUnit): IUnit {
  const loadedunit = {
    ...unit,
    image: Image.load(unit.image, containerUnits),
    healthText: new PIXI.Text('', {
      fill: 'red',
      // Allow health hearts to wrap
      wordWrap: true,
      wordWrapWidth: 120,
      breakWords: true,
    }),
  };
  window.underworld.addUnitToArray(loadedunit);
  if (!loadedunit.alive) {
    die(loadedunit);
  }
  return loadedunit;
}

export function serializeUnit(unit: IUnit) {
  return {
    ...unit,
    image: Image.serialize(unit.image),
    healthText: null,
    agroOverlay: null,
  };
}
export function resurrect(unit: IUnit) {
  Image.changeSprite(
    unit.image,
    addPixiSprite(unit.image.imageName, containerUnits),
  );
  // Return dead units back to full health
  unit.health = unit.healthMax;
  unit.alive = true;
}
export function die(unit: IUnit) {
  Image.changeSprite(
    unit.image,
    addPixiSprite('units/corpse.png', unit.image.sprite.parent),
  );
  unit.alive = false;
  // Remove all modifiers:
  for (let [modifier, _modifierProperties] of Object.entries(unit.modifiers)) {
    removeModifier(unit, modifier);
  }
  // When a unit dies, deselect it
  deselect(unit);
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
  // Update the shader to reflect health level
  unit.shaderUniforms.all_red.alpha = 1;
  addLerpable(unit.shaderUniforms.all_red, "alpha", 0, 200);
  // If the unit is "selected" this will update it's overlay to reflect the damage
  updateSelectedOverlay(unit);

  // Show hearts floating away due to damage taken
  let healthChangedString = '';
  for (let i = 0; i < Math.abs(alteredAmount); i++) {
    healthChangedString += alteredAmount > 0 ? '🔥' : '❤️';
  }
  floatingText({
    coords: unit,
    text: healthChangedString,
  });
  // If taking damage (not healing) and health is 0 or less...
  if (amount > 0 && unit.health <= 0) {
    // if unit is alive, die
    if (unit.alive) {
      die(unit);
    }
  }

  if (unit === window.player.unit && elHealthBar && elHealthLabel) {
    syncPlayerHealthManaUI();
  }
}
export function syncPlayerHealthManaUI() {
  const unit = window.player.unit;
  elHealthBar.style["width"] = `${100 * unit.health / unit.healthMax}%`;
  elHealthLabel.innerHTML = `${unit.health}/${unit.healthMax}`;
  elManaBar.style["width"] = `${100 * unit.mana / unit.manaMax}%`;
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
  unit.moveTarget = coordinates
  return new Promise((resolve) => {
    unit.resolveDoneMoving = resolve;
  });
}

// setLocation, unlike moveTo, simply sets a unit to a coordinate without
// considering in-game blockers or changing any unit flags
// Note: NOT TO BE USED FOR in-game collision-based movement
export function setLocation(unit: IUnit, coordinates: Vec2): Promise<void> {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  unit.moveTarget = undefined;
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
  unit.lastX = unit.image.sprite.x;
  unit.lastY = unit.image.sprite.y;
  unit.image.sprite.x = unit.x;
  unit.image.sprite.y = unit.y;
  unit.image.scale = unit.radius / UNIT_BASE_RADIUS;
}