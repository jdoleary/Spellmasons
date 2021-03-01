import { describe, it, expect, beforeAll } from '@jest/globals';
import Game, { game_state } from '../Game';
import * as Player from '../Player';
import * as Unit from '../Unit';

describe('Game', () => {
  it('should transition to state "Game Over" when a nextTurn() occurs while a player\'s heart is destroyed', () => {
    const g = new Game();
    const p = Player.create('1', -1);
    g.players.push(p);
    g.players.push(Player.create('2', 7));
    p.heart_health = 0;

    g.nextTurn();
    expect(g.state).toEqual(game_state.GameOver);
  });
  describe('Turns - in order', () => {
    let g: Game;
    let u: Unit.IUnit;
    let u2: Unit.IUnit;
    let u_frozen: Unit.IUnit;
    let p: Player.IPlayer;
    beforeEach(() => {
      g = new Game();
      p = Player.create('1', -1);
      g.players.push(p);
      u = Unit.create(0, 0, 0, 1);
      u2 = Unit.create(1, 0, 0, -1);
      u_frozen = Unit.create(7, 7, 0, 0);
      u_frozen.frozen = true;
      // Summon units into the game
      g.summon(u);
      g.summon(u2);
      g.summon(u_frozen);
      // Setup spell to be cast
      g.spells.push({
        damage: u2.health,
        caster: p,
        x: u2.x,
        y: u2.y,
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
    it('should remove dead units from the board after they have had a turn to animate dead', () => {
      // Pass one extra turn to allow them to animate dead
      g.nextTurn();
      // Show that u2 has been removed
      expect(g.units).not.toContain(u2);
    });
    it('"just spawned" units should wait a turn before moving', () => {
      expect(u.y).toEqual(0);
    });
    it('should trigger "move" on all living units every turn after they have been spawned for > 1 turn', () => {
      // Next turn so the just_spawned units wake up
      g.nextTurn();
      expect(u.y).toEqual(1);
      // Did not move because it's dead
      expect(u2.y).toEqual(0);
    });
    it('should unfreeze any frozen units', () => {
      expect(u_frozen.frozen).toEqual(false);
    });
  });
  describe('getUnitsWithinDistanceOfPoint', () => {
    it('should return units within distance of point', () => {
      const g = new Game();
      const u_not_in_range = Unit.create(0, 0, 0, 0);
      const u_not_in_range_2 = Unit.create(7, 0, 0, 0);
      const u_not_in_range_3 = Unit.create(0, 7, 0, 0);
      const u_not_in_range_4 = Unit.create(7, 7, 0, 0);
      const toSummon = [
        Unit.create(4, 4, 0, 0),
        Unit.create(3, 4, 0, 0),
        Unit.create(4, 3, 0, 0),
        Unit.create(3, 3, 0, 0),
        Unit.create(5, 4, 0, 0),
        Unit.create(4, 5, 0, 0),
        u_not_in_range,
        u_not_in_range_2,
        u_not_in_range_3,
        u_not_in_range_4,
      ];
      toSummon.forEach((u: Unit.IUnit) => {
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
  describe('getTouchingUnitsRecursive', () => {
    it('It should return all touching units (1 square away) with no duplicates', () => {
      const g = new Game();
      const u_not_in_range = Unit.create(0, 0, 0, 0);
      const u_not_in_range_2 = Unit.create(7, 0, 0, 0);
      const u_not_in_range_3 = Unit.create(0, 7, 0, 0);
      const u_not_in_range_4 = Unit.create(7, 7, 0, 0);
      const toSummon = [
        Unit.create(4, 4, 0, 0),
        Unit.create(3, 4, 0, 0),
        Unit.create(4, 3, 0, 0),
        Unit.create(3, 3, 0, 0),
        Unit.create(5, 4, 0, 0),
        Unit.create(4, 5, 0, 0),
        u_not_in_range,
        u_not_in_range_2,
        u_not_in_range_3,
        u_not_in_range_4,
      ];
      toSummon.forEach((u: Unit.IUnit) => {
        g.summon(u);
      });

      const inRange = g.getTouchingUnitsRecursive(4, 4, 1);
      expect(inRange.length).toEqual(6);
      expect(inRange).not.toContain(u_not_in_range);
      expect(inRange).not.toContain(u_not_in_range_2);
      expect(inRange).not.toContain(u_not_in_range_3);
      expect(inRange).not.toContain(u_not_in_range_4);
    });
  });
});
