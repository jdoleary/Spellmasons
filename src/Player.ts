import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';

export interface IPlayer {
  // wsPie id
  clientId: string;
  unit: Unit.IUnit;
  inPortal: boolean;
}
export function create(clientId: string): IPlayer {
  const player = {
    clientId,
    unit: Unit.create(0, 0, 'images/units/man-blue.png', 'PlayerControlled'),
    inPortal: false,
  };
  player.unit.health = PLAYER_BASE_HEALTH;
  window.animationManager.startAnimate();
  return player;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.moveTo(player.unit, 0, -1);
  window.animationManager.startAnimate();
  window.game.checkForEndOfLevel();
}
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive;
}
