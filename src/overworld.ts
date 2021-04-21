import type { Coords } from './commonTypes';
import {
  OVERWORLD_HEIGHT,
  OVERWORLD_MAX_WIDTH,
  OVERWORLD_SPACING,
} from './config';
import { overworldGraphics } from './PixiUtils';

export interface IOverworld {
  locations: Coords[];
}
export function generate(): IOverworld {
  const o: IOverworld = {
    locations: [],
  };
  // Generate diamond shape of locations
  for (let y = 0; y < OVERWORLD_HEIGHT; y++) {
    for (let x = 0; x < Math.min(y, OVERWORLD_MAX_WIDTH); x++) {
      o.locations.push({ x: x * OVERWORLD_SPACING, y: -y * OVERWORLD_SPACING });
    }
    for (let x = -1; x > -Math.min(y, OVERWORLD_MAX_WIDTH); x--) {
      o.locations.push({ x: x * OVERWORLD_SPACING, y: -y * OVERWORLD_SPACING });
    }
  }
  return o;
}
export function draw(o: IOverworld) {
  overworldGraphics.clear();
  for (let l of o.locations) {
    overworldGraphics.beginFill(0xffff0b, 0.5);
    overworldGraphics.lineStyle(3, 0x33ff00);
    overworldGraphics.drawCircle(l.x, l.y, 10);
    overworldGraphics.endFill();
  }
}
