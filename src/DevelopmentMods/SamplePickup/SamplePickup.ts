import { healUnit } from "../../effects/heal";
import type { IPickupSource } from "../../entity/Pickup";
import type { Mod } from "../../types/commonTypes";

const {
    MultiColorReplaceFilter
} = globalThis.SpellmasonsAPI;

const percentHeal = 0.5;
const samplePickup: IPickupSource = {
    // The name of the animation in the sprite sheet
    imagePath: 'pickups/healthPotion',
    // How fast the animation cycles its frames
    animationSpeed: 0.2,
    name: 'Sample Pickup',
    // The relative probability that this pickup will spawn
    probability: 80,
    // How big the pickup is
    scale: 1.0,
    // If the pickup will only trigger when player units step on them
    playerOnly: true,
    // The description must be in an array for localization reasons
    description: pickup => [`Heals the Player for ${percentHeal * 100}% of their stamina.`],
    // The init function is invoked once when the pickup is created.
    // In this case we're using MultiColorReplaceFilter to change the appearance
    // of the potion so it looks unique.
    init: ({ pickup, underworld }) => {
        // We have to check first if the pickup has an `image` property because
        // the server doesn't render any code and none of the pickups or units
        // have animated images attacheck
        if (pickup.image) {
            pickup.image.sprite.filters = [
                new MultiColorReplaceFilter(
                    [
                        [0x9a2626, 0xa69feb], // Medium Red
                        [0x741313, 0xa6ffeb], // Dark Red
                        [0xff8383, 0xaaffaa], // Light Shine
                        [0xff3232, 0xaaffaa], // Dark Shine
                    ],
                    0.3
                )
            ]
        }

    },
    // If this function returns true it will trigger the pickup
    // for the unit that collided with it.  See also `playerOnly` above
    willTrigger: ({ unit, player, pickup, underworld }) => {
        // Only trigger the health potion if the player will be affected by the health potion
        // Normally that's when they have less than full health, but there's an exception where
        // players that have blood curse will be damaged by healing so it should trigger for them too
        return !!(player && (player.unit.health < player.unit.healthMax));
    },
    // This is what the pickup does when it triggers on a unit
    effect: ({ unit, player, pickup, underworld, prediction }) => {
        if (unit) {
            // It is important not to play sound effects when the game is "predicting" what will happen.
            // Any SFX or VFX should check first if it is `!prediction`
            if (!prediction) {
                playSFXKey('potionPickupHealth');
            }
            // The actual data effect of the potion: The unit gets healed.
            // We pass `prediction` into this function so that game can calculate if this is something that will 
            // happen (like if we're pulling a potion to us) or if it actually happened.
            healUnit(unit, Math.round((unit.stamina * percentHeal)) * pickup.power, undefined, underworld, prediction);
        }
    },
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