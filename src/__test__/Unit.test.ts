import { describe, it, expect } from '@jest/globals';
import Unit from '../Unit';
import Game from '../Game';
import Player from '../Player';

describe('Unit', () => {
  it('should die when health reaches 0', () => {
    const g = new Game();
    const u = new Unit(0, 0, 0, 0);
    g.summon(u);
    u.health = 5;
    u.takeDamage(u.health);
    expect(u.alive).toEqual(false);
  });
  describe('when frozen', () => {
    it('should not move', () => {
      const u = new Unit(0, 0, 0, 1);
      u.frozen = true;
      u.move();
      expect(u.y).toEqual(0);
    });
    it('should not deal damage when it is moved into', () => {
      const g = new Game();
      // Set u up to move into u1
      const u = new Unit(0, 0, 0, 1);
      const u2 = new Unit(0, 1, 0, 0);
      g.summon(u);
      g.summon(u2);
      // Give u2 power to attack u when u moves into it
      u2.power = 2;
      // Make u2 frozen
      u2.frozen = true;
      const START_HEALTH = 4;
      u.health = START_HEALTH;
      u2.health = START_HEALTH;
      u.move();
      // Expect that no damage has been taken
      expect(u.health).toEqual(START_HEALTH);
    });
  });
  it('should attack whatever it moves into', () => {
    const g = new Game();
    // Set u up to move into u1
    const u = new Unit(0, 0, 0, 1);
    const u2 = new Unit(0, 1, 0, 0);
    g.summon(u);
    g.summon(u2);
    u.power = 2;
    const START_HEALTH = 4;
    u2.health = START_HEALTH;
    u.move();
    expect(u2.health).toEqual(START_HEALTH - u.power);
  });
  it('should BE attacked whatever it moves into if what it moves into is capable of dealing damage', () => {
    const g = new Game();
    // Set u up to move into u1
    const u = new Unit(0, 0, 0, 1);
    const u2 = new Unit(0, 1, 0, 0);
    g.summon(u);
    g.summon(u2);
    // Give u2 power to attack u when u moves into it
    u2.power = 2;
    const START_HEALTH = 4;
    u.health = START_HEALTH;
    u2.health = START_HEALTH;
    u.move();
    expect(u.health).toEqual(START_HEALTH - u2.power);
  });
  it('should not be able to move into a space occupied by a non-dead unit', () => {
    const g = new Game();
    const START_X = 0;
    const START_Y = 0;
    const START_VY = 1;
    // Set u up to move into u1
    const u = new Unit(START_X, START_Y, 0, START_VY);
    const u2 = new Unit(0, START_Y + START_VY, 0, 0);
    g.summon(u);
    g.summon(u2);
    u.power = 0;
    const START_HEALTH = 4;
    u.health = START_HEALTH;
    u2.health = START_HEALTH;
    u.move();
    // Expect that u has NOT physically moved because u2 is blocking and not dead
    expect(u.x).toEqual(START_X);
    expect(u.y).toEqual(START_Y);
  });
  it('should attack before it attempts to occupy a space via a move', () => {
    const g = new Game();
    const START_X = 0;
    const START_Y = 0;
    const START_VY = 1;
    // Set u up to move into u1
    const u = new Unit(START_X, START_Y, 0, START_VY);
    const u2 = new Unit(0, START_Y + START_VY, 0, 0);
    g.summon(u);
    g.summon(u2);
    const START_HEALTH = 4;
    u.power = START_HEALTH;
    u.health = START_HEALTH;
    u2.health = START_HEALTH;
    // Make u strong enough to kill u2 with one attack
    u.move();
    // Expect that u HAS physically moved because u2 was blocking but is now dead
    expect(u.x).toEqual(START_X);
    expect(u.y).toEqual(START_Y + START_VY);
  });
  it("should be able to move through multiple units if it's attacks kill them and it still has moves to make", () => {});
  it('should attack the heart when it reaches the end of the board', () => {
    const g = new Game();
    const p = new Player();
    const START_HEART_HEALTH = 1;
    p.heart_health = START_HEART_HEALTH;
    // Put player at the bottom of the board
    p.heart_y = g.height + 1;
    g.players.push(p);

    const START_X = 0;
    const START_Y = g.height;
    const START_VY = 1;
    // Set u up to move into p's heart at the bottom of the board
    const u = new Unit(START_X, START_Y, 0, START_VY);
    g.summon(u);
    u.power = START_HEART_HEALTH;
    // Move u into heart
    u.move();
    expect(p.heart_health).toEqual(0);
  });
  it('should trigger all traps on a cell that it moves into', () => {});
  describe('when destruct == true', () => {
    it('should attack the heart and selfdestruct when it reaches the end of the board', () => {
      const g = new Game();
      const p = new Player();
      const START_HEART_HEALTH = 8;
      const START_UNIT_HEALTH = 1;
      const START_UNIT_POWER = 1;
      p.heart_health = START_HEART_HEALTH;
      // Put player at the bottom of the board
      p.heart_y = g.height + 1;
      g.players.push(p);

      const START_X = 0;
      const START_Y = g.height;
      const START_VY = 1;
      // Set u up to move into p's heart at the bottom of the board
      const u = new Unit(START_X, START_Y, 0, START_VY);
      // Set u to destruct
      u.destruct = true;
      g.summon(u);
      u.health = START_UNIT_HEALTH;
      u.power = START_UNIT_POWER;
      // Move u into heart
      u.move();
      // Ensure the heart received u.power + u.health as damage
      expect(p.heart_health).toEqual(
        START_HEART_HEALTH - START_UNIT_HEALTH - START_UNIT_POWER,
      );
      // Ensure the unit self-destructed
      expect(u.alive).toEqual(false);
    });
    it('should attack whatever it moves into with power AND health and should self-destruct', () => {
      const g = new Game();
      // Set u up to move into u1
      const u = new Unit(0, 0, 0, 1);
      // Set u to destruct
      u.destruct = true;
      const U_START_HEALTH = 1;
      u.health = U_START_HEALTH;
      u.power = 1;
      const u2 = new Unit(0, 1, 0, 0);
      g.summon(u);
      g.summon(u2);
      const U2_START_HEALTH = 4;
      u2.health = U2_START_HEALTH;
      u.move();
      // Ensure u2 received u.power + u.health as damage
      expect(u2.health).toEqual(U2_START_HEALTH - u.power - U_START_HEALTH);
      // Ensure the unit self-destructed
      expect(u.alive).toEqual(false);
    });
  });
});
