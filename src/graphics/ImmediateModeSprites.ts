import type * as PIXI from 'pixi.js';
import { addPixiSprite, containerUI } from './PixiUtils';
import type { Vec2 } from '../mathematics/Vec';
// Immediate Mode "draws" a sprite once per loop.
// It will automatically create and store more sprites if there are not enough of spriteName to 
// fullfill the draw request
export function draw(spriteName: string, position: Vec2, scale: number = 1.0) {
    let entry = registry[spriteName]
    if (!entry) {
        entry = {
            sprites: [],
            lastIndexDrawn: -1
        }
        registry[spriteName] = entry;
    }
    let sprite = entry.sprites[++entry.lastIndexDrawn];
    if (!sprite) {
        sprite = addPixiSprite(spriteName, containerUI);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        entry.sprites.push(sprite);
    }
    sprite.scale.x = scale;
    sprite.scale.y = scale;
    sprite.x = position.x;
    sprite.y = position.y;
}
interface Registry {
    [spriteName: string]: {
        sprites: PIXI.Sprite[],
        lastIndexDrawn: number
    }
}
const registry: Registry = {}
export function loop() {
    for (let key of Object.keys(registry)) {
        const entry = registry[key]
        if (entry) {
            // Clear positions of all sprites so they don't draw again
            entry.sprites.forEach(s => {
                s.x = NaN;
                s.y = NaN;
            });
            entry.lastIndexDrawn = -1;
        }
    }

}
