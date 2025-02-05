import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import * as Vec from '../../jmath/Vec';
import { createVisualFlyingProjectile } from '../Projectile';
import * as resurrect from '../../cards/resurrect';
import Underworld from '../../Underworld';
import { summoningSicknessId } from '../../modifiers/summoningSickness';

async function animatePriestProjectileAndHit(self: Unit.IUnit, target: Unit.IUnit) {
  // TODO does this cause an issue on headless?
  await createVisualFlyingProjectile(
    self,
    target,
    'priestProjectileCenter',
  );
}
async function resurrectUnits(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  if (units.length == 0) {
    return false;
  }
  playSFXKey('priestAttack');
  await Unit.playAnimation(self, unit.animations.attack);
  self.mana -= self.manaCostToCast;
  let didResurrect = false;
  let promises = [];
  for (let ally of units) {
    promises.push(animatePriestProjectileAndHit(self, ally).then(async () => {
      const { targetedUnits } = await underworld.castCards({
        casterCardUsage: {},
        casterUnit: self,
        casterPositionAtTimeOfCast: Vec.clone(self),
        cardIds: [resurrect.resurrect_id],
        castLocation: ally,
        initialTargetedUnitId: ally.id,
        prediction: false,
        outOfRange: false,
        castForFree: true,
      });
      for (let unit of targetedUnits) {
        // Add summoning sickeness so they can't act after they are summoned
        Unit.addModifier(unit, summoningSicknessId, underworld, false);
      }
    }));
    didResurrect = true;
  }
  await Promise.all(promises);
  return didResurrect;
}
export const PRIEST_ID = 'priest';
const unit: UnitSource = {
  id: PRIEST_ID,
  info: {
    description: 'priest_copy',
    image: 'priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    damage: 0,
    attackRange: 500,
    healthMax: 40,
    mana: 90,
    manaMax: 90,
    manaPerTurn: 30,
    manaCostToCast: 60,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 9,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'priestIdle',
    hit: 'priestHit',
    attack: 'priestAttack',
    die: 'priestDeath',
    walk: 'priestWalk',
  },
  sfx: {
    damage: 'priestHurt',
    death: 'priestDeath',
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    if (attackTargets.length) {
      // Resurrect dead ally
      didAction = await resurrectUnits(unit, attackTargets, underworld);
    }
    if (!didAction) {
      const closestDeadResurrectable = Unit.closestInListOfUnits(unit,
        resurrectableUnits(unit, underworld)
      );
      // Move to closest dead ally
      if (closestDeadResurrectable) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestDeadResurrectable, unit.stamina);
        await Unit.moveTowards(unit, moveTo, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.mana < unit.manaCostToCast) {
      return [];
    }
    const numberOfAlliesToRez = unit.isMiniboss ? 3 : 1;
    return resurrectableUnits(unit, underworld)
      .filter(u => Unit.inRange(unit, u))
      .sort(math.sortCosestTo(unit))
      .slice(0, numberOfAlliesToRez);
  }
};
export function resurrectableUnits(resurrector: Unit.IUnit, underworld: Underworld): Unit.IUnit[] {
  return underworld.units.filter(u =>
    !u.alive
    // Do not allow priest to rez player characters
    // of a different faction (this would cause)
    // the player to change faction
    && (u.unitType !== UnitType.PLAYER_CONTROLLED || u.faction == resurrector.faction)
    // < 0 for predictedNextTurnDamage is a special signal to mean that another priest
    // is already targeting it for resurrect
    && u.predictedNextTurnDamage >= 0
    // Exclude units such as decoys which neither move nor attack
    // this is confusing for players who think that the map is empty of enemies
    && (u.damage > 0 || u.staminaMax > 0)
    // Do not allow priest to rez each other.
    // That would be super annoying for players
    && u.unitSourceId !== resurrector.unitSourceId);
}

export default unit;
