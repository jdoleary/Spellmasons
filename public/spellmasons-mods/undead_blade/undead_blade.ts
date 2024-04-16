/// <reference path="../globalTypes.d.ts" />
import type { Spell } from '../types/cards/index';
import { Mod } from '../types/types/commonTypes';

const {
    PixiUtils,
    rand,
    cardUtils,
    commonTypes,
    cards
} = globalThis.SpellmasonsAPI;
const { randFloat } = rand;
const { refundLastSpell } = cards;
const { containerSpells } = PixiUtils;
const Unit = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage, playDefaultSpellSFX } = cardUtils;
const { CardCategory, probabilityMap, CardRarity } = commonTypes;

const cardId = 'Undead Blade';
const damageDone = 60;
export interface UnitDamage {
    id: number;
    x: number;
    y: number;
    health: number;
    damageTaken: number;

}
const animationPath = 'spellUndeadBlade';
const delayBetweenAnimationsStart = 400;
const spell: Spell = {
    card: {
        id: cardId,
        category: CardCategory.Damage,
        supportQuantity: true,
        manaCost: 10,
        healthCost: 0,
        expenseScaling: 1,
        probability: probabilityMap[CardRarity.COMMON],
        thumbnail: 'spellmasons-mods/undead_blade/spellIconUndeadBlade.png',
        animationPath,
        sfx: 'hurt',
        description: [`Deals ${damageDone} to summoned units and resurrected units only.`],
        effect: async (state, card, quantity, underworld, prediction) => {
            // .filter: only target living units
            // UNDEAD: Filter only non original life units
            const targets = state.targetedUnits.filter(u => u.alive && !u.originalLife);
            let delayBetweenAnimations = delayBetweenAnimationsStart;
            // Note: quantity loop should always be INSIDE of the targetedUnits loop
            // so that any quantity-based animations will play simultaneously on multiple targets
            // but sequentially within themselves (on a single target, e.g. multiple hurts over and over)
            for (let q = 0; q < quantity; q++) {
                if (!prediction && !globalThis.headless) {
                    playDefaultSpellSFX(card, prediction);
                    for (let unit of targets) {
                        const spellEffectImage = oneOffImage(unit, animationPath, containerSpells);
                        if (spellEffectImage) {
                            // Randomize rotation a bit so that subsequent slashes don't perfectly overlap
                            spellEffectImage.sprite.rotation = randFloat(-Math.PI / 6, Math.PI / 6);
                            if (q % 2 == 0) {
                                // Flip every other slash animation so that it comes from the other side
                                spellEffectImage.sprite.scale.x = -1;
                            }
                        }

                        Unit.takeDamage({
                            unit: unit,
                            amount: damageDone,
                            sourceUnit: state.casterUnit,
                            fromVec2: state.casterUnit,
                        }, underworld, prediction);
                    }
                    // Wait some delay between attacks
                    await new Promise(resolve => setTimeout(resolve, delayBetweenAnimations));
                    // Juice: Speed up subsequent hits
                    delayBetweenAnimations *= 0.80
                    // Don't let it go below 20 milliseconds
                    delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
                } else {
                    for (let unit of targets) {
                        Unit.takeDamage({
                            unit: unit,
                            amount: damageDone,
                            sourceUnit: state.casterUnit,
                            fromVec2: state.casterUnit,
                        }, underworld, prediction);
                    }
                }
            }

            if (targets.length == 0) {
                refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
            }
            return state;
        },
    },
};

const mod: Mod = {
    modName: 'Undead Blade',
    author: 'Jordan O\'Leary',
    description: 'A spell that does lots of damage to summons and resurrected units',
    screenshot: 'spellmasons-mods/undead_blade/spellIconUndeadBlade.png',
    spells: [
        spell
    ],
    // The spritesheet is created with TexturePacker: https://www.codeandweb.com/texturepacker
    spritesheet: 'spellmasons-mods/undead_blade/undead_blade.json'
};
export default mod;
