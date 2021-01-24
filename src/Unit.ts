import * as config from './config';
import type Game from './Game';

export default class Unit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number = config.UNIT_BASE_POWER;
  health: number = config.UNIT_BASE_HEALTH;
  alive = true;
  game: Game;

  constructor(x: number, y: number, vx: number, vy: number, game: Game) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    // Two-way reference to the Game
    this.game = game;
    this.game.units.push(this);
  }
  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
  move() {
    const next_x = this.vx;
    const next_y = this.vy;
    const bump_into_units = this.game.units.filter(u => u.x === next_x && u.y === next_y)
    // Deal damage to what you run into
    for(let other_unit of bump_into_units){
        other_unit.takeDamage(this.power);
        this.takeDamage(other_unit.power)
    }
    const alive_bump_into_units = bump_into_units.filter(u => u.alive)
    // Move, if nothing is obstructing
    if(alive_bump_into_units.length === 0){
        this.x = next_x;
        this.y = next_y;
    }
  }
}
