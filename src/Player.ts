import { PLAYER_HEART_HEALTH } from './config';
import * as UI from './ui/UserInterface';
import * as Unit from './Unit';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  unit: Unit.IUnit;
  inPortal: boolean;
}
export function create(clientId: string): IPlayer {
  const player = {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    unit: Unit.create(0, 0, 'images/units/man-blue.png', 'PlayerControlled'),
    inPortal: false,
  };
  window.animationManager.startAnimate();
  UI.setHealth(player);
  return player;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  window.animationManager.startAnimate();
  window.game.checkForEndOfLevel();
}
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive;
}
