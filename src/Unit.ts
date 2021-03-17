import * as PIXI from 'pixi.js';
import * as config from './config';
import floatingText from './FloatingText';
import Image from './Image';
import { distance } from './math';
type UnitType = 'PlayerControlled' | 'AI';
export interface IUnit {
  x: number;
  y: number;
  name?: string;
  image: Image;
  power: number;
  health: number;
  healthMax: number;
  healthText: PIXI.Text;
  healthTextAnimationInterval: NodeJS.Timeout;
  alive: boolean;
  frozenForTurns: number;
  shield: number;
  unitType: UnitType;
}
export function create(
  x: number,
  y: number,
  imagePath: string,
  unitType: UnitType,
): IUnit {
  const unit: IUnit = {
    x,
    y,
    image: new Image(x, y, imagePath),
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
    healthTextAnimationInterval: null,
    alive: true,
    frozenForTurns: 0,
    shield: 0,
    unitType,
  };
  unit.healthText.anchor.x = 0.5;
  unit.healthText.anchor.y = -0.2;
  unit.image.sprite.addChild(unit.healthText);

  // Start images small so when they spawn in they will grow
  unit.image.transform.scale = 0.0;
  window.animationManager.setTransform(unit.image.sprite, unit.image.transform);
  unit.image.scale(1.0);
  window.game.addUnitToArray(unit);

  return unit;
}
export function showHealthText(unit: IUnit) {
  // Update to current health
  let healthString = '';
  for (let i = 0; i < unit.health; i++) {
    healthString += '❤️';
  }
  unit.healthText.text = healthString;
  // Even though an alpha of 1 is max
  // Set alpha to more than 1 so that it stays at full alpha for a while before disappearing
  unit.healthText.alpha = 2;
  // Make it disappear over time
  clearInterval(unit.healthTextAnimationInterval);
  unit.healthTextAnimationInterval = setInterval(() => {
    unit.healthText.alpha -= 0.1;
    if (unit.healthText.alpha <= 0) {
      clearInterval(unit.healthTextAnimationInterval);
    }
  }, 100);
}
// Reinitialize a unit from another unit object, this is used in loading game state after reconnect
export function load(unit: IUnit) {
  const self = {
    ...unit,
    image: new Image(unit.x, unit.y, unit.image.imageName),
  };
  window.game.addUnitToArray(self);
  return self;
}
export function die(u: IUnit) {
  u.image.scale(0);
  u.alive = false;
}
export function cellDistanceFromUnit(
  unit: IUnit,
  cellX: number,
  cellY: number,
) {
  return Math.max(Math.abs(unit.x - cellX), Math.abs(unit.y - cellY));
}
export function takeDamage(unit: IUnit, amount: number, cause?: string) {
  // Shield prevents damage
  if (unit.shield > 0) {
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
  showHealthText(unit);
  unit.image.take_hit();
  // Prevent health from going over maximum
  unit.health = Math.min(unit.health, unit.healthMax);
  if (unit.health <= 0) {
    die(unit);
  }
}
function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    return;
  }
  // Do not move if frozen
  if (unit.frozenForTurns > 0) {
    return;
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
  let currentClosestDistance = config.AI_AGRO_DISTANCE;
  for (let p of window.game.players) {
    // Only consider units that are not in the portal and are alive
    if (!p.inPortal && p.unit.alive) {
      const dist = distance(p.unit, unit);
      if (dist < currentClosestDistance) {
        currentClosest = p.unit;
        currentClosestDistance = dist;
      }
    }
  }
  return currentClosest;
}
export function moveAI(unit: IUnit) {
  if (!canMove(unit)) {
    return;
  }
  const closestPlayerUnit = findClosestPlayerTo(unit);
  if (!closestPlayerUnit) {
    // Do not move if they don't have a target
    return;
  }
  const targetCell = findCellOneStepCloserTo(
    unit,
    closestPlayerUnit.x,
    closestPlayerUnit.y,
  );
  const next_x = targetCell.x;
  const next_y = targetCell.y;
  const bump_into_units = window.game
    ? window.game.getUnitsAt(next_x, next_y)
    : [];
  // Deal damage to what you run into
  for (let other_unit of bump_into_units) {
    // Do not attack self
    if (other_unit === unit) {
      continue;
    }
    unit.image.attack(unit.x, unit.y, next_x, next_y);
    takeDamage(other_unit, unit.power, 'unit');
  }
  const alive_bump_into_units = bump_into_units.filter((u) => u.alive);
  // If nothing is obstructing
  if (alive_bump_into_units.length === 0) {
    // physically move
    moveTo(unit, next_x, next_y);
  }
}
export function moveTo(unit: IUnit, cellX: number, cellY: number) {
  if (!canMove(unit)) {
    console.log('unit cannot move');
    return;
  }
  unit.x = cellX;
  unit.y = cellY;
  unit.image.move(unit.x, unit.y);
  // check for collisions with pickups in new location
  window.game.checkPickupCollisions(unit);
}
