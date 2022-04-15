import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import { createVisualLobbingProjectile } from '../Projectile';
import { action } from './actions/rangedAction';

const unit: UnitSource = {
  id: 'lobber',
  info: {
    description: 'A sand golem, runs away if you get too close!',
    image: 'units/golem-sand.png',
    subtype: UnitSubType.LOBBER,
    probability: 30,
  },
  unitProps: {
    attackRange: 300
  },
  action: async (unit: Unit.IUnit) => {
    action(unit, canInteractWithTarget, (target: Unit.IUnit) => {
      return createVisualLobbingProjectile(
        unit,
        target.x,
        target.y,
        'green-thing.png',
      ).then(() => {
        if (target) {
          Unit.takeDamage(target, unit.damage, false, undefined);
        }
      });
    });


  },
  canInteractWithTarget,
};
function canInteractWithTarget(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  const dist = math.distance(unit, { x, y });
  // Can hit you if you are within attackRange
  return dist <= unit.attackRange
}
export default unit;
