import { describe, it, expect } from '@jest/globals';
import { Spell } from '../Spell';
import Player from '../Player';

describe('Player', () => {
  describe('canCast', () => {
    it("it should remove this.mana from the player's mana when cast", () => {
      const p = new Player();
      const player_start_mana = p.mana;
      const s = {
        mana_cost: 1,
        caster: p,
      };
      p.canCast(s);
      expect(p.mana).toEqual(player_start_mana - s.mana_cost);
    });
    it('it should return false if player has insufficient mana', () => {
      const p = new Player();
      // Make player's mana insufficient
      p.mana = 0;

      const s = {
        mana_cost: 1,
        caster: p,
      };
      const cast_result = p.canCast(s);
      expect(cast_result).toEqual(false);
    });
  });
});
