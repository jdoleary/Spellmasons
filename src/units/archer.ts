import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import { actionLineOfSight } from './actions/rangedAction';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/golem-blue.png',
    subtype: UnitSubType.ARCHER,
    probability: 50,
  },
  unitProps: {
    attackRange: 10000,
    manaMax: 0,
  },
  action: async (unit: Unit.IUnit) => {
    actionLineOfSight(unit, (target: Unit.IUnit) => {
      return createVisualFlyingProjectile(
        unit,
        target.x,
        target.y,
        'arrow.png',
      ).then(() => {
        Unit.takeDamage(target, unit.damage, false, undefined);
      })
    });
  },
};
export default unit;
