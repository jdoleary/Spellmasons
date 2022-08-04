import { lavaDamage } from "./entity/Obstacle";
import { IUnit, takeDamage } from "./entity/Unit";
import { addMask, removeMask } from "./graphics/Image";
import type Underworld from "./Underworld";

export function add(unit: IUnit, underworld: Underworld, prediction: boolean) {
    unit.inLiquid = true;
    takeDamage(unit, lavaDamage, underworld, prediction);
    if (unit.image) {
        addMask(unit.image, 'liquid-mask');
    }
}
export function remove(unit: IUnit) {
    unit.inLiquid = false;
    if (unit.image) {
        removeMask(unit.image);
    }
}