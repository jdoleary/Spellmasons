import * as PIXI from 'pixi.js';
import * as config from './config';
import * as AI from './AI';
import floatingText from './FloatingText';
import Image from './Image';
import { cellDistance } from './math';
import { containerUnits } from './PixiUtils';
import { ableToTakeTurn } from './Player';
import type { Coords } from './commonTypes';
export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  AI_melee,
  AI_bishop,
  AI_rook,
  AI_reach,
}
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
  // modifiers such as "frozen" or "poisoned"
  modifiers: { [key: string]: number };
  shield: number;
  unitType: UnitType;
  unitSubType?: UnitSubType;
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
    modifiers: {},
    shield: 0,
    unitType,
    unitSubType,
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
    image: new Image(unit.x, unit.y, unit.image.imageName, containerUnits),
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
export function resurrect(u: IUnit) {
  u.image.scale(1);
  // Return dead units back to full health
  u.health = u.healthMax;
  u.alive = true;
}
export function die(u: IUnit) {
  u.image.scale(0);
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
export function takeDamage(unit: IUnit, amount: number, cause?: string) {
  // Shield prevents damage
  if (unit.shield > 0 && amount > 0) {
    unit.shield--;
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: 'Shielded from damage!',
      style: {
        fill: 'blue',
      },
    });
    if (unit.shield <= 1) {
      unit.image.removeSubSprite('shield');
    }
    return;
  }
  unit.health -= amount;
  // If the unit is "selected" this will update it's overlay to reflect the damage
  updateSelectedOverlay(unit);
  if (amount > 0) {
    // Show hearts floating away due to damage taken
    let healthChangedString = '';
    for (let i = 0; i < Math.abs(amount); i++) {
      healthChangedString += '❤️';
    }
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: healthChangedString,
    });
  }
  unit.image.take_hit();
  // Prevent health from going over maximum
  unit.health = Math.min(unit.health, unit.healthMax);
  if (unit.health <= 0) {
    die(unit);
  }
}
export function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    return false;
  }
  // Do not move if frozen
  if (unit.modifiers.frozen > 0) {
    // Now that they have attempted to move, decrement frozen (which prevents movement the same
    // number of turns as the value of frozen)
    decrementModifier(unit, 'frozen');
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
  }
}
export function decrementModifier(unit: IUnit, modifier: string) {
  if (unit.modifiers[modifier]) {
    unit.modifiers[modifier]--;
    if (unit.modifiers[modifier] <= 0) {
      unit.image.removeSubSprite(modifier);
    }
  }
}
export function moveTo(unit: IUnit, coordinates: Coords): Promise<void> {
  if (!canMove(unit)) {
    return Promise.resolve();
  }
  // Cannot move into an obstructed cell
  if (window.game.isCellObstructed(coordinates)) {
    return Promise.resolve();
  }
  unit.thisTurnMoved = true;
  return setLocation(unit, coordinates);
}

export function setLocation(unit: IUnit, coordinates: Coords): Promise<void> {
  // Set state instantly to new position
  unit.x = coordinates.x;
  unit.y = coordinates.y;
  // check for collisions with pickups in new location
  window.game.checkPickupCollisions(unit);
  // Animate movement visually
  return unit.image.move(unit.x, unit.y);
}
