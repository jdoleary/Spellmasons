import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { bloodLobber } from '../../graphics/ui/colors';
import * as config from '../../config';
import * as Image from '../../graphics/Image';
import * as colors from '../../graphics/ui/colors';
import { undyingModifierId } from '../../modifierUndying';
import { EffectState, registerEvents } from '../../cards';
import { makeParticleExplosion } from '../../graphics/ParticleCollection';
import { baseExplosionRadius } from '../../effects/explode';
import { drawUICircle } from '../../graphics/PlanningView';
import { suffocateCardId } from '../../cards/suffocate';
import { slowCardId } from '../../cards/slow';
import { contaminate_id } from '../../cards/contaminate';
import { resurrect_id } from '../../cards/resurrect';

export const GORU_UNIT_ID = 'Goru';
const unit: UnitSource = {
  id: GORU_UNIT_ID,
  info: {
    description: 'goru description',
    image: 'units/guruIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 20,
    attackRange: 400,
    healthMax: 60,
    staminaMax: 200,
    mana: 120,
    manaMax: 120,
    manaPerTurn: 60,
    manaCostToCast: 30,
    bloodColor: bloodLobber,
  },
  spawnParams: {
    // Special case: We spawn the Goru manually, but still want to declare a budget
    probability: 0,
    budgetCost: 40,
    unavailableUntilLevelIndex: 9,
  },
  animations: {
    idle: 'units/guruIdle',
    hit: 'units/guruHit',
    attack: 'units/guruAttack',
    die: 'units/guruDeath',
    walk: 'units/guruIdle',
  },
  sfx: {
    damage: 'goruHurt',
    death: 'goruDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (!unit.onDrawSelectedEvents.includes(goruAura)) {
      unit.onDrawSelectedEvents.push(goruAura);
    }
    if (!unit.onTurnStartEvents.includes(goruAura)) {
      unit.onTurnStartEvents.push(goruAura);
    }
    // TODO - Bug: Undying 2 can be re-added by splitting a goru with no undying modifier
    // Using originalLife prevents this, but also prevents summoned Goru's from getting undying.
    if (!unit.modifiers[undyingModifierId]) {
      Unit.addModifier(unit, undyingModifierId, underworld, false, 2);
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {

    // Explode Corpses / Curse / Contaminate?

    // Goru has different actions that require different targets:
    // GetTargets returns all targets that could be valid for either action
    // then we filter to ensure the correct targets are chosen for either action

    if (attackTargets) {
      const deadUnits = attackTargets.filter(u => !u.alive);
      // Resurrect Corpses
      if (deadUnits.length) {
        let promises: Promise<EffectState>[] = [];
        unit.mana -= unit.manaCostToCast;
        await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
          for (const deadUnit of deadUnits) {
            createVisualLobbingProjectile(
              unit,
              deadUnit,
              'projectile/lobberProjectile',
            );

            promises.push(underworld.castCards({
              casterCardUsage: {},
              casterUnit: unit,
              casterPositionAtTimeOfCast: unit,
              cardIds: [resurrect_id],
              castLocation: deadUnit,
              prediction: false,
              outOfRange: false,
              castForFree: true,
            }));
          }
        });
        await Promise.all(promises);
      }

      // Get nearest enemy prioritizing players
      const nearestEnemy = Unit.closestInListOfUnits(unit, underworld.getRemainingPlayerUnits().filter(u => u.faction != unit.faction))
        || Unit.closestInListOfUnits(unit, Unit.livingUnitsInDifferentFaction(unit, underworld.units));
      console.log(nearestEnemy);
      // Curse / Contaminate the nearest living enemy
      if (nearestEnemy) {
        Unit.orient(unit, nearestEnemy);
        unit.mana -= unit.manaCostToCast;
        await Unit.playComboAnimation(unit, unit.animations.attack, () => {
          return createVisualLobbingProjectile(
            unit,
            nearestEnemy,
            'projectile/lobberProjectile',
          );
        });

        // Add projectile hit animation
        Image.addOneOffAnimation(nearestEnemy, 'projectile/lobberProjectileHit');
        Unit.addModifier(nearestEnemy, suffocateCardId, underworld, false, 1);
        Unit.addModifier(nearestEnemy, slowCardId, underworld, false);

        await underworld.castCards({
          casterCardUsage: {},
          casterUnit: unit,
          casterPositionAtTimeOfCast: unit,
          cardIds: [contaminate_id, contaminate_id, contaminate_id],
          castLocation: nearestEnemy,
          prediction: false,
          outOfRange: false,
          castForFree: true,
        });
      }
    }

    // Movement: Walk towards nearest enemy, prioritizing players
    const nearestEnemy = Unit.closestInListOfUnits(unit, underworld.getRemainingPlayerUnits().filter(u => u.faction != unit.faction))
      || Unit.closestInListOfUnits(unit, Unit.livingUnitsInDifferentFaction(unit, underworld.units));
    if (nearestEnemy) {
      const distanceToTarget = math.distance(unit, nearestEnemy);
      if (distanceToTarget > goruAuraRadius / 2) {
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToTarget - goruAuraRadius / 2);
        await Unit.moveTowards(unit, nearestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // TODO - How does this work with predictions, will it show rez if player isnt targeted?
    // Can either target living enemies, or any dead units
    const possibleTargets = underworld.getUnitsWithinDistanceOfTarget(unit, unit.attackRange, false)
      .filter(u => !u.flaggedForRemoval && (
        u.alive && u.faction != unit.faction
        || !u.alive
      ));

    if (possibleTargets.length) {
      return possibleTargets;
    } else {
      return [];
    }
  }
};
// Aura: Damages nearby enemy units and resurrects nearby corpses
export const goruAura = 'goruAura';
const goruAuraRadius = 200;
export function registerGoruEvents() {
  registerEvents(goruAura, {
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (globalThis.selectedUnitGraphics) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, goruAuraRadius, colors.manaBrightBlue, 'Death Aura');
      }
    },
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const livingUnits = underworld.getUnitsWithinDistanceOfTarget(unit, goruAuraRadius, prediction)
        .filter(u => !u.flaggedForRemoval);

      await new Promise((resolve) => setTimeout(resolve, 500));
      // https://github.com/jdoleary/Spellmasons/pull/641
      // Temp aura VFX for Goru - Needs improvement
      makeParticleExplosion(unit, goruAuraRadius / baseExplosionRadius, 0x002c6e, 0x59deff, prediction);

      livingUnits.filter(u => u.alive && u.faction != unit.faction).forEach(u => {
        Unit.takeDamage({
          unit: u,
          amount: unit.damage,
          sourceUnit: unit,
          fromVec2: unit,
        }, underworld, false);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
}

export default unit;
