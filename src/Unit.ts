import * as PIXI from 'pixi.js';
import * as config from './config';
import floatingText from './FloatingText';
import * as Image from './Image';
import * as math from './math';
import { distance } from './math';
import { addPixiSprite, containerUnits } from './PixiUtils';
import { Vec2, UnitSubType, UnitType, Faction } from './commonTypes';
import Events from './Events';
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
// in px
const UNIT_BASE_RADIUS = 32;
export interface IUnit {
  unitSourceId: string;
  x: number;
  y: number;
  moveTarget: Vec2;
  moveSpeed: number;
  radius: number;
  moveDistance: number;
  attackRange: number;
  name?: string;
  faction: number;
  // If the unit moved this turn
  thisTurnMoved: boolean;
  intendedNextMove?: Vec2;
  image: Image.IImage;
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
    radius: UNIT_BASE_RADIUS,
    moveTarget: { x, y },
    moveSpeed: 1,
    moveDistance: config.UNIT_BASE_MOVE_DISTANCE,
    attackRange: config.UNIT_BASE_ATTACK_RANGE,
    faction,
    thisTurnMoved: false,
    intendedNextMove: undefined,
    image: Image.create(x, y, imagePath, containerUnits),
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

  // Ensure all change factions logic applies when a unit is first created
  changeFaction(unit, faction);

  unit.image.scale = 0.8;
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
  if (alteredAmount > 0) {
    await Image.take_hit(unit.image);
  }
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
  // Cannot move into an obstructed cell
  // TODO re add obstructions (that were removed during the "free movement" gameplay refactor)
  // if (window.underworld.isCellObstructed(coordinates)) {
  //   return Promise.resolve();
  // }
  // Compose onMoveEvents
  for (let eventName of unit.onMoveEvents) {
    const fn = Events.onMoveSource[eventName];
    if (fn) {
      coordinates = fn(unit, coordinates);
    }
  }
  unit.thisTurnMoved = true;
  // LEFT OFF: integrate moveWithCollisions with the rest of the game
  return setLocation(unit, coordinates);
}

// setLocation, unlike moveTo, simply sets a unit to a coordinate without
// considering in-game blockers or changing any unit flags
export function setLocation(unit: IUnit, coordinates: Vec2): Promise<void> {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  // check for collisions with pickups in new location
  window.underworld.checkPickupCollisions(unit);
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
  unit.image.sprite.x = unit.x;
  unit.image.sprite.y = unit.y;
  unit.image.scale = unit.radius / UNIT_BASE_RADIUS;
}