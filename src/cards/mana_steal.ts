import type { Spell } from '.';
import floatingText from '../graphics/FloatingText';
import { explainManaOverfill } from '../graphics/Jprompt';
import { addPixiSpriteAnimated } from '../graphics/PixiUtils';
import { manaBlue } from '../graphics/ui/colors';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { makeManaTrail } from '../graphics/Particles';

const id = 'mana_steal';
const mana_stolen = 20;
const health_burn = 3;
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: health_burn,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'mana_steal.png',
    description: `
Sacrifice some of own health to steal up to ${mana_stolen} mana from each target.
    `,
    effect: async (state, prediction) => {
      const caster = state.casterUnit;
      let promises = [];
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_stolen);
        unit.mana -= unitManaBurnt;
        promises.push((prediction ? Promise.resolve() : Promise.all([
          makeManaTrail(unit, caster),
          makeManaTrail(unit, caster),
          makeManaTrail(unit, caster)
        ])).then(() => {
          state.casterUnit.mana += unitManaBurnt;
          if (!prediction) {
            // Animate
            if (state.casterUnit.image) {
              const animationSprite = addPixiSpriteAnimated('spell-effects/potionPickup', state.casterUnit.image.sprite, {
                loop: false,
                onComplete: () => {
                  if (animationSprite.parent) {
                    animationSprite.parent.removeChild(animationSprite);
                  }
                }
              });
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
            explainManaOverfill();
            floatingText({
              coords: caster,
              text: `+ ${unitManaBurnt} Mana`,
              style: { fill: 'blue' }
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
