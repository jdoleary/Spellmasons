
import type { UnitSource } from './index';
import * as colors from '../../graphics/ui/colors';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { Vec2 } from '../../jmath/Vec';
import { drawUICirclePrediction } from '../../graphics/PlanningView';
import { makeParticleExplosion } from '../../graphics/ParticleCollection';
import { forcePush, velocityStartMagnitude } from '../../cards/push';

export const urn_explosive_id = 'Explosive Urn'
const baseRadius = 140;
const damage = 80;
const unit: UnitSource = {
    id: urn_explosive_id,
    info: {
        description: 'urn explosive description',
        image: 'doodads/urn_explosive',
        subtype: UnitSubType.DOODAD,
    },
    unitProps: {
        staminaMax: 0,
        attackRange: baseRadius,
        manaMax: 0,
        healthMax: 1,
        damage,
    },
    spawnParams: {
        probability: 0,
        budgetCost: 0,
        unavailableUntilLevelIndex: 0,
        excludeMiniboss: true,
    },
    animations: {
        idle: 'doodads/urn_explosive',
        hit: 'doodads/urn_explosive',
        attack: 'doodads/urn_explosive',
        die: 'doodads/urn_explosive',
        walk: 'doodads/urn_explosive',
    },
    sfx: {
        damage: '',
        death: ''
    },
    // Warning: init must be idempotent
    init: (unit: Unit.IUnit, underworld: Underworld) => {
        if (!unit.onDamageEvents.includes(urnexplosiveExplode)) {
            unit.onDeathEvents.push(urnexplosiveExplode);
        }
    },
    action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    },
    getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
        return [];
    }
};
export const urnexplosiveExplode = 'urnexplosiveExplode';
export function registerUrnexplosiveExplode() {
    registerEvents(urnexplosiveExplode, {
        onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
            explode(unit, unit.attackRange, unit.damage, prediction, underworld);
            // Remove corpse
            if (!prediction) {
                Unit.cleanup(unit, false);
            }
        }
    });
}

function explode(location: Vec2, radius: number, damage: number, prediction: boolean, underworld: Underworld) {
    if (prediction) {
        drawUICirclePrediction(location, radius, colors.healthRed, 'Explosion Radius');
    } else {
        playSFXKey('bloatExplosion');
    }
    makeParticleExplosion(location, radius / baseRadius, prediction, "#d66437", "#f5e8b6");
    underworld.getUnitsWithinDistanceOfTarget(
        location,
        radius,
        prediction
    ).forEach(u => {
        // Deal damage to units
        Unit.takeDamage(u, damage, u, underworld, prediction);
        // Push units away from exploding location
        forcePush(u, location, velocityStartMagnitude, underworld, prediction);
    });
    underworld.getPickupsWithinDistanceOfTarget(
        location,
        radius,
        prediction
    ).forEach(p => {
        // Push pickups away
        forcePush(p, location, velocityStartMagnitude, underworld, prediction);
    })
}

export default unit;