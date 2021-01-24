import { describe, it, expect } from '@jest/globals';
import Game from '../Game';
import type { Spell } from '../Spell';
import Unit from '../Unit';
import Player from '../Player';

describe('Spell', () => {
  describe('Cast', () => {
    it("it should remove this.mana from the player's mana when cast", () => {
      const g = new Game();
      const p = new Player();
      const player_start_mana = p.mana;
      const u = new Unit(0, 0, 0, 0, g);
      const s: Spell = {
        damage: 1,
        mana_cost: 1,
      };
      p.cast(s, u);
      expect(p.mana).toEqual(player_start_mana - s.mana_cost);
    });
    it('it should deal this.damage to target', () => {
      const g = new Game();
      const p = new Player();
      const u = new Unit(0, 0, 0, 0, g);
      const unit_start_health = u.health;
      const s: Spell = {
        damage: 1,
        mana_cost: 1,
      };
      p.cast(s, u);
      expect(u.health).toEqual(unit_start_health - s.damage);
    });
    it('it should NOT cast and return false if player has insufficient mana', () => {
      const g = new Game();
      const p = new Player();
      // Make player's mana insufficient
      p.mana = 0;

      const u = new Unit(0, 0, 0, 0, g);
      const unit_start_health = u.health;
      const s: Spell = {
        damage: 1,
        mana_cost: 1,
      };
      const cast_result = p.cast(s, u);
      expect(cast_result).toEqual(false);
      expect(u.health).toEqual(unit_start_health);
    });
  });
});
