import { PLAYER_HEART_HEALTH } from './config';
import type { Spell } from './Spell';
import type Unit from './Unit';

export default class Player {
  heart_health: number = PLAYER_HEART_HEALTH;
  mana: number = 2;
  mana_max: number = 2;
  heart_x?: number;
  heart_y?: number;
  cast(s: Spell, target?: Unit): boolean {
    if (this.mana >= s.mana_cost) {
      this.mana -= s.mana_cost;
      if (target) {
        target.takeDamage(s.damage);
      }
      return true;
    } else {
      return false;
    }
  }
}
