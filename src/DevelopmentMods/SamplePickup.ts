import type { IPickupSource } from "../entity/Pickup";
import type { Mod } from "../types/commonTypes";

console.log('jtest api', globalThis.SpellmasonsAPI)
const {
    config,
    PixiUtils,
    Unit,
} = globalThis.SpellmasonsAPI;
const { addPixiSpriteAnimated, containerUnits } = PixiUtils;

const damage = 80;
const samplePickup: IPickupSource = {
    imagePath: 'pickups/trap',
    animationSpeed: -config.DEFAULT_ANIMATION_SPEED,
    playerOnly: false,
    name: 'Sample Pickup',
    probability: 70,
    scale: 1.5,
    description: () => [`A huge trap that does ${damage} damage.`],
    willTrigger: ({ unit }) => {
        return !!unit;
    },
    effect: ({ unit, pickup, prediction, underworld }) => {
        if (unit) {
            // Play trap spring animation
            if (!prediction) {
                const animationSprite = addPixiSpriteAnimated('pickups/trapAttack', containerUnits, {
                    loop: false,
                    animationSpeed: 0.2,
                    onComplete: () => {
                        if (animationSprite?.parent) {
                            animationSprite.parent.removeChild(animationSprite);
                        }
                    }
                });
                if (animationSprite) {

                    animationSprite.anchor.set(0.5);
                    animationSprite.x = pickup.x;
                    animationSprite.y = pickup.y;
                }
                const animationSprite2 = addPixiSpriteAnimated('pickups/trapAttackMagic', containerUnits, {
                    loop: false,
                    animationSpeed: 0.2,
                    onComplete: () => {
                        if (animationSprite2?.parent) {
                            animationSprite2.parent.removeChild(animationSprite2);
                        }
                    }
                });
                if (animationSprite2) {
                    animationSprite2.anchor.set(0.5);
                    animationSprite2.x = pickup.x;
                    animationSprite2.y = pickup.y;
                }

            }
            Unit.takeDamage({ unit, amount: damage, fromVec2: unit }, underworld, prediction);
        }
    }
};

const mod: Mod = {
    modName: 'Sample Pickup',
    author: 'Jordan O\'Leary',
    description: "A sample mod for making a modded pickup",
    screenshot: 'TODO',
    units: [],
    pickups: [
        samplePickup
    ],
    sfx: {},
};
export default mod;