import * as Unit from '../Unit';
import * as Image from '../Image';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';

const unit: UnitSource = {
  id: 'grunt',
  info: {
    description: 'A basic grunt that will pursue enemies and hit them',
    image: 'units/golem',
    subtype: UnitSubType.AI_melee,
    probability: 100,
  },
  action: async (unit: Unit.IUnit) => {
    if (!Unit.canMove(unit)) {
      return;
    }
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (!closestEnemy) {
      // Do not move if they don't have a target
      return;
    }
    // Attack closest enemy
    if (canInteractWithCell(unit, closestEnemy.x, closestEnemy.y)) {
      Image.attack(unit.image, unit.x, unit.y, closestEnemy.x, closestEnemy.y);
      await Unit.takeDamage(closestEnemy, unit.damage);
    } else {
      const path = window.game.findPath(unit, closestEnemy);
      if (path && path.length >= 2) {
        // 0 index is the current coordinates, so 1 is the next coordinates to move to
        const [next_x, next_y] = path[1];

        if (next_x !== undefined && next_y !== undefined) {
          // set move intention
          unit.intendedNextMove = { x: next_x, y: next_y };
        }
        // Update the "planning view" overlay that shows the unit's agro radius
        Unit.updateSelectedOverlay(unit);
      }
    }
  },
  canInteractWithCell,
};
function canInteractWithCell(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack any cell 1 distance from them
  return (
    (x == unit.x - 1 && y == unit.y) ||
    (x == unit.x + 1 && y == unit.y) ||
    (x == unit.x && y == unit.y - 1) ||
    (x == unit.x && y == unit.y + 1)
  );
}
export default unit;
