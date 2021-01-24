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
  describe('Modifiers', () => {
    describe('AOE', () => {
      it('should AOE to units within radius', () => {
        const g = new Game();
        const p = new Player();
        g.players.push(p);
        p.mana = 1;
        const HEALTH = 4;
        const u1 = new Unit(0, 0, 0, 1);
        const u2 = new Unit(1, 0, 0, -1);
        const u3 = new Unit(2, 0, 0, -1);
        const u4 = new Unit(4, 0, 0, -1);
        u1.name = 'u1';
        u2.name = 'u2';
        u3.name = 'u3';
        u4.name = 'u4';
        u1.health = HEALTH;
        u2.health = HEALTH;
        u3.health = HEALTH;
        u4.health = HEALTH;
        // Summon units into the game
        g.summon(u1);
        g.summon(u2);
        g.summon(u3);
        g.summon(u4);
        // Setup spell to be cast
        const s = {
          mana_cost: 1,
          // Spell will kill units
          damage: HEALTH,
          caster: p,
          // Cast on u3, will also hit u2 due to aoe
          target_x: u3.x,
          target_y: u3.y,
          aoe_radius: 1,
        };
        g.cast(s);
        expect(u1.health).toEqual(HEALTH);
        expect(u2.health).toEqual(0);
        expect(u3.health).toEqual(0);
        expect(u4.health).toEqual(HEALTH);
      });
    });
    describe('Chain', () => {
      it('should chain to touching units', () => {
        const g = new Game();
        const p = new Player();
        g.players.push(p);
        p.mana = 1;
        const HEALTH = 4;
        const u1 = new Unit(0, 0, 0, 1);
        const u2 = new Unit(1, 0, 0, -1);
        const u3 = new Unit(2, 0, 0, -1);
        const u4 = new Unit(4, 0, 0, -1);
        u1.name = 'u1';
        u2.name = 'u2';
        u3.name = 'u3';
        u4.name = 'u4';
        u1.health = HEALTH;
        u2.health = HEALTH;
        u3.health = HEALTH;
        u4.health = HEALTH;
        // Summon units into the game
        g.summon(u1);
        g.summon(u2);
        g.summon(u3);
        g.summon(u4);
        // Setup spell to be cast
        const s = {
          mana_cost: 1,
          // Spell will kill units
          damage: HEALTH,
          caster: p,
          // Cast on u1, will chain to u2 since they are touching
          // and u2 will chain to u3 even though u1 and u3 aren't touching
          // because u2 and u3 are
          target_x: u1.x,
          target_y: u1.y,
          chain: true,
        };
        g.cast(s);
        expect(u1.health).toEqual(0);
        expect(u2.health).toEqual(0);
        expect(u3.health).toEqual(0);
        expect(u4.health).toEqual(HEALTH);
      });
    });
  });
});
