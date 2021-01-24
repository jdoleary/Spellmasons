import type Player from './Player';
import type Unit from './Unit';

export interface EffectArgs {
  unit?: Unit;
}
export function effect(spell: Spell, args: EffectArgs) {
  const { unit } = args;
  if (unit) {
    if (spell.damage) {
      unit.health -= spell.damage;
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
}
