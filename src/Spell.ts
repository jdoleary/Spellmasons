import type Game from './Game';
import type Player from './Player';
import Unit from './Unit';

export interface Spell {
  caster?: Player;
  target_x?: number;
  target_y?: number;
  // damage can be negative for healing
  damage?: number;
  freeze?: boolean;
  chain?: boolean;
  aoe_radius?: number;
  // TODO
  rotate?: boolean;
  // TODO, in form of object
  summon?: any;
  // in turns
  delay?: number;
}
export function getManaCost(s: Spell) {
  console.log('spell', s);
  let cost = 0;
  if (s.damage) {
    cost += s.damage;
  }
  if (s.delay) {
    cost -= s.delay;
  }
  if (s.freeze) {
    cost += 2;
  }
  if (s.chain) {
    cost += 4;
  }
  if (s.aoe_radius > 0) {
    cost += 4 * s.aoe_radius;
  }
  if (s.summon) {
    cost += 4;
  }
  return cost;
}
export interface EffectArgs {
  unit?: Unit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit[];
  game?: Game;
}
export function effect(spell: Spell, args: EffectArgs) {
  console.log('Spell effect', spell, args);
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
      unit.takeDamage(spell.damage);
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
      const { x, y, vx, vy, imagePath } = spell.summon;
      const unit = new Unit(x, y, vx, vy, imagePath);
      game.summon(unit);
    }
  }
}
