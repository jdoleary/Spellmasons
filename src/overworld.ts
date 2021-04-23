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
  votes: { [clientId: string]: number };
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
  const votes = window.overworld.votes;
  votes[clientId] = levelIndex;
  // Redraw overworld:
  draw(window.overworld);
  // If all players have voted:
  if (Object.keys(votes).length == window.game.players.length) {
    // Tally votes:
    const tally = Object.entries(votes).reduce<{
      [levelIndex: number]: number;
    }>((tally, [clientId, levelIndex]) => {
      if (!tally[levelIndex]) {
        tally[levelIndex] = 0;
      }
      tally[levelIndex]++;
      return tally;
    }, {});
    const levelWithMostVotes = Object.entries(tally).reduce<{
      levelIndex: string;
      votes: number;
    }>(
      (mostVotes, [index, votes]) => {
        if (votes > mostVotes.votes) {
          return { levelIndex: index, votes };
        }
        return mostVotes;
      },
      { levelIndex: '0', votes: 0 },
    );
    chooseLevel(
      window.overworld.levels[parseInt(levelWithMostVotes.levelIndex, 10)],
    );
  }
}
function chooseLevel(level: ILevel) {
  window.game.moveToNextLevel(level);
  // reset votes
  window.overworld.votes = {};
}
export function generate(): IOverworld {
  const o: IOverworld = {
    levels: [],
    votes: {},
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
  for (let i = 0; i < o.levels.length; i++) {
    const l = o.levels[i];
    overworldGraphics.beginFill(0xffff0b, 0.5);
    overworldGraphics.lineStyle(3, 0x33ff00);
    const { x, y } = l.location;
    overworldGraphics.drawCircle(x, y, 10);
    overworldGraphics.endFill();
    // Draw votes
    const votesForThisLevel = Object.values(o.votes).reduce(
      (total, levelIndex) => {
        return total + (levelIndex === i ? 1 : 0);
      },
      0,
    );
    overworldGraphics.lineStyle(1, 0xff0000);
    // Draw tick marks for each vote
    for (let v = 0; v < votesForThisLevel; v++) {
      overworldGraphics.drawRect(x + 3 * v, y - 10, 1, 20);
    }
  }
}
