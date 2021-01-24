import type Player from './Player';

export interface Spell {
  mana_cost: number;
  // damage can be negative for healing
  damage: number;
}

export interface SpellMeta {
  caster?: Player;
  target_x: number;
  target_y: number;
  spell: Spell;
}
