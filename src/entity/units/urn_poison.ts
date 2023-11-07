
import type { UnitSource } from './index';
import * as particles from '@pixi/particle-emitter'
import * as colors from '../../graphics/ui/colors';
import * as poison from '../../cards/poison';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../../graphics/Particles';
import { Vec2 } from '../../jmath/Vec';
import { drawUICircle } from '../../graphics/PlanningView';
import { animateSpell } from '../../cards/cardUtils';

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
            Unit.cleanup(unit, true);
        }
    });
}
function explode(location: Vec2, radius: number, damage: number, prediction: boolean, underworld: Underworld) {
    if (prediction) {
        drawUICircle(location, radius, colors.healthRed, 'Explosion Radius');
    } else {
        playSFXKey('bloatExplosion');
        playSFXKey('poison');
    }
    makepoisonParticleExplosion(location, radius / baseRadius, prediction);
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
function makepoisonParticleExplosion(position: Vec2, size: number, prediction: boolean) {
    if (prediction || globalThis.headless) {
        // Don't show if just a prediction
        return;
    }
    const texture = createParticleTexture();
    if (!texture) {
        logNoTextureWarning('makepoisonParticleExplosion');
        return;
    }
    const config =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 3,
                "end": 2,
            },
            "color": {
                "start": "#164a15",
                "end": "#6bff77"
            },
            "speed": {
                "start": 300,
                "end": 50,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": 0
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 0,
                "max": 360
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 300
            },
            "lifetime": {
                "min": 0.8 * size,
                "max": 0.8 * size
            },
            "blendMode": "normal",
            "frequency": 0.0001,
            "emitterLifetime": 0.1,
            "maxParticles": 2000,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": true,
            "spawnType": "circle",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 0
            }
        }, [texture]);
    simpleEmitter(position, config);
}

export default urnPoisonSource;
