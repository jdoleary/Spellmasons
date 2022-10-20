import { lavaDamage } from "./entity/Obstacle";
import { HasSpace } from "./entity/Type";
import { isUnit, takeDamage } from "./entity/Unit";
import { addMask, removeMask } from "./graphics/Image";
import type Underworld from "./Underworld";

export const LIQUID_MASK = 'liquid-mask';
export function add(entity: HasSpace, underworld: Underworld, prediction: boolean) {
    // Can't set inLiquid if they are already in liquid
    if (!entity.inLiquid) {
        entity.inLiquid = true;
        if (isUnit(entity)) {
            takeDamage(entity, lavaDamage, undefined, underworld, prediction);
        }
        if (entity.image) {
            addMask(entity.image, LIQUID_MASK);
        }
        if (!prediction) {
            playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
        }
    }
}
export function remove(entity: HasSpace) {
    entity.inLiquid = false;
    if (entity.image) {
        removeMask(entity.image);
    }
}