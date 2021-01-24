import { describe, it, expect, beforeAll } from '@jest/globals';
import Game, { game_state } from '../Game';
import Player from '../Player';
import Unit from '../Unit';

describe('Game', () => {
  describe.only('queueSpell()', () => {
    it('should queue spell if caster has enough mana', () => {
      const p = new Player();
      const player_start_mana = p.mana;
      const s = {
        damage: 1,
        caster: p,
      };
      const g = new Game();
      g.queueSpell(s);
      expect(p.mana).toEqual(player_start_mana - s.damage);
      expect(g.spells).toContain(s);
    });
    it('should NOT queue spell if caster has insufficient mana', () => {
      const p = new Player();
      const player_start_mana = p.mana;
      const s = {
        caster: p,
        damage: 1000,
      };
      const g = new Game();
      g.queueSpell(s);
      expect(p.mana).toEqual(player_start_mana);
      expect(g.spells).not.toContain(s);
    });
  });
  it('should transition to state "Game Over" when a nextTurn() occurs while a player\'s heart is destroyed', () => {
    const g = new Game();
    const p = new Player();
    g.players.push(p);
    g.players.push(new Player());
    p.heart_health = 0;

    g.nextTurn();
    expect(g.state).toEqual(game_state.GameOver);
  });
  describe('Turns - in order', () => {
    let g: Game;
    let u: Unit;
    let u2: Unit;
    let u_frozen: Unit;
    let p: Player;
    beforeAll(() => {
      g = new Game();
      p = new Player();
      g.players.push(p);
      // Simulate mana loss (this is handled mid-turn when spells are cast)
      // in order to assert that mana is reset to mana_max
      p.mana = p.mana_max - 1;
      u = new Unit(0, 0, 0, 1);
      u2 = new Unit(1, 0, 0, -1);
      u2.alive = false;
      u_frozen = new Unit(7, 7, 0, 0);
      u_frozen.frozen = true;
      // Summon units into the game
      g.summon(u);
      g.summon(u2);
      g.summon(u_frozen);
      // Setup spell to be cast
      g.spells.push({
        damage: u2.health,
        caster: p,
        target_x: u2.x,
        target_y: u2.y,
      });
      // Trigger the next turn which will change the game state to
      // what will be tested in all the following tests
      g.nextTurn();
    });
    it('should cast spells on every turn', () => {
      expect(u2.health).toEqual(0);
      expect(u2.alive).toEqual(false);
    });
    it('Should remove spells after they are cast', () => {
      expect(g.spells.length).toEqual(0);
    });
    it('should remove dead units from the board', () => {
      // Show that u2 has been removed
      expect(g.units).not.toContain(u2);
    });
    it('should trigger "move" on all living units every turn', () => {
      expect(u.y).toEqual(1);
      // Did not move because it's dead
      expect(u2.y).toEqual(0);
    });
    it('should unfreeze any frozen units', () => {
      expect(u_frozen.frozen).toEqual(false);
    });
    it("should restore players' mana to mana_max", () => {
      expect(p.mana).toEqual(p.mana_max);
    });
  });
  describe('getUnitsWithinDistanceOfPoint', () => {
    it('should return units within distance of point', () => {
      const g = new Game();
      const u_not_in_range = new Unit(0, 0, 0, 0);
      const u_not_in_range_2 = new Unit(7, 0, 0, 0);
      const u_not_in_range_3 = new Unit(0, 7, 0, 0);
      const u_not_in_range_4 = new Unit(7, 7, 0, 0);
      const toSummon = [
        new Unit(4, 4, 0, 0),
        new Unit(3, 4, 0, 0),
        new Unit(4, 3, 0, 0),
        new Unit(3, 3, 0, 0),
        new Unit(5, 4, 0, 0),
        new Unit(4, 5, 0, 0),
        u_not_in_range,
        u_not_in_range_2,
        u_not_in_range_3,
        u_not_in_range_4,
      ];
      toSummon.forEach((u: Unit) => {
        g.summon(u);
      });

      const inRange = g.getUnitsWithinDistanceOfPoint(4, 4, 1);
      expect(inRange.length).toEqual(6);
      expect(inRange).not.toContain(u_not_in_range);
      expect(inRange).not.toContain(u_not_in_range_2);
      expect(inRange).not.toContain(u_not_in_range_3);
      expect(inRange).not.toContain(u_not_in_range_4);
    });
  });
});
