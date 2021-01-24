import type Player from './Player';
import type Unit from './Unit';

export interface Spell {
  mana_cost: number;
  // damage can be negative for healing
  damage: number;
}

export interface SpellMeta {
  caster?: Player;
  target?: Unit;
  spell: Spell;
}
