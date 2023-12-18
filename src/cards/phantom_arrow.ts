import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as math from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { makeArrowEffect, ArrowProps } from './arrow';

export const phantomArrowCardId = 'Phantom Arrow';
const arrowProps: ArrowProps = {
  damage: 30,
  pierce: 99,
  arrowCount: 1
}

const spell: Spell = {
  card: {
    id: phantomArrowCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowRed.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'phantomArrow',
    description: ['spell_phantom_arrow', arrowProps.damage.toString()],
    effect: makeArrowEffect(arrowProps)
  }
};
export default spell;