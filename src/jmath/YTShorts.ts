import { GlowFilter } from '@pixi/filter-glow';
import { IUnit } from '../entity/Unit';
import { easeOutCubic, tween } from './Easing';
export async function glow(unit: IUnit) {
    const glowFilter = new GlowFilter({ color: 0xff0000 })
    // @ts-ignore Something is wrong with PIXI's filter types
    unit.image.sprite.filters.push(glowFilter);
    glowFilter.outerStrength = 0;
    const speed = 350;
    await tween({
        object: glowFilter,
        key: 'outerStrength',
        from: 0,
        to: 5,
        duration: speed,
        easingFn: easeOutCubic
    });
    await tween({
        object: glowFilter,
        key: 'outerStrength',
        from: 5,
        to: 0,
        duration: speed,
        easingFn: easeOutCubic
    });

}