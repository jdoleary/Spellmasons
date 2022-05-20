import * as Image from './Image';
import * as PIXI from 'pixi.js';
import * as config from './config';
import { addPixiSprite, containerUnits } from './PixiUtils';
import type { Vec2 } from './Vec';
// TODO: need to sync timerelease??
export interface ITimeRelease {
    x: number;
    y: number;
    description: string;
    radius: number;
    image: Image.IImage;
    text: PIXI.Text;
    turnsLeft: number;
    onRelease: () => Promise<void>;
}

export function cleanup(t: ITimeRelease) {
    Image.cleanup(t.image);
    window.underworld.timeReleases = window.underworld.timeReleases.filter(x => x !== t);
}

export function create({ pos, description, imagePath, turnsLeft, onRelease }: { pos: Vec2, description: string, imagePath: string, turnsLeft: number, onRelease: () => Promise<void> }) {
    const t: ITimeRelease = {
        x: pos.x,
        y: pos.y,
        description,
        radius: config.COLLISION_MESH_RADIUS,
        image: Image.create(pos, imagePath, containerUnits),
        text: new PIXI.Text(`${turnsLeft}`, { fill: 'white', align: 'center' }),
        turnsLeft,
        onRelease
    }
    window.underworld.timeReleases.push(t);


    const timeCircle = addPixiSprite('time-circle.png', t.image.sprite);
    timeCircle.anchor.x = 0;
    timeCircle.anchor.y = 0;

    t.text.anchor.x = 0;
    t.text.anchor.y = 0;
    // Center the text in the timeCircle
    t.text.x = 8;
    t.image.sprite.addChild(t.text);
}