import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { bloodDragger } from '../../graphics/ui/colors';
import type Underworld from '../../Underworld';
import { pull } from '../../cards/pull';

const manaCostToCast = 15;
const unit: UnitSource = {
  id: 'dragger',
  info: {
    description: 'A dragger will pull you into danger if it gets close enough to do so',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 420,
    bloodColor: bloodDragger,
    manaCostToCast
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
  },
  animations: {
    idle: 'units/poisIdle',
    hit: 'units/poisHit',
    attack: 'units/poisAttack',
    die: 'units/poisDeath',
    walk: 'units/poisWalk',
  },
  sfx: {
    damage: 'unitDamage',
    death: 'poisonerDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        // @ts-ignore for some reason ts is flagging this as an error but it works fine
        // in pixi.
        new MultiColorReplaceFilter(
          [
            [0x93d491, 0x91c7d4], // skinMedium
            [0x86eb83, 0x83d7eb], //skinLight
            [0x77f773, 0x83d7eb], //skinVeryLight
            [0x74b675, 0x74a7b6], // skinDark
            [0x60775f, 0x5f7377], // clothesDark
            [0x60775f, 0x849497], // clothesLight
          ],
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld) => {
    const nonPoisonedEnemyUnits = underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    if (nonPoisonedEnemyUnits.length) {
      const chosenUnit = nonPoisonedEnemyUnits[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit) && unit.mana >= unit.manaCostToCast) {
          unit.mana - unit.manaCostToCast;
          // Poisoners attack or move, not both; so clear their existing path
          unit.path = undefined;
          await Unit.playAnimation(unit, unit.animations.attack);
          await pull(chosenUnit, unit, 1, underworld, false);
        } else {
          // Only move if not in range
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
          await Unit.moveTowards(unit, moveTo, underworld);
        }
      }
    }
  },
};
export default unit;
