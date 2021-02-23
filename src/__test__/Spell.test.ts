import { describe, it, expect } from '@jest/globals';
import { Spell, effect } from '../Spell';
import Player from '../Player';
import * as Unit from '../Unit';
import Game from '../Game';

describe('Spell', () => {
  describe('effect', () => {
    it('it should deal damage to unit', () => {
      const u = Unit.create(0, 0, 0, 0);
      const p = new Player();
      p.mana = 1;
      const start_health = u.health;
      const s: Spell = {
        caster: p,
        damage: 1,
      };
      effect(s, { unit: u });
      expect(u.health).toEqual(start_health - (s.damage || 0));
    });
    describe('when freeze == true', () => {
      it('it should freeze the unit', () => {
        const u = Unit.create(0, 0, 0, 0);
        const p = new Player();
        p.mana = 1;
        const s: Spell = {
          caster: p,
          freeze: true,
        };
        effect(s, { unit: u });
        expect(u.frozen).toEqual(true);
      });
    });
    describe('summon', () => {
      it('Should summon unit on game', () => {
        const g = new Game();
        const p = new Player();
        p.mana = 1;
        const spellArgs = {
          caster: p,
          x: 0,
          y: 0,
        };
        const unitArgs = {
          vx: 0,
          vy: 0,
          imagePath: '',
        };
        const s: Spell = {
          ...spellArgs,
          summon: unitArgs,
        };
        g.cast(s);
        // Create unit that will match the one that was just summoned
        const u = Unit.create(
          s.x,
          s.y,
          unitArgs.vx,
          unitArgs.vy,
          unitArgs.imagePath,
        );
        expect(g.units).toContainEqual(u);
      });
    });
  });
  describe('Modifiers', () => {
    describe('delay', () => {
      it('should decrement delay by 1 every time effect() is called', () => {
        const u = Unit.create(0, 0, 0, 0);
        const p = new Player();
        p.mana = 1;
        const s: Spell = {
          caster: p,
          damage: 1,
          delay: 2,
        };
        effect(s, { unit: u });
        expect(s.delay).toEqual(1);
        effect(s, { unit: u });
        expect(s.delay).toEqual(0);
      });
      it('should not cause effect until delay is 0', () => {
        const u = Unit.create(0, 0, 0, 0);
        const p = new Player();
        p.mana = 1;
        const start_health = u.health;
        const s: Spell = {
          caster: p,
          damage: 1,
          delay: 1,
        };
        effect(s, { unit: u });
        expect(u.health).toEqual(start_health);
        effect(s, { unit: u });
        expect(u.health).toEqual(start_health - (s.damage || 0));
      });
    });
    describe('AOE', () => {
      it('should AOE to units within radius', () => {
        const g = new Game();
        const p = new Player();
        g.players.push(p);
        p.mana = 1;
        const HEALTH = 4;
        const u1 = Unit.create(0, 0, 0, 1);
        const u2 = Unit.create(1, 0, 0, -1);
        const u3 = Unit.create(2, 0, 0, -1);
        const u4 = Unit.create(4, 0, 0, -1);
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
          // Spell will kill units
          damage: HEALTH,
          caster: p,
          // Cast on u3, will also hit u2 due to aoe
          x: u3.x,
          y: u3.y,
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
        const u1 = Unit.create(0, 0, 0, 1);
        const u2 = Unit.create(1, 0, 0, -1);
        const u3 = Unit.create(2, 0, 0, -1);
        const u4 = Unit.create(4, 0, 0, -1);
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
          // Spell will kill units
          damage: HEALTH,
          caster: p,
          // Cast on u1, will chain to u2 since they are touching
          // and u2 will chain to u3 even though u1 and u3 aren't touching
          // because u2 and u3 are
          x: u1.x,
          y: u1.y,
          chain: true,
        };
        g.cast(s);
        expect(u1.health).toEqual(0);
        expect(u2.health).toEqual(0);
        expect(u3.health).toEqual(0);
        expect(u4.health).toEqual(HEALTH);
      });
      it('Ensure units are not effected more than once', () => {
        const g = new Game();
        const p = new Player();
        g.players.push(p);
        p.mana = 1;
        const HEALTH = 4;
        const u1 = Unit.create(2, 3, 0, 1);
        const u2 = Unit.create(3, 4, 0, -1);
        const u3 = Unit.create(4, 4, 0, -1);
        const u4 = Unit.create(4, 5, 0, -1);
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
          damage: 1,
          caster: p,
          x: u1.x,
          y: u1.y,
          chain: true,
        };
        g.cast(s);
        expect(u1.health).toEqual(HEALTH - 1);
        expect(u2.health).toEqual(HEALTH - 1);
        expect(u3.health).toEqual(HEALTH - 1);
        expect(u4.health).toEqual(HEALTH - 1);
      });
    });
  });
});
