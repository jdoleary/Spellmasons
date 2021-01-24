import { PLAYER_HEART_HEALTH } from './config';
import type { Spell } from './Spell';

export default class Player {
  // wsPie id
  client_id?: string;
  heart_health: number = PLAYER_HEART_HEALTH;
  mana: number = 2;
  mana_max: number = 2;
  heart_x?: number;
  heart_y?: number;
  canCast(s: Spell): boolean {
    if (this.mana >= s.mana_cost) {
      this.mana -= s.mana_cost;
      return true;
    } else {
      return false;
    }
  }
}
