import { describe, it, expect } from '@jest/globals';
import * as Unit from '../Unit';
import Game from '../Game';
import * as Player from '../Player';

describe('Unit', () => {
  it('should die when health reaches 0', () => {
    const g = new Game();
    const u = Unit.create(0, 0, 0, 0);
    g.summon(u);
    u.health = 5;
    Unit.takeDamage(u, u.health);
    expect(u.alive).toEqual(false);
  });
  describe('when frozen', () => {
    it('should not move', () => {
      const u = Unit.create(0, 0, 0, 1);
      u.frozen = true;
      Unit.move(u);
      expect(u.y).toEqual(0);
    });
    it('should not deal damage when it is moved into', () => {
      const g = new Game();
      // Set u up to move into u1
      const u = Unit.create(0, 0, 0, 1);
      const u2 = Unit.create(0, 1, 0, 0);
      g.summon(u);
      g.summon(u2);
      // Give u2 power to attack u when u moves into it
      u2.power = 2;
      // Make u2 frozen
      u2.frozen = true;
      const START_HEALTH = 4;
      u.health = START_HEALTH;
      u2.health = START_HEALTH;
      Unit.move(u);
      // Expect that no damage has been taken
      expect(u.health).toEqual(START_HEALTH);
    });
  });
});
