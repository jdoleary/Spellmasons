/// <reference path="../../globalTypes.d.ts" />
const {
  commonTypes,
  Unit,
  colors,
  math,
  config,
  Vec,
  cards,
  PixiUtils,
  moveWithCollision,
  modifierSummonerSickness,
  JImage,
  FloatingText
} = globalThis.SpellmasonsAPI
const {clone} = Vec;
const {CardCategory, CardRarity, probabilityMap} = commonTypes;
const { getCurrentTargets } = cards;
const { containerProjectiles } = PixiUtils;
const { makeForceMoveProjectile } = moveWithCollision;
const { summoningSicknessId } = modifierSummonerSickness;
const floatingText = FloatingText.default;
import type { Vec2 } from '../../types/jmath/Vec';
import type { HasSpace } from '../../types/entity/Type';
import type Image from '../../types/graphics/Image'
import type { Spell } from '../../types/cards';
import type { Modifier } from '../../types/cards/util';
import type Underworld from '../../types/Underworld';

export const bloodArrowCardId = 'Bloodied Arrow';
const damage = 10;
interface CurseData {
  modId: string,
  modifier: Modifier
}
const corpseDecayId = 'Corpse Decay';
const spell: Spell = {
  card: {
    id: bloodArrowCardId,
    category: CardCategory.Curses,
    probability: probabilityMap[CardRarity.UNCOMMON],
    manaCost: 0,
    healthCost: 10,
    expenseScaling: 1,
    supportQuantity: true,
    ignoreRange: true,
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    // This ensures that "target scamming" doesn't work with target arrow
    // due to it being able to fire out of range
    noInitialTarget: true,
    requiresFollowingCard: false,
    animationPath: '',
    sfx: '',
    thumbnail: 'spellmasons-mods/The_Doom_Scroll/graphics/spellIconBloodArrow.png',
    description: 'Conjures a corrupted arrow that deals 10 damage and spreads curses from the caster to enemies. Cannot apply more stacks of a curse than the caster has.',
    effect: async (state, card, quantity, underworld, prediction) => {
      const initialCastLocation = state.castLocation;
      // - - - - - Start copied from arrow.ts - - - - -
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      let timeoutToNextArrow = 200;
      for (let i = 0; i < quantity; i++) {
      for (let target of targets) {
        let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;

        const startPoint = casterPositionAtTimeOfCast;
        const velocity = math.similarTriangles(target.x - startPoint.x, target.y - casterPositionAtTimeOfCast.y, math.distance(startPoint, target), config.ARROW_PROJECTILE_SPEED)
        let image: Image.IImageAnimated | undefined;
        if (!prediction) {
          image = JImage.create(casterPositionAtTimeOfCast, 'arrow', containerProjectiles)
          if (image) {
            image.sprite.rotation = Math.atan2(velocity.y, velocity.x);
          }
        }
        const pushedObject: HasSpace = {
          x: casterPositionAtTimeOfCast.x,
          y: casterPositionAtTimeOfCast.y,
          radius: 1,
          inLiquid: false,
          image,
          immovable: false,
          beingPushed: false,
          debugName: 'blood arrow'
        }
        makeForceMoveProjectile({
          sourceUnit: state.casterUnit,
          pushedObject,
          startPoint,
          velocity,
          piercesRemaining: state.aggregator.additionalPierce,
          bouncesRemaining: state.aggregator.additionalBounce,
          collidingUnitIds: [state.casterUnit.id],
          collideFnKey: bloodArrowCardId,
          state,
        }, underworld, prediction);

        if (!prediction && !globalThis.headless) {
          const timeout = Math.max(0, timeoutToNextArrow);
          await new Promise(resolve => setTimeout(resolve, timeout));
          // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
          timeoutToNextArrow -= 5;
        }
      }
    }

      await underworld.awaitForceMoves();
      // - - - - - End copied from arrow.ts - - - - -

      // Update targets variable to include newly added targets
      //targets = getCurrentTargets(state);
      // To allow combos like [Target Arrow + Teleport], we set castLocation at wall collision
      // but we should only do this if no other targets (units or pickups) are added.
      // This ensures combos like [Ricochet Arrow + Target Cone] behave predictably
      //state.castLocation = targets.length ? initialCastLocation : state.castLocation;

      if (!prediction && !globalThis.headless && globalThis.predictionGraphicsGreen) {
        const promises: Promise<void>[] = [];
        targets.forEach(t => {
          // Animations do not occur on headless
          promises.push(new Promise<void>((resolve) => {
            if (globalThis.predictionGraphicsGreen) {
              globalThis.predictionGraphicsGreen.lineStyle(2, 0xffffff, 1.0)
              globalThis.predictionGraphicsGreen.drawCircle(t.x, t.y, config.COLLISION_MESH_RADIUS);
              // Show the targeting circle for a moment
              setTimeout(resolve, 300);
            }
          }));
        });
        await Promise.all(promises);
        globalThis.predictionGraphicsGreen.clear();
      }
      return state;
    },
  },
  events: {
    onProjectileCollision: ({ unit, pickup, underworld, projectile, prediction }) => {
      if (projectile.state && projectile.sourceUnit) {
        if (unit) {
            Unit.takeDamage({
                      unit: unit,
                      amount: damage,
                      sourceUnit: projectile.sourceUnit,
                      fromVec2: projectile.startPoint,
                      thinBloodLine: true,
                    }, underworld, prediction);
            const modifiersToExclude = [summoningSicknessId, corpseDecayId]
              const curses: CurseData[] = Object.entries(projectile.sourceUnit.modifiers)
                .map(([id, mod]) => ({ modId: id, modifier: mod }))
                .filter(x => x.modifier.isCurse)
                .filter(x => !modifiersToExclude.includes(x.modId));
            for (let curse of curses) {
                  let animationPromise = Promise.resolve();
                  let curseAmount = curse.modifier.quantity;
                  let unitCurseAmount = unit.modifiers[curse.modId]?.quantity || 0;
                  if (unitCurseAmount > curseAmount) {
                    continue;
                  } else if (unitCurseAmount < curseAmount) {
                    // If the unit has less than the curse amount, we can apply it
                    let quantityToAdd = curseAmount - unitCurseAmount;
                    animationPromise.then(() => {
                    if (!prediction) {
                      floatingText({ coords: unit, text: curse.modId });
                    }
                    if (unit.alive) {
                      const existingQuantity = unit.modifiers[curse.modId]?.quantity as number;
                      Unit.addModifier(unit, curse.modId, underworld, prediction, quantityToAdd, curse.modifier);
                    }
                  });
                  }
                  // Spread the curse after the animation promise completes
                  
              }
        } else {
          // There is no support for adding multiple vector locations as targets
          projectile.state.castLocation = projectile.pushedObject;
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
export default spell;