import * as Image from './Image';
import * as PIXI from 'pixi.js';
import * as config from './config';
import { addPixiSprite, containerUnits } from './PixiUtils';
export interface ITimeRelease {
    // A unique id so that units can be identified
    // across the network
    id: number;
    x: number;
    y: number;
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

export function create() {
    const turnsLeft = 2;
    const t: ITimeRelease = {
        id: 1,
        x: 64,
        y: 64,
        radius: config.COLLISION_MESH_RADIUS,
        image: Image.create({ x: 64, y: 64, }, 'time-crystal.png', containerUnits),
        text: new PIXI.Text(`${turnsLeft}`, { fill: 'white', align: 'center' }),
        turnsLeft,
        onRelease: async () => {
            window.underworld.spawnEnemy('demon', { x: 64, y: 64 }, false, 1)
        }
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