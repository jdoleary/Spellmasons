import * as Image from '../Image';
import type { Spell } from '.';
import { containerSpells } from '../PixiUtils';

const id = 'area_of_effect';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/aoe.png',
    probability: 10,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      const animationPromises = [];
      for (let target of state.targets) {
        const withinRadius = window.game.getCoordsWithinDistanceOfTarget(
          target.x,
          target.y,
          1,
        );
        updatedTargets = updatedTargets.concat(withinRadius);
        // Animate in new targets:
        for (let target of withinRadius) {
          const image = Image.create(
            target.x,
            target.y,
            'images/spell/target.png',
            containerSpells,
          );
          if (!dryRun) {
            image.sprite.scale.set(0.0);
            animationPromises.push(
              Image.scale(image, 1.0).then(() => {
                Image.cleanup(image);
              }),
            );
          }
        }
      }
      await Promise.all(animationPromises);
      // deduplicate
      updatedTargets = updatedTargets.filter((coord, index) => {
        return (
          updatedTargets.findIndex(
            (findCoords) => findCoords.x == coord.x && findCoords.y === coord.y,
          ) === index
        );
      });

      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
