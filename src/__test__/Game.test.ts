import { describe, it, expect, beforeAll } from '@jest/globals';
import Game, { game_state } from '../Game';
import Player from '../Player';
import Unit from '../Unit';
import { Spell, effect } from '../Spell';

describe('Game', () => {
  it('should transition to state "Game Over" when a nextTurn() occurs while a player\'s heart is destroyed', () => {
    const g = new Game();
    expect(g.state).toEqual(game_state.Playing);
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
      u = new Unit(0, 0, 0, 1, g);
      u2 = new Unit(1, 0, 0, -1, g);
      u2.alive = false;
      u_frozen = new Unit(7, 7, 0, 0, g);
      u_frozen.frozen = true;
      // Setup spell to be cast
      g.spells.push({
        mana_cost: 1,
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
});
