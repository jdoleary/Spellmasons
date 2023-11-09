import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import * as Vec from '../../jmath/Vec';
import { createVisualFlyingProjectile } from '../Projectile';
import * as resurrect from '../../cards/resurrect';
import Underworld from '../../Underworld';
import { summoningSicknessId } from '../../modifierSummoningSickness';

const manaCostToCast = resurrect.default.card.manaCost;
async function animatePriestProjectileAndHit(self: Unit.IUnit, target: Unit.IUnit) {
  // TODO does this cause an issue on headless?
  await createVisualFlyingProjectile(
    self,
    target,
    'projectile/priestProjectileCenter',
  );
}
async function resurrectUnits(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  if (units.length == 0) {
    return false;
  }
  playSFXKey('priestAttack');
  let didResurrect = false;
  await Unit.playAnimation(self, unit.animations.attack);
  let promises = [];
  for (let ally of units) {
    promises.push(animatePriestProjectileAndHit(self, ally).then(async () => {
      const { targetedUnits } = await underworld.castCards({
        casterCardUsage: {},
        casterUnit: self,
        casterPositionAtTimeOfCast: Vec.clone(self),
        cardIds: [resurrect.resurrect_id],
        castLocation: ally,
        prediction: false,
        outOfRange: false,
      });
      for (let unit of targetedUnits) {
        // Add summoning sickeness so they can't act after they are summoned
        Unit.addModifier(unit, summoningSicknessId, underworld, false);
      }
    }));
    didResurrect = true;
  }
  await Promise.all(promises);
  // Ensure priest never goes below 0 mana
  // This is a bandaid because a miniboss priest will cast multiple times drawing mana from each cast
  self.mana = Math.max(0, self.mana);
  return didResurrect;

}
const unit: UnitSource = {
  id: 'priest',
  info: {
    description: 'priest_copy',
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 500,
    healthMax: 20,
    damage: 0,
    manaCostToCast,
    manaMax: manaCostToCast,
    manaPerTurn: manaCostToCast / 2
  },
  spawnParams: {
    probability: 20,
    budgetCost: 9,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'units/priestIdle',
    hit: 'units/priestHit',
    attack: 'units/priestAttack',
    die: 'units/priestDeath',
    walk: 'units/priestWalk',
  },
  sfx: {
    damage: 'priestHurt',
    death: 'priestDeath',
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    if (attackTargets.length) {
      // Priests attack or move, not both; so clear their existing path
      unit.path = undefined;
      // Resurrect dead ally
      const numberOfAlliesToRez = unit.isMiniboss ? 3 : 1;
      didAction = await resurrectUnits(unit, attackTargets.slice(0, numberOfAlliesToRez), underworld);
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
    if (unit.mana < manaCostToCast) {
      return [];
    }
    return resurrectableUnits(unit, underworld).filter(u => {
      return Unit.inRange(unit, u)

    });
  }
};
export function resurrectableUnits(resurrector: Unit.IUnit, underworld: Underworld): Unit.IUnit[] {
  return underworld.units.filter(u =>
    !u.alive
    // Do not allow priest to rez player characters
    // of a different faction (this would cause)
    // the player to change faction
    && (u.unitType !== UnitType.PLAYER_CONTROLLED || u.faction == resurrector.faction)
    // Do not allow priest to rez each other.
    // That would be super annoying for players
    && u.unitSourceId !== resurrector.unitSourceId);

}

export default unit;
