import * as config from './config';
import Image from './Image';
import type Player from './Player';

export default class Unit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  name?: string;
  power: number = config.UNIT_BASE_POWER;
  health: number = config.UNIT_BASE_HEALTH;
  alive = true;
  frozen: boolean = false;
  image: Image;
  justSpawned: boolean = true;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    imagePath?: string,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.image = new Image(this.x, this.y, this.vx, this.vy, imagePath);

    // Start images small so when they spawn in they will grow
    this.image.transform.scale = 0.0;
    window.animationManager.setTransform(
      this.image.element,
      this.image.transform,
    );
    this.image.scale(1.0);
  }
  die() {
    this.alive = false;
  }
  takeDamage(amount: number, cause?: string) {
    this.health -= amount;
    window.addToLog(
      `Unit at (${this.x}, ${this.y}) takes ${amount} damage from ${cause}`,
    );
    this.image.anim_spin();
    if (this.health <= 0) {
      window.addToLog(`Unit at (${this.x}, ${this.y}) dies.`);
      this.die();
    }
    // Change the size to represent health
    this.image.scale(this.health / config.UNIT_BASE_HEALTH);
  }
  move() {
    // Do not move if dead
    if (!this.alive) {
      return;
    }
    // Do not move if just spawned
    if (this.justSpawned) {
      return;
    }
    // Do not move if frozen
    if (this.frozen) {
      window.addToLog(
        `Unit at (${this.x}, ${this.y}) is frozen and cannot move`,
      );
      return;
    }
    const next_x = this.x + this.vx;
    const next_y = this.y + this.vy;
    const bump_into_units = window.game
      ? window.game.getUnitsAt(next_x, next_y)
      : [];
    // Deal damage to what you run into
    for (let other_unit of bump_into_units) {
      // Do not attack self
      if (other_unit === this) {
        continue;
      }
      other_unit.takeDamage(this.power, 'unit');
    }
    const alive_bump_into_units = bump_into_units.filter((u) => u.alive);
    // If nothing is obstructing
    if (alive_bump_into_units.length === 0) {
      // Check if at edge of board
      const player: Player | undefined = window.game
        ? window.game.getPlayerAt(next_x, next_y)
        : undefined;
      if (player) {
        // if player found, attack their heart
        player.heart_health -= this.power;
        window.setDebug({
          [`${
            player.client_id && player.client_id.slice(0, 6)
          } health`]: player.heart_health,
        });
      } else {
        // Otherwise, physically move
        this.x = next_x;
        this.y = next_y;
        this.image.move(this.x, this.y);
      }
    }
  }
}
