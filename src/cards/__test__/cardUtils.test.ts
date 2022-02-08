import { _getCardsFromIds } from '../cardUtils';

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
});