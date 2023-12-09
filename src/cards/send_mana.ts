import * as Unit from '../entity/Unit';
import floatingText from '../graphics/FloatingText';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeManaTrail } from '../graphics/Particles';
import { addPixiSpriteAnimated } from '../graphics/PixiUtils';
import { manaBlue } from '../graphics/ui/colors';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as config from '../config';
import { explain, EXPLAIN_OVERFILL } from '../graphics/Explain';

export const id = 'send_mana';
const amount = 20;

const spell: Spell = {
  card: {
    id: id,
    category: CardCategory.Mana,
    sfx: 'potionPickupMana',
    supportQuantity: true,
    manaCost: amount,
    healthCost: 0,
    expenseScaling: 0,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconSendMana.png',
    animationPath: 'spell-effects/potionPickup',
    description: ['spell_send_mana', amount.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      let promises = [];
      for (let unit of targets) {
        const manaTrailPromises = [];
        if (!prediction) {
          manaTrailPromises.push(
            makeManaTrail(
              state.casterUnit,
              unit,
              underworld,
              '#e4f9ff',
              '#3fcbff',
            ),
          );
        }
        promises.push(
          prediction ? Promise.resolve() : Promise.all(manaTrailPromises),
        );
      }
      await Promise.all(promises).then(() => {
        const finalManaSent = Math.floor((amount * quantity) / targets.length);
        for (let unit of targets) {
          unit.mana += finalManaSent;
        }
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          // Animate
          for (let unit of targets) {
            if (unit.image) {
              // Note: This uses the lower-level addPixiSpriteAnimated directly so that it can get a reference to the sprite
              // and add a filter; however, addOneOffAnimation is the higher level and more common for adding a simple
              // "one off" animated sprite.  Use it instead of addPixiSpriteAnimated unless you need more direct control like
              // we do here
              const animationSprite = addPixiSpriteAnimated(
                'spell-effects/potionPickup',
                unit.image.sprite,
                {
                  loop: false,
                  onComplete: () => {
                    if (animationSprite?.parent) {
                      animationSprite.parent.removeChild(animationSprite);
                    }
                  },
                },
              );
              if (animationSprite) {
                if (!animationSprite.filters) {
                  animationSprite.filters = [];
                }
                // Change the health color to blue
                animationSprite.filters.push(
                  new MultiColorReplaceFilter([[0xff0000, manaBlue]], 0.1),
                );
              }
            }

            floatingText({
              coords: unit,
              text: `+ ${finalManaSent} Mana`,
              style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW },
            });
          }
          explain(EXPLAIN_OVERFILL);
        }
      });
      //refund if no targets ?
      return state;
    },
  },
};
export default spell;
