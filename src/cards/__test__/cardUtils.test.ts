import { isAllowedToCastOutOfRange } from '../../PlayerUtils';
import { _getCardsFromIds } from '../cardUtils';

import { addBounceId } from '../add_bounce';
import { arrowCardId } from '../arrow';
import { meteorCardId } from '../meteor';
import { phantomArrowCardId } from '../phantom_arrow';
import { plusRadiusId } from '../plus_radius';
import { pushId } from '../push';
import { slashCardId } from '../slash';
import { targetArrowCardId } from '../target_arrow';
import { targetConeId } from '../target_cone';

describe("cards", () => {

    describe('_getCardsFromIds', () => {
        it('should return values from the cards object by id in the order of the cardsIds string', () => {
            const cards = {
                'test': { id: 1 },
                'test2': { id: 2 },
                'test3': { id: 3 },
            }
            const ids = ['test', 'test2', 'test3'];
            // @ts-ignore I don't want to actually assert the schema of the ICard interface for this test
            const actual = _getCardsFromIds(ids, cards);
            const expected = [cards['test'], cards['test2'], cards['test3']];
            expect(actual).toEqual(expected);
        });
        it('should support multiple instances of the same card, in order', () => {
            const cards = {
                'test': { id: 1 },
                'test2': { id: 2 },
                'test3': { id: 3 },
            }
            const ids = ['test2', 'test', 'test3', 'test'];
            // @ts-ignore I don't want to actually assert the schema of the ICard interface for this test
            const actual = _getCardsFromIds(ids, cards);
            const expected = [cards['test2'], cards['test'], cards['test3'], cards['test']];
            expect(actual).toEqual(expected);
        });
    });
    describe('isAllowedToCastOutOfRange', () => {
        it('should return false if no cards ignore range', () => {
            const cardIds = [targetConeId, pushId, slashCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return false if some cards ignore range', () => {
            const cardIds = [arrowCardId, slashCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return true if all cards ignore range', () => {
            const cardIds = [arrowCardId, phantomArrowCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should return true if the first card is a target arrow type spell', () => {
            const cardIds = [targetArrowCardId, slashCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should ignore frontloaded cards when no spells ignore range', () => {
            const cardIds = [plusRadiusId, slashCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should ignore frontloaded cards when all spells ignore range', () => {
            const cardIds = [addBounceId, phantomArrowCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should ignore frontloaded cards with target arrow', () => {
            const cardIds = [plusRadiusId, addBounceId, targetArrowCardId, meteorCardId]
            const actual = isAllowedToCastOutOfRange(cardIds);
            const expected = true;
            expect(actual).toEqual(expected);
        });
    });
});