import { testables, calculateManaHealthCost } from '../cardUtils';
const { calculateManaCost } = testables;

describe("cards", () => {
    describe("calculateManaCost", () => {
        it('should return the mana cost of the cards by summing the manaCost (if there are no multipliers)', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            }
            const cards = [card, card, card]
            const actual = calculateManaCost(cards);
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
            const actual = calculateManaCost(cards);
            const expected = ((2 + 1) * 2 + 1) * 2;
            expect(actual).toEqual(expected);
        });
    });
    describe("calculateManaHealthCost", () => {
        it('if the manaCost is > the units current mana, the remainder should turn into health cost and the mana cost should be floored to the amount of current unit mana', () => {
            const card = {
                manaCost: 30,
                manaMultiplier: 1
            };
            const unit = { mana: 10 };
            const actual = calculateManaHealthCost([card], unit)
            const expected = { manaCost: unit.mana, healthCost: card.manaCost - unit.mana };
            expect(actual).toEqual(expected);
        });
        it('if the manaCost is < the units current mana, there should be no health cost', () => {
            const card = {
                manaCost: 1,
                manaMultiplier: 1
            };
            const unit = { mana: 10 };
            const actual = calculateManaHealthCost([card], unit)
            const expected = { manaCost: card.manaCost, healthCost: 0 };
            expect(actual).toEqual(expected);

        });
    });
});