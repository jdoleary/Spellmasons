
import type { UnitSource } from './index';
import * as colors from '../../graphics/ui/colors';
import * as freeze from '../../cards/freeze';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { Vec2 } from '../../jmath/Vec';
import { drawUICircle } from '../../graphics/PlanningView';
import { makeParticleExplosion } from '../../graphics/ParticleCollection';

export const urn_ice_id = 'Ice Urn'
const baseRadius = 140;
const unit: UnitSource = {
    id: urn_ice_id,
    info: {
        description: 'urn ice description',
        image: 'doodads/urn_ice',
        subtype: UnitSubType.DOODAD,
    },
    unitProps: {
        staminaMax: 0,
        attackRange: baseRadius,
        manaMax: 0,
        healthMax: 1,
        damage: 0,
    },
    spawnParams: {
        probability: 0,
        budgetCost: 0,
        unavailableUntilLevelIndex: 0,
        excludeMiniboss: true,
    },
    animations: {
        idle: 'doodads/urn_ice',
        hit: 'doodads/urn_ice',
        attack: 'doodads/urn_ice',
        die: 'doodads/urn_ice',
        walk: 'doodads/urn_ice',
    },
    sfx: {
        damage: '',
        death: ''
    },
    // Warning: init must be idempotent
    init: (unit: Unit.IUnit, underworld: Underworld) => {
        if (!unit.onDamageEvents.includes(urnIceExplode)) {
            unit.onDeathEvents.push(urnIceExplode);
        }
    },
    action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    },
    getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
        return [];
    }
};
export const urnIceExplode = 'urnIceExplode';
export function registerUrnIceExplode() {
    registerEvents(urnIceExplode, {
        onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
            explode(unit, unit.attackRange, 0, prediction, underworld);
            // Remove corpse
            if (!prediction) {
                Unit.cleanup(unit, false);
            }
        }
    });
}
function explode(location: Vec2, radius: number, damage: number, prediction: boolean, underworld: Underworld) {
    if (prediction) {
        drawUICircle(location, radius, colors.healthRed, 'Explosion Radius');
    } else {
        playSFXKey('bloatExplosion');
        playSFXKey('freeze');
    }
    makeParticleExplosion(location, radius / baseRadius, prediction, "#002c6e", "#59deff");
    underworld.getUnitsWithinDistanceOfTarget(
        location,
        radius,
        prediction
    ).filter(u => u.alive).forEach(u => {
        Unit.addModifier(u, freeze.id, underworld, prediction, 1);
    });
}

export default unit;
