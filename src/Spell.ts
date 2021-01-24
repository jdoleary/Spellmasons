import type Game from './Game';
import type Player from './Player';
import type Unit from './Unit';

export interface EffectArgs {
  unit?: Unit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit[];
  game?: Game;
}
export function effect(spell: Spell, args: EffectArgs) {
  const { unit, game, ignore = [] } = args;
  if (unit) {
    if (ignore.includes(unit)) {
      return;
    }
    if (spell.damage) {
      unit.health -= spell.damage;
    }
    if (spell.freeze) {
      unit.frozen = true;
    }
    if (game && spell.chain) {
      const chained_units = game.getUnitsWithinDistanceOfPoint(
        unit.x,
        unit.y,
        1,
      );
      for (let chained_unit of chained_units) {
        // Cast again on chained unit
        // Add self to the ignore array so it doesn't cast again
        // because current unit is still touching the unit it chains to, so
        // we must make sure it doesn't chain back and forth forever
        effect(spell, {
          ...args,
          unit: chained_unit,
          ignore: [...ignore, unit],
        });
      }
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
