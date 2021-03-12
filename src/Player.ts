import { PLAYER_HEART_HEALTH } from './config';
import * as UI from './ui/UserInterface';
import * as Unit from './Unit';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  unit?: Unit.IUnit;
  inPortal: boolean;
}
export function create(clientId: string): IPlayer {
  const player = {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    inPortal: false,
  };
  window.animationManager.startAnimate();
  UI.setHealth(player);
  return player;
}
export function respawnUnit(player: IPlayer) {
  player.unit = Unit.create(0, 0, 'images/units/man-blue.png');
  player.unit.justSpawned = false;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  window.animationManager.startAnimate();
  window.game.checkForEndOfLevel();
}
