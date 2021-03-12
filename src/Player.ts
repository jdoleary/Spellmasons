import { PLAYER_HEART_HEALTH } from './config';
import { addPixiSprite } from './PixiUtils';
import * as UI from './ui/UserInterface';
import * as Unit from './Unit';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  heart_x: number;
  heart_y: number;
  unit: Unit.IUnit;
}
export function create(clientId: string, heart_y: number): IPlayer {
  const heart_x = 3.5;
  const player = {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    heart_x,
    heart_y,
    unit: Unit.create(0, 0, 'images/units/man-blue.png'),
  };
  player.unit.justSpawned = false;
  window.animationManager.startAnimate();
  UI.setHealth(player);
  return player;
}
