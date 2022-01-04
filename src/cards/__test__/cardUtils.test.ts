import { SPELL_DISTANCE_MANA_DENOMINATOR } from '../../config';
import { testables, calculateManaHealthCost } from '../cardUtils';
const { calculateManaCost } = testables;

describe("cards", () => {
    describe("calculateManaCost", () => {
        it('should return the mana cost of the cards by summing the manaCost (if there are no multipliers)', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            }
            const distanceMultiplier = 1;
            const cards = [card, card, card]
            const actual = calculateManaCost(cards, distanceMultiplier);
            const expected = 3;
            expect(actual).toEqual(expected);
        })
        it('should return the mana cost of the cards by summing the manaCost and multiplying by the multiplier sequentially', () => {
            const cards = [
                {
                    manaCost: 2,
                    manaMultiplier: 1
                },
                {
                    manaCost: 1,
                    manaMultiplier: 2
                },
                {
                    manaCost: 1,
                    manaMultiplier: 2
                },

            ]
            const distanceMultiplier = 1;
            const actual = calculateManaCost(cards, distanceMultiplier);
            const expected = ((2 + 1) * 2 + 1) * 2;
            expect(actual).toEqual(expected);
        });
        it('should prevent a distance multiplier of < 1 from reducing the mana cost because we don\'t want casts on own character to be free', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            }
            // multiplier is 0 here but the calculatManaCost logic won't let it reduce the mana cost
            const distanceMultiplier = 0;
            const cards = [card, card, card]
            const actual = calculateManaCost(cards, distanceMultiplier);
            const expected = 3;
            expect(actual).toEqual(expected);
        })
        it('should multiply the mana cost by the distanceMultiplier', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            }
            const distanceMultiplier = 2;
            const cards = [card, card, card]
            const actual = calculateManaCost(cards, distanceMultiplier);
            const expected = 3 * distanceMultiplier;
            expect(actual).toEqual(expected);
        })
    });
    describe("calculateManaHealthCost", () => {
        it('if the manaCost is > the units current mana, the remainder should turn into health cost and the mana cost should be floored to the amount of current unit mana', () => {
            const card = {
                manaCost: 30,
                manaMultiplier: 1
            };
            const distance = SPELL_DISTANCE_MANA_DENOMINATOR; // not relevant to this test
            const unit = { mana: 10 };
            const actual = calculateManaHealthCost([card], unit, distance)
            const expected = { manaCost: unit.mana, healthCost: card.manaCost - unit.mana };
            expect(actual).toEqual(expected);
        });
        it('if the manaCost is < the units current mana, there should be no health cost', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            };
            const unit = { mana: 10 };
            const distance = SPELL_DISTANCE_MANA_DENOMINATOR; // not relevant to this test
            const actual = calculateManaHealthCost([card], unit, distance)
            const expected = { manaCost: card.manaCost, healthCost: 0 };
            expect(actual).toEqual(expected);
        });
        it('should divide the "distance" by config.SPELL_DISTANCE_MANA_DENOMINATOR before passing it on to calculateManaCost', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            };
            const unit = { mana: 10 };
            const distance = SPELL_DISTANCE_MANA_DENOMINATOR * 2;
            const actual = calculateManaHealthCost([card], unit, distance)
            const expected = { manaCost: card.manaCost * 2, healthCost: 0 };
            expect(actual).toEqual(expected);
        });
    });
});