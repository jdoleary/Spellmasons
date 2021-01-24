import { describe, it, expect } from '@jest/globals';
import Unit from '../Unit';
import Game from '../Game';
import Player from '../Player';

describe('Unit', () => {
  it('should die when health reaches 0', () => {
    const g = new Game();
    const u = new Unit(0, 0, 0, 0, g);
    u.health = 5;
    u.takeDamage(u.health);
    expect(u.alive).toEqual(false);
  });
  it('should attack whatever it moves into', () => {
    const g = new Game();
    // Set u up to move into u1
    const u = new Unit(0, 0, 0, 1, g);
    const u2 = new Unit(0, 1, 0, 0, g);
    u.power = 2;
    const START_HEALTH = 4;
    u2.health = START_HEALTH;
    u.move();
    expect(u2.health).toEqual(START_HEALTH - u.power);
  });
  it('should BE attacked whatever it moves into if what it moves into is capable of dealing damage', () => {
    const g = new Game();
    // Set u up to move into u1
    const u = new Unit(0, 0, 0, 1, g);
    const u2 = new Unit(0, 1, 0, 0, g);
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
    const u = new Unit(START_X, START_Y, 0, START_VY, g);
    const u2 = new Unit(0, START_Y + START_VY, 0, 0, g);
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
    const u = new Unit(START_X, START_Y, 0, START_VY, g);
    const u2 = new Unit(0, START_Y + START_VY, 0, 0, g);
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
    const u = new Unit(START_X, START_Y, 0, START_VY, g);
    u.power = START_HEART_HEALTH;
    // Move u into heart
    u.move();
    expect(p.heart_health).toEqual(0);
  });
  it('should trigger all traps on a cell that it moves into', () => {});
});
