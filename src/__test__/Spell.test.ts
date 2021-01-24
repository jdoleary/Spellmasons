import { describe, it, expect } from '@jest/globals';
import { Spell, effect } from '../Spell';
import Player from '../Player';
import Unit from '../Unit';
import Game from '../Game';

describe('Spell', () => {
  describe('effect', () => {
    it('it should deal damage to unit', () => {
      const u = new Unit(0, 0, 0, 0);
      const p = new Player();
      p.mana = 1;
      const start_health = u.health;
      const s: Spell = {
        mana_cost: 1,
        caster: p,
        damage: 1,
      };
      effect(s, { unit: u });
      expect(u.health).toEqual(start_health - (s.damage || 0));
    });
    describe('when freeze == true', () => {
      it('it should freeze the unit', () => {
        const u = new Unit(0, 0, 0, 0);
        const p = new Player();
        p.mana = 1;
        const s: Spell = {
          mana_cost: 1,
          caster: p,
          freeze: true,
        };
        effect(s, { unit: u });
        expect(u.frozen).toEqual(true);
      });
    });
    describe('summon', () => {
      const g = new Game();
      const u = new Unit(0, 0, 0, 0);
      const p = new Player();
      p.mana = 1;
      const s: Spell = {
        mana_cost: 1,
        caster: p,
        summon: u,
      };
      g.cast(s);
      expect(g.units).toContain(u);
    });
  });
});
