import type { Coords } from './commonTypes';
import {
  OVERWORLD_HEIGHT,
  OVERWORLD_MAX_WIDTH,
  OVERWORLD_SPACING,
} from './config';
import { overworldGraphics } from './PixiUtils';

export interface ILevel {
  location: Coords;
  altitude: number;
  enemies: number[];
}
export interface IOverworld {
  levels: ILevel[];
}
const hardCodedLevelEnemies = [
  [0, 4],
  [0, 0, 0, 6],
  [0, 0, 0, 1, 7],
  [0, 0, 1, 1, 1],
  [0, 0, 0, 1, 3, 6],
  [0, 0, 0, 0, 3, 3, 4],
  [0, 1, 1, 1, 3, 3, 3, 2],
  [0, 0, 0, 0, 0, 0, 0, 4],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 5, 6],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 5],
];
export function getEnemiesForAltitude(altitude: number) {
  return hardCodedLevelEnemies[
    Math.min(altitude, hardCodedLevelEnemies.length - 1)
  ];
}
export function voteForLevel(clientId: string, levelIndex: number) {
  console.log('voteForLevel', clientId, levelIndex);
  chooseLevel(window.overworld.levels[levelIndex]);
}
function chooseLevel(level: ILevel) {
  window.game.moveToNextLevel(level);
}
export function generate(): IOverworld {
  const o: IOverworld = {
    levels: [],
  };
  // Generate diamond shape of locations
  for (let y = 0; y < OVERWORLD_HEIGHT; y++) {
    let enemies = [1];
    for (let x = 0; x < Math.min(y, OVERWORLD_MAX_WIDTH); x++) {
      o.levels.push({
        location: { x: x * OVERWORLD_SPACING, y: -y * OVERWORLD_SPACING },
        enemies,
        altitude: y,
      });
    }
    for (let x = -1; x > -Math.min(y, OVERWORLD_MAX_WIDTH); x--) {
      o.levels.push({
        location: { x: x * OVERWORLD_SPACING, y: -y * OVERWORLD_SPACING },
        enemies,
        altitude: y,
      });
    }
  }
  return o;
}
export function draw(o: IOverworld) {
  overworldGraphics.clear();
  for (let l of o.levels) {
    overworldGraphics.beginFill(0xffff0b, 0.5);
    overworldGraphics.lineStyle(3, 0x33ff00);
    overworldGraphics.drawCircle(l.location.x, l.location.y, 10);
    overworldGraphics.endFill();
  }
}
