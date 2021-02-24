import * as config from './config';
import Image from './Image';
import type { IPlayer } from './Player';
import * as UI from './ui/UserInterface';
export interface IUnit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  name?: string;
  image: Image;
  power: number;
  health: number;
  alive: boolean;
  frozen: boolean;
  justSpawned: boolean;
}

export function create(
  x: number,
  y: number,
  vx: number,
  vy: number,
  imagePath?: string,
): IUnit {
  const unit: IUnit = {
    x,
    y,
    vx,
    vy,
    image: new Image(x, y, vx, vy, imagePath),
    power: config.UNIT_BASE_POWER,
    health: config.UNIT_BASE_HEALTH,
    alive: true,
    frozen: false,
    justSpawned: true,
  };

  // Start images small so when they spawn in they will grow
  unit.image.transform.scale = 0.0;
  window.animationManager.setTransform(
    unit.image.element,
    unit.image.transform,
  );
  unit.image.scale(1.0);
  return unit;
}
export function die(u: IUnit) {
  u.alive = false;
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
export function move(unit: IUnit) {
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
  const next_x = unit.x + unit.vx;
  const next_y = unit.y + unit.vy;
  const bump_into_units = window.game
    ? window.game.getUnitsAt(next_x, next_y)
    : [];
  // Deal damage to what you run into
  for (let other_unit of bump_into_units) {
    // Do not attack self
    if (other_unit === this) {
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
      if (player.clientId === window.clientId) {
        UI.setHealth(player.heart_health);
      }
      // Attack player animation
      unit.image.attack(unit.x, unit.y, next_x, next_y);
      // Animate player taking damage
      player.heart?.anim_spin();
      player.heart?.scale(player.heart_health / config.PLAYER_HEART_HEALTH);
    } else {
      // Otherwise, physically move
      unit.x = next_x;
      unit.y = next_y;
      unit.image.move(unit.x, unit.y);
    }
  }
}
