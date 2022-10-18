import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'mana_burn';
const mana_burnt = 30;
const health_burn_ratio = .1;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    sfx: 'manaBurn',
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconManaBurn.png',
    animationPath: 'spell-effects/spellManaBurn',
    description: `
Burn up to ${mana_burnt} of the targets' mana and cause ${health_burn_ratio * 10} damage for every 10 mana burnt.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.mana > 0);
      // We only need to await one animation promise since they all trigger simultaneously
      let animationPromise = Promise.resolve();
      // Play the animation and sfx
      for (let unit of targets) {
        playDefaultSpellSFX(card, prediction);
        animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/spellManaBurn', { keyFrame: 12 });
      }
      await animationPromise;
      // Take damage and remove mana AFTER the animation and sfx has finished
      for (let unit of targets) {
        const unitManaBurnt = Math.min(unit.mana, mana_burnt);
        unit.mana -= unitManaBurnt;
        const damage = unitManaBurnt * health_burn_ratio
        Unit.takeDamage(unit, damage, unit, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
