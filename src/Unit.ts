import { UNIT_BASE_HEALTH } from './config';
import type Game from './Game';

export default class Unit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number = UNIT_BASE_HEALTH;
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
  move(dx: number, dy: number) {}
}
