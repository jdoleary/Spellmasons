import { PLAYER_HEART_HEALTH } from './config';
import * as UI from './ui/UserInterface';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  heart_x: number;
  heart_y: number;
}
export function create(clientId: string, heart_y: number): IPlayer {
  const heart_x = 3.5;
  const player = {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    heart_x,
    heart_y,
  };
  UI.setHealth(player);
  return player;
}
