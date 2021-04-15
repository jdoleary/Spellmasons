import * as math from './math';
import { UnitSubType } from './commonTypes';
interface Enemy {
  id: string;
  image: string;
  subtype: UnitSubType;
  probability: number;
}
export const enemySource = [
  {
    id: 'golem',
    image: 'images/units/golem.png',
    subtype: UnitSubType.AI_melee,
    probability: 100,
  },
  {
    id: 'golem-ranged',
    image: 'images/units/golem-blue.png',
    subtype: UnitSubType.AI_bishop,
    probability: 50,
  },
  {
    id: 'golem-rook',
    image: 'images/units/golem-red.png',
    subtype: UnitSubType.AI_rook,
    probability: 10,
  },
  {
    id: 'golem-reach',
    image: 'images/units/golem-sand.png',
    subtype: UnitSubType.AI_reach,
    probability: 30,
  },
  {
    id: 'golem-summoner',
    image: 'images/units/golem-summoner.png',
    subtype: UnitSubType.AI_summoner,
    probability: 30,
  },
  {
    id: 'demon',
    image: 'images/units/demon.png',
    subtype: UnitSubType.AI_demon,
    probability: 30,
  },
  {
    id: 'priest',
    image: 'images/units/priest.png',
    subtype: UnitSubType.AI_priest,
    probability: 30,
  },
  {
    id: 'poisoner',
    image: 'images/units/golem-poison.png',
    subtype: UnitSubType.AI_poisoner,
    probability: 30,
  },
];

const hardCodedLevelEnemies = [
  [0, 0, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 1, 1],
  [0, 0, 0, 1, 3],
  [0, 0, 0, 0, 3, 3, 4],
  [0, 1, 1, 1, 3, 3, 3, 2],
  [0, 0, 0, 0, 0, 0, 0, 4],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 5],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 5],
];

export function generateHardCodedLevelEnemies(level: number) {
  // 0 indexed level
  return hardCodedLevelEnemies[level - 1];
}

export function generateEnemy(): Enemy {
  return math.chooseObjectWithProbability(enemySource);
}
