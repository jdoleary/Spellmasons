import * as config from './config';
import type Game from './Game';
import type Player from './Player';

export default class Unit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  game?: Game;
  power: number = config.UNIT_BASE_POWER;
  health: number = config.UNIT_BASE_HEALTH;
  alive = true;
  frozen: boolean = false;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }
  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
  move() {
    // Do not move if frozen
    if (this.frozen) {
      return;
    }
    const next_x = this.x + this.vx;
    const next_y = this.y + this.vy;
    const bump_into_units = this.game
      ? this.game.getUnitsAt(next_x, next_y)
      : [];
    // Deal damage to what you run into
    for (let other_unit of bump_into_units) {
      other_unit.takeDamage(this.power);
      // Only take damage if the other unit is not frozen
      if (!other_unit.frozen) {
        this.takeDamage(other_unit.power);
      }
    }
    const alive_bump_into_units = bump_into_units.filter((u) => u.alive);
    // If nothing is obstructing
    if (alive_bump_into_units.length === 0) {
      // Check if at edge of board
      const player: Player | undefined = this.game
        ? this.game.getPlayerAt(next_x, next_y)
        : undefined;
      if (player) {
        // if player found, attack their heart
        player.heart_health -= this.power;
      } else {
        // Otherwise, physically move
        this.x = next_x;
        this.y = next_y;
      }
    }
  }
}
