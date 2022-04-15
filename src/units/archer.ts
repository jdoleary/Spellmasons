import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import { createVisualFlyingProjectile } from '../Projectile';
import { action } from './actions/rangedAction';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/golem-blue.png',
    subtype: UnitSubType.ARCHER,
    probability: 50,
  },
  unitProps: {
    attackRange: 300,
    mana: 0,
    manaMax: 0,
    manaPerTurn: 0
  },
  action: async (unit: Unit.IUnit) => {
    action(unit, canInteractWithTarget, (target: Unit.IUnit) => {
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
