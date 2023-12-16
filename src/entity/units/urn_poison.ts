
import type { UnitSource } from './index';
import * as colors from '../../graphics/ui/colors';
import * as poison from '../../cards/poison';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { Vec2 } from '../../jmath/Vec';
import { drawUICirclePrediction } from '../../graphics/PlanningView';
import { animateSpell } from '../../cards/cardUtils';
import { makeParticleExplosion } from '../../graphics/ParticleCollection';

export const urn_poison_id = 'Toxic Urn'
const baseRadius = 140;
const urnPoisonSource: UnitSource = {
    id: urn_poison_id,
    info: {
        description: 'urn poison description',
        image: 'doodads/urn_poison',
        subtype: UnitSubType.DOODAD,
    },
    unitProps: {
        damage: 0,
        attackRange: baseRadius,
        healthMax: 1,
        staminaMax: 0,
        manaMax: 0,
    },
    spawnParams: {
        probability: 0,
        budgetCost: 0,
        unavailableUntilLevelIndex: 0,
        excludeMiniboss: true,
    },
    animations: {
        idle: 'doodads/urn_poison',
        hit: 'doodads/urn_poison',
        attack: 'doodads/urn_poison',
        die: 'doodads/urn_poison',
        walk: 'doodads/urn_poison',
    },
    sfx: {
        damage: '',
        death: ''
    },
    // Warning: init must be idempotent
    init: (unit: Unit.IUnit, underworld: Underworld) => {
        if (!unit.onDamageEvents.includes(urnpoisonExplode)) {
            unit.onDeathEvents.push(urnpoisonExplode);
        }
    },
    action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    },
    getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
        return [];
    }
};
export const urnpoisonExplode = 'urnpoisonExplode';
export function registerUrnpoisonExplode() {
    registerEvents(urnpoisonExplode, {
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
        drawUICirclePrediction(location, radius, colors.healthRed, 'Explosion Radius');
    } else {
        playSFXKey('bloatExplosion');
        playSFXKey('poison');
    }
    makeParticleExplosion(location, radius / baseRadius, prediction, "#164a15", "#6bff77");
    underworld.getUnitsWithinDistanceOfTarget(
        location,
        radius,
        prediction
    ).filter(u => u.alive).forEach(u => {
        if (!prediction) {
            animateSpell(u, 'spell-effects/spellPoison');
        }
        Unit.addModifier(u, poison.poisonCardId, underworld, prediction, 1);
    });
}

export default urnPoisonSource;
