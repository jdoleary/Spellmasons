import * as Unit from '../../Unit';
import * as Image from '../../Image';
import * as math from '../../math';
import { COLLISION_MESH_RADIUS } from '../../config';
import { addPixiSprite } from '../../PixiUtils';

export async function action(unit: Unit.IUnit) {
  if (!Unit.canMove(unit)) {
    return;
  }
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
  if (!closestEnemy) {
    // Do not move if they don't have a target
    return;
  }
  // Orient; make the sprite face it's enemy
  if (closestEnemy.x > unit.x) {
    // Assuming all units are left facing, if the enemy is to the right, make it right facing
    unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
  }
  // Attack closest enemy
  if (canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
    // Change animation and change back
    const currentImageName = unit.image.imageName
    Image.changeSprite(unit.image, addPixiSprite('units/golem_eat', unit.image.sprite.parent, {
      loop: false,
      onComplete: () => {
        Image.changeSprite(unit.image, addPixiSprite(currentImageName, unit.image.sprite.parent));
      }
    }));

    await Unit.takeDamage(closestEnemy, unit.damage);
  } else {
    // Prevent unit from moving inside of target closestEnemy
    const moveDist = Math.min(math.distance(unit, closestEnemy) - COLLISION_MESH_RADIUS * 2, unit.moveDistance)
    const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, moveDist);
    await Unit.moveTowards(unit, moveTo);
    // Update the "planning view" overlay that shows the unit's agro radius
    Unit.updateSelectedOverlay(unit);
  }
}

const range = 10;
export function canInteractWithTarget(
  unit: Unit.IUnit,
  x: number,
  y: number,
): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack target "range" distance from them
  // + COLLISION_MESH_RADIUS*2 ensures that grunt can attack if it can reach the edge of a unit,
  // rather than their center
  return (
    math.distance(unit, { x, y }) <= range + COLLISION_MESH_RADIUS * 2
  );
}
