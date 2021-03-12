import * as config from './config';
import Image from './Image';
import type { IPlayer } from './Player';
import * as UI from './ui/UserInterface';
import { distance } from './math';
export interface IUnit {
  x: number;
  y: number;
  name?: string;
  image: Image;
  power: number;
  health: number;
  alive: boolean;
  frozen: boolean;
  justSpawned: boolean;
}

export function create(x: number, y: number, imagePath?: string): IUnit {
  const unit: IUnit = {
    x,
    y,
    image: new Image(x, y, imagePath),
    power: config.UNIT_BASE_POWER,
    health: config.UNIT_BASE_HEALTH,
    alive: true,
    frozen: false,
    justSpawned: true,
  };

  // Start images small so when they spawn in they will grow
  unit.image.transform.scale = 0.0;
  window.animationManager.setTransform(unit.image.sprite, unit.image.transform);
  unit.image.scale(1.0);
  window.game.addUnitToArray(unit);

  return unit;
}
export function die(u: IUnit) {
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
  unit.health -= amount;
  // Prevent health from going over maximum
  unit.health = Math.min(unit.health, config.UNIT_BASE_HEALTH);
  // Make the unit spin if it takes damage
  if (amount > 0) {
    unit.image.anim_spin();
  }
  if (unit.health <= 0) {
    die(unit);
  }
  // Change the size to represent health
  unit.image.scale(unit.health / config.UNIT_BASE_HEALTH);
}
function canMove(unit: IUnit): boolean {
  // Do not move if dead
  if (!unit.alive) {
    return;
  }
  // Do not move if just spawned
  if (unit.justSpawned) {
    return;
  }
  // Do not move if frozen
  if (unit.frozen) {
    return;
  }
  return true;
}
export function moveTo(unit: IUnit, cellX: number, cellY: number) {
  if (!canMove(unit)) {
    console.log('unit cannot move');
    return;
  }
  // Otherwise, physically move
  unit.x = cellX;
  unit.y = cellY;
  unit.image.move(unit.x, unit.y);
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
export function findClosestPlayerTo(unit: IUnit) {
  let currentClosest = window.game.players[0].unit;
  let currentClosestDistance = Number.MAX_SAFE_INTEGER;
  for (let p of window.game.players) {
    const dist = distance(p.unit, unit);
    if (dist < currentClosestDistance) {
      currentClosest = p.unit;
      currentClosestDistance = dist;
    }
  }
  return currentClosest;
}
export function moveAI(unit: IUnit) {
  if (!canMove(unit)) {
    return;
  }
  const closestPlayerUnit = findClosestPlayerTo(unit);
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
    // Check if at edge of board
    const player: IPlayer | undefined = window.game
      ? window.game.getPlayerAt(next_x, next_y)
      : undefined;
    if (player) {
      // if player found, attack their heart
      player.heart_health -= unit.power;
      UI.setHealth(player);
      // Attack player animation
      unit.image.attack(unit.x, unit.y, next_x, next_y);
    } else {
      // Otherwise, physically move
      unit.x = next_x;
      unit.y = next_y;
      unit.image.move(unit.x, unit.y);
    }
  }
}
