import { PLAYER_HEART_HEALTH, PLAYER_MANA } from './config';
import type Image from './Image';

export default class Player {
  // wsPie id
  clientId?: string;
  heart_health: number = PLAYER_HEART_HEALTH;
  mana: number = PLAYER_MANA;
  mana_max: number = PLAYER_MANA;
  heart_x?: number;
  heart_y?: number;
  heart?: Image;
}
