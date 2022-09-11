import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { explainManaOverfill } from '../graphics/Jprompt';
import { addPixiSpriteAnimated } from '../graphics/PixiUtils';
import { manaBlue } from '../graphics/ui/colors';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { makeManaTrail } from '../graphics/Particles';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';

const id = 'mana_steal';
const mana_stolen = 20;
const health_burn = 3;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    sfx: 'manaSteal',
    supportQuantity: true,
    manaCost: 0,
    healthCost: health_burn,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'spellIconManaSteal.png',
    description: `
Sacrifice some of own health to steal up to ${mana_stolen} mana from each target.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      const caster = state.casterUnit;
      let promises = [];
      for (let unit of targets) {
        const unitManaStolen = Math.min(unit.mana, mana_stolen * quantity);
        unit.mana -= unitManaStolen;
        const manaTrailPromises = [];
        if (!prediction) {
          for (let i = 0; i < quantity * 3; i++) {
            manaTrailPromises.push(makeManaTrail(unit, caster));
          }
        }
        promises.push((prediction ? Promise.resolve() : Promise.all(manaTrailPromises)).then(() => {
          state.casterUnit.mana += unitManaStolen;
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
                // Change the health color to blue
                animationSprite.filters.push(
                  // @ts-ignore for some reason ts is flagging this as an error but it works fine
                  // in pixi.
                  new MultiColorReplaceFilter(
                    [
                      [0xff0000, manaBlue],
                    ],
                    0.1
                  )
                );
              }
            }
            explainManaOverfill();
            floatingText({
              coords: caster,
              text: `+ ${unitManaStolen} Mana`,
              style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW }
            })
          }
        }));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
