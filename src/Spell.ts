import type Game from './Game';
import type Player from './Player';
import type Unit from './Unit';

export interface Spell {
  mana_cost: number;
  caster: Player;
  target_x?: number;
  target_y?: number;
  // damage can be negative for healing
  damage?: number;
  freeze?: boolean;
  chain?: boolean;
  aoe_radius?: number;
  rotate?: boolean;
  summon?: Unit;
  // in turns
  delay?: number;
}
export interface EffectArgs {
  unit?: Unit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit[];
  game?: Game;
}
export function effect(spell: Spell, args: EffectArgs) {
  const { unit, game, ignore = [] } = args;
  if (spell.delay && spell.delay > 0) {
    spell.delay--;
    return;
  }
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
    if (game) {
      if (spell.aoe_radius) {
        const withinRadius = game.getUnitsWithinDistanceOfPoint(
          unit.x,
          unit.y,
          1,
        );
        for (let unit_in_radius of withinRadius) {
          // If not self (because self has already been cast on)
          if (unit_in_radius !== unit) {
            // Cast on units in radius but turn off aoe_radius
            // so it doesn't recur
            effect(
              { ...spell, aoe_radius: 0 },
              {
                ...args,
                unit: unit_in_radius,
              },
            );
          }
        }
      }
      if (spell.chain) {
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
  }
  if (game) {
    if (spell.summon) {
      game.summon(spell.summon);
    }
  }
}
