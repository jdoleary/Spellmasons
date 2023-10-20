
import type { UnitSource } from './index';
import * as particles from '@pixi/particle-emitter'
import * as colors from '../../graphics/ui/colors';
import * as freeze from '../../cards/freeze';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { registerEvents } from '../../cards';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../../graphics/Particles';
import { Vec2 } from '../../jmath/Vec';
import { drawUICircle } from '../../graphics/PlanningView';

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
    init: (unit: Unit.IUnit, underworld: Underworld) => {
        unit.onDeathEvents.push('urnIceExplode');
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
            // Note: This must be called after all other explode logic or else it will affect the position
            // of the explosion
            Unit.cleanup(unit);
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
    makeIceParticleExplosion(location, radius / baseRadius, prediction);
    underworld.getUnitsWithinDistanceOfTarget(
        location,
        radius,
        prediction
    ).filter(u => u.alive).forEach(u => {
        Unit.addModifier(u, freeze.id, underworld, prediction, 1);
    });
}
function makeIceParticleExplosion(position: Vec2, size: number, prediction: boolean) {
    if (prediction || globalThis.headless) {
        // Don't show if just a prediction
        return;
    }
    const texture = createParticleTexture();
    if (!texture) {
        logNoTextureWarning('makeIceParticleExplosion');
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
                "start": "#002c6e",
                "end": "#59deff"
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

export default unit;
