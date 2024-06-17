import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const manaBurnCardId = 'mana_burn';
// How much mana is burnt, based on player's spell damage
const spellDamageMult = 1.5;
const health_burn_ratio = 1;
const spell: Spell = {
  card: {
    id: manaBurnCardId,
    category: CardCategory.Mana,
    sfx: 'manaBurn',
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconManaBurn.png',
    animationPath: 'spell-effects/spellManaBurn',
    description: ['spell_mana_burn', Unit.GetSpellDamage(undefined, spellDamageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.mana > 0);
      // We only need to await one animation promise since they all trigger simultaneously
      let animationPromise = Promise.resolve();
      // Play the animation and sfx
      for (let unit of targets) {
        playDefaultSpellSFX(card, prediction);
        animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/spellManaBurn', { keyFrame: 6 });
      }
      await animationPromise;
      // Take damage and remove mana AFTER the animation and sfx has finished
      for (let unit of targets) {
        const unitManaBurnt = Math.min(unit.mana, Unit.GetSpellDamage(state.casterUnit.damage, spellDamageMult));
        unit.mana -= unitManaBurnt;
        const damage = Math.ceil(unitManaBurnt * health_burn_ratio);
        Unit.takeDamage({
          unit: unit,
          amount: damage,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit,
        }, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
