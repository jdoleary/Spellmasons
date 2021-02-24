import { PLAYER_HEART_HEALTH, PLAYER_MANA } from './config';
import Image from './Image';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  mana: number;
  mana_max: number;
  heart_x: number;
  heart_y: number;
  heart: Image;
}
export function create(clientId: string, heart_y: number): IPlayer {
  const heart_x = 3.5;
  return {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    mana: PLAYER_MANA,
    mana_max: PLAYER_MANA,
    heart_x,
    heart_y,
    heart: new Image(heart_x, heart_y, 0, 0, 'heart.png'),
  };
}
