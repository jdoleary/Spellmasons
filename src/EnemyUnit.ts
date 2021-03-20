import * as math from './math';
import { UnitSubType } from './Unit';
interface Enemy {
  id: string;
  image: string;
  subtype: UnitSubType;
  probability: number;
}
const source = [
  {
    id: 'golem',
    image: 'images/units/golem.png',
    subtype: UnitSubType.AI_melee,
    probability: 100,
  },
  {
    id: 'golem-ranged',
    image: 'images/units/golem-blue.png',
    subtype: UnitSubType.AI_ranged,
    probability: 50,
  },
];

export function generateEnemy(): Enemy {
  return math.chooseObjectWithProbability(source);
}
