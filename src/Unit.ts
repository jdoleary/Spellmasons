import * as PIXI from 'pixi.js';
import * as config from './config';
import * as AI from './AI';
import * as math from './math';
import floatingText from './FloatingText';
import Image from './Image';
import { cellDistance } from './math';
import { containerDangerOverlay, containerUnits } from './PixiUtils';
export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  AI_melee,
  AI_ranged,
}
export interface IUnit {
  x: number;
  y: number;
  name?: string;
  image: Image;
  power: number;
  health: number;
  healthMax: number;
  healthText: PIXI.Text;
  alive: boolean;
  frozenForTurns: number;
  shield: number;
  unitType: UnitType;
  unitSubType?: UnitSubType;
  agroOverlay?: PIXI.Graphics;
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
    frozenForTurns: 0,
    shield: 0,
    unitType,
    unitSubType,
  };

  // Start images small and make them grow when they spawn in
  unit.image.sprite.scale.set(0);
  unit.image.scale(1.0);
  window.game.addUnitToArray(unit);

  return unit;
}

export function deselect(unit: IUnit) {
  // Hide health text
  if (unit.healthText.parent) {
    unit.healthText.parent.removeChild(unit.healthText);
  }
  if (unit.agroOverlay && unit.agroOverlay.parent) {
    unit.agroOverlay.parent.removeChild(unit.agroOverlay);
  }
}
export function select(unit: IUnit) {
  // Show health text
  unit.image.sprite.addChild(unit.healthText);
  // Make AGRO UI rectangle
  if (!unit.agroOverlay) {
    unit.agroOverlay = new PIXI.Graphics();
  }
  if (!unit.agroOverlay.parent) {
    containerDangerOverlay.addChild(unit.agroOverlay);
  }
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
  if (unit.unitType === UnitType.AI && unit.agroOverlay) {
    unit.agroOverlay.clear();
    unit.agroOverlay.beginFill(0xff0000);
    if (unit.unitSubType === UnitSubType.AI_melee) {
      drawRectFromPoints(
        unit.agroOverlay,
        unit.x - 1.5,
        unit.y - 1.5,
        unit.x + 1.5,
        unit.y + 1.5,
      );
    } else if (unit.unitSubType === UnitSubType.AI_ranged) {
      // Horizontal
      drawRectFromPoints(
        unit.agroOverlay,
        unit.x - 0.5,
        0 - 0.5,
        unit.x + 0.5,
        config.BOARD_HEIGHT - 1 + 0.5,
      );
      // Vertical
      drawRectFromPoints(
        unit.agroOverlay,
        0 - 0.5,
        unit.y - 0.5,
        config.BOARD_WIDTH - 1 + 0.5,
        unit.y + 0.5,
      );
      // Diagonal
      // TODO: This is non optimized and may be heavy
      for (let x = 0; x < config.BOARD_WIDTH; x++) {
        for (let y = 0; y < config.BOARD_WIDTH; y++) {
          const isDiagonal = Math.abs(x - unit.x) === Math.abs(y - unit.y);
          if (isDiagonal) {
            drawRectFromPoints(
              unit.agroOverlay,
              x - 0.5,
              y - 0.5,
              x + 0.5,
              y + 0.5,
            );
          }
        }
      }
    }
    unit.agroOverlay.endFill();
  }
}
function drawRectFromPoints(
  g: PIXI.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  // Upper-left corner
  const startCell = math.cellToBoardCoords(x1, y1);
  // Lower-right corner
  const endCell = math.cellToBoardCoords(x2, y2);
  g.drawRect(
    startCell.x,
    startCell.y,
    endCell.x - startCell.x,
    endCell.y - startCell.y,
  );
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
  return loadedunit;
}
export function resurrect(u: IUnit) {
  u.image.scale(1);
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
    // If player whose current turn it is just died...
    if (unitPlayer.clientId === window.clientId && unitPlayer.unit === u) {
      window.game.endMyTurn();
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
  let currentClosestDistance = Number.MAX_SAFE_INTEGER;
  for (let p of window.game.players) {
    // Only consider units that are not in the portal and are alive
    if (!p.inPortal && p.unit.alive) {
      const dist = cellDistance(p.unit, unit);
      if (dist <= currentClosestDistance) {
        currentClosest = p.unit;
        currentClosestDistance = dist;
      }
    }
  }
  return currentClosest;
}
export function moveAI(unit: IUnit) {
  switch (unit.unitSubType) {
    case UnitSubType.AI_melee:
      AI.meleeAction(unit);
      break;
    case UnitSubType.AI_ranged:
      AI.rangedAction(unit);
      break;
  }
}
export function moveTo(
  unit: IUnit,
  cellX: number,
  cellY: number,
): Promise<void> {
  if (!canMove(unit)) {
    return Promise.resolve();
  }
  // Cannot move into an obstructed cell
  if (window.game.isCellObstructed(cellX, cellY)) {
    return Promise.resolve();
  }
  // Set state instantly to new position
  unit.x = cellX;
  unit.y = cellY;
  // check for collisions with pickups in new location
  window.game.checkPickupCollisions(unit);
  // Animate movement visually
  return unit.image.move(unit.x, unit.y);
}
