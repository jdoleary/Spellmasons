import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import { createVisualFlyingProjectile } from '../Projectile';
import { action } from './actions/rangedAction';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'Will shoot you with an arrow!',
    image: 'units/golem-blue.png',
    subtype: UnitSubType.AI_bishop,
    probability: 50,
  },
  unitProps: {
    attackRange: 300
  },
  action: async (unit: Unit.IUnit) => {
    action(unit, canInteractWithTarget, (target: Unit.IUnit) => {
      return createVisualFlyingProjectile(
        unit,
        target.x,
        target.y,
        'arrow.png',
      ).then(() => {
        Unit.takeDamage(target, unit.damage);
      })
    });
  },
  canInteractWithTarget,
};
function canInteractWithTarget(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Archers can only attack if they can see enemy and are close enough
  return window.underworld.hasLineOfSight(unit, { x, y }) && math.distance(unit, { x, y }) <= unit.attackRange;
}
export default unit;
