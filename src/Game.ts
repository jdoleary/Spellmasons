import type Unit from './Unit';
import type { SpellMeta } from './Spell';
import type Player from './Player';

export enum game_state {
  Playing,
  GameOver,
}

export default class Game {
  state: game_state = game_state.Playing;
  players: Player[] = [];
  units: Unit[] = [];
  spellMetas: SpellMeta[] = [];
  nextTurn() {
    // Cast spells
    for (let sm of this.spellMetas) {
      const { spell, caster, target } = sm;
      caster?.cast(spell, target);
    }
    // Remove all spells, now that they are cast
    // TODO traps shouldn't be removed unless they are cast
    this.spellMetas = [];

    // Remove dead units
    this.units = this.units.filter((u) => u.alive);

    // Move units
    for (let u of this.units) {
      u.move();
    }

    // Restore player mana
    for (let p of this.players) {
      p.mana = p.mana_max;
      // Check for gameover
      if (p.heart_health <= 0) {
        this.state = game_state.GameOver;
      }
    }
  }
}
