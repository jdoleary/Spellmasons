import type Game from './Game';
import type Player from './Player';
import type Unit from './Unit';

export interface EffectArgs {
  unit?: Unit;
  game?: Game;
}
export function effect(spell: Spell, args: EffectArgs) {
  const { unit, game } = args;
  if (unit) {
    if (spell.damage) {
      unit.health -= spell.damage;
    }
    if (spell.freeze) {
      unit.frozen = true;
    }
  }
  if (game) {
    if (spell.summon) {
      game.summon(spell.summon);
    }
  }
}
export interface Spell {
  mana_cost: number;
  caster: Player;
  target_x?: number;
  target_y?: number;
  // damage can be negative for healing
  damage?: number;
  freeze?: boolean;
  chain?: boolean;
  rotate?: boolean;
  summon?: Unit;
}
