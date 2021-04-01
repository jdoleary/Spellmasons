import * as PIXI from 'pixi.js';
import * as config from './config';
import * as AI from './AI';
import floatingText from './FloatingText';
import Image from './Image';
import { cellDistance } from './math';
import { changeSpriteTexture, containerUnits } from './PixiUtils';
import { ableToTakeTurn } from './Player';
import { Coords, UnitSubType, UnitType } from './commonTypes';
import { onDamageSource, onMoveSource } from './Events';
export function getDangerZoneColor(unit: IUnit) {
  switch (unit.unitSubType) {
    case UnitSubType.AI_bishop:
      return 0x0000ff;
    default:
      return 0xff0000;
  }
}
export interface IUnit {
  x: number;
  y: number;
  name?: string;
  // If the unit moved this turn
  thisTurnMoved: boolean;
  intendedNextMove?: Coords;
  image: Image;
  power: number;
  health: number;
  healthMax: number;
  healthText: PIXI.Text;
  alive: boolean;
  unitType: UnitType;
  unitSubType?: UnitSubType;
  // A list of names that correspond to Events.ts functions
  onDamageEvents: string[];
  onDeathEvents: string[];
  onMoveEvents: string[];
  onAgroEvents: string[];
  onTurnStartEvents: string[];
  modifiers: {
    [name: string]: any;
  };
}
export function create(
  x: number,
  y: number,
  imagePath: string,
  unitType: UnitType,
  unitSubType?: UnitSubType,
): IUnit {
  const unit: IUnit = {
    x,
    y,
    thisTurnMoved: false,
    intendedNextMove: undefined,
    image: new Image(x, y, imagePath, containerUnits),
    power: config.UNIT_BASE_POWER,
    health: config.UNIT_BASE_HEALTH,
    healthMax: config.UNIT_BASE_HEALTH,
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
  };

  // Start images small and make them grow when they spawn in
  unit.image.sprite.scale.set(0);
  unit.image.scale(0.8);
  window.game.addUnitToArray(unit);

  return unit;
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
  unit.image.cleanup();
  deselect(unit);
}
// Reinitialize a unit from another unit object, this is used in loading game state after reconnect
export function load(unit: IUnit) {
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
  window.game.addUnitToArray(loadedunit);
  if (!loadedunit.alive) {
    die(loadedunit);
  }
  return loadedunit;
}

export function serializeUnit(unit: IUnit) {
  return {
    ...unit,
    image: unit.image.serialize(),
    healthText: null,
    agroOverlay: null,
  };
}
export function resurrect(u: IUnit) {
  changeSpriteTexture(u.image.imageName, u.image.sprite);
  // Return dead units back to full health
  u.health = u.healthMax;
  u.alive = true;
}
export function die(u: IUnit) {
  changeSpriteTexture('images/units/corpse.png', u.image.sprite);
  u.alive = false;
  // When a unit dies, deselect it
  deselect(u);
  // If the unit is a player
  if (u.unitType === UnitType.PLAYER_CONTROLLED) {
    const unitPlayer = window.game.players[window.game.playerTurnIndex];
    if (unitPlayer) {
      window.game.endPlayerTurn(unitPlayer.clientId);
    }
  }
}
export function takeDamage(unit: IUnit, amount: number) {
  let alteredAmount = amount;
  // Compose onDamageEvents
  for (let eventName of unit.onDamageEvents) {
    const fn = onDamageSource[eventName];
    if (fn) {
      alteredAmount = fn(unit, alteredAmount);
    }
  }
  unit.health -= alteredAmount;
  // Prevent health from going over maximum
  unit.health = Math.min(unit.health, unit.healthMax);
  // If the unit is "selected" this will update it's overlay to reflect the damage
  updateSelectedOverlay(unit);

  if (alteredAmount > 0) {
    // Show hearts floating away due to damage taken
    let healthChangedString = '';
    for (let i = 0; i < Math.abs(alteredAmount); i++) {
      healthChangedString += '❤️';
    }
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: healthChangedString,
    });
    unit.image.take_hit();
  }
  if (unit.health <= 0) {
    die(unit);
  }
}
export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    return false;
  }
  // Do not move if already moved
  if (unit.thisTurnMoved) {
    return false;
  }
  return true;
}
export function findCellOneStepCloserTo(
  unit: IUnit,
  desiredCellX: number,
  desiredCellY: number,
) {
  // Find the difference between current position and desired position
  const diffX = desiredCellX - unit.x;
  const diffY = desiredCellY - unit.y;
  const moveX = unit.x + (diffX === 0 ? 0 : diffX / Math.abs(diffX));
  const moveY = unit.y + (diffY === 0 ? 0 : diffY / Math.abs(diffY));
  return { x: moveX, y: moveY };
}
export function findClosestPlayerTo(unit: IUnit): IUnit | undefined {
  let currentClosest;
  let currentClosestDistance = Number.MAX_SAFE_INTEGER;
  // Filter on players able to take their turn to ensure, for example, that dead players don't get targeted
  for (let p of window.game.players.filter(ableToTakeTurn)) {
    const dist = cellDistance(p.unit, unit);
    if (dist <= currentClosestDistance) {
      currentClosest = p.unit;
      currentClosestDistance = dist;
    }
  }
  return currentClosest;
}
export function moveAI(unit: IUnit) {
  switch (unit.unitSubType) {
    case UnitSubType.AI_melee:
      AI.meleeAction(unit);
      break;
    case UnitSubType.AI_bishop:
      AI.rangedAction(unit);
      break;
    case UnitSubType.AI_rook:
      AI.rangedAction(unit);
      break;
    case UnitSubType.AI_reach:
      AI.reachAction(unit);
      break;
    case UnitSubType.AI_summoner:
      AI.summonerAction(unit);
      break;
  }
}
// moveTo moves a unit, considering all the in-game blockers and flags
// the units property thisTurnMoved
export function moveTo(unit: IUnit, coordinates: Coords): Promise<void> {
  if (!canMove(unit)) {
    return Promise.resolve();
  }
  // Cannot move into an obstructed cell
  if (window.game.isCellObstructed(coordinates)) {
    return Promise.resolve();
  }
  // Compose onMoveEvents
  for (let eventName of unit.onMoveEvents) {
    const fn = onMoveSource[eventName];
    if (fn) {
      coordinates = fn(unit, coordinates);
    }
  }
  unit.thisTurnMoved = true;
  return setLocation(unit, coordinates);
}

// setLocation, unlike moveTo, simply sets a unit to a cell coordinate without
// considering in-game blockers or changing any unit flags
export function setLocation(unit: IUnit, coordinates: Coords): Promise<void> {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  // check for collisions with pickups in new location
  window.game.checkPickupCollisions(unit);
  // Animate movement visually
  return unit.image.move(unit.x, unit.y);
}
