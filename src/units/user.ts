import type * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';

const unit: UnitSource = {
  id: 'user',
  info: {
    description: '',
    image: 'images/units/man-blue.png',
    subtype: UnitSubType.PLAYER_CONTROLLED,
    probability: 0,
  },
  action: (unit: Unit.IUnit) => {},
};
export default unit;
