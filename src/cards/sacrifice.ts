import { refundLastSpell, Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { addPixiSpriteAnimated } from '../graphics/PixiUtils';
import { manaBlue } from '../graphics/ui/colors';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { makeManaTrail } from '../graphics/Particles';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { explain, EXPLAIN_OVERFILL } from '../graphics/Explain';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { die } from '../entity/Unit';

export const consumeAllyCardId = 'Sacrifice';
const spell: Spell = {
  card: {
    id: consumeAllyCardId,
    category: CardCategory.Soul,
    sfx: '',
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSacrifice.png',
    description: `
Instantly kill an ally to gain their current health.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.health > 0);
      const caster = state.casterUnit;
      let promises = [];
      let totalHealthStolen = 0;
      for (let unit of targets) {
        const unitHealthStolen = unit.health;
        totalHealthStolen += unitHealthStolen;
        unit.health -= unitHealthStolen;
        const healthTrailPromises = [];
        if (!prediction) {
          const NUMBER_OF_ANIMATED_TRAILS = unitHealthStolen;
          for (let i = 0; i < quantity * NUMBER_OF_ANIMATED_TRAILS; i++) {
            healthTrailPromises.push(makeManaTrail(unit, caster, underworld, '#ff6767n', '#ff0000').then(() => {
              const healthStolenPerTrail = Math.floor(unitHealthStolen / NUMBER_OF_ANIMATED_TRAILS)
              state.casterUnit.health += healthStolenPerTrail;
              if (!prediction) {
                playDefaultSpellSFX(card, prediction);
                // Animate
                if (state.casterUnit.image) {
                  // Note: This uses the lower-level addPixiSpriteAnimated directly so that it can get a reference to the sprite
                  // and add a filter; however, addOneOffAnimation is the higher level and more common for adding a simple
                  // "one off" animated sprite.  Use it instead of addPixiSpriteAnimated unless you need more direct control like
                  // we do here
                  const animationSprite = addPixiSpriteAnimated('spell-effects/potionPickup', state.casterUnit.image.sprite, {
                    loop: false,
                    onComplete: () => {
                      if (animationSprite?.parent) {
                        animationSprite.parent.removeChild(animationSprite);
                      }
                    }
                  });
                  if (animationSprite) {

                    if (!animationSprite.filters) {
                      animationSprite.filters = [];
                    }
                  }
                }
                explain(EXPLAIN_OVERFILL);
              }
            })
            );
          }
        }
        die(unit, underworld, prediction);
        promises.push((prediction ? Promise.resolve() : Promise.all(healthTrailPromises)));
      }
      await Promise.all(promises);
      if (totalHealthStolen > 0) {
        if (!prediction) {
          floatingText({
            coords: caster,
            text: `+ ${totalHealthStolen} Health`,
            style: { fill: 'red', ...config.PIXI_TEXT_DROP_SHADOW }
          });
        }
      } else {
        refundLastSpell(state, prediction, 'No targets have health to steal\nMana cost refunded')
      }
      return state;
    },
  },
};
export default spell;
