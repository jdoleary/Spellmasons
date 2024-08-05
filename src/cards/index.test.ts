
import { eventsSorter, type MODIFIER_STAGE } from "./index";

describe('eventSorter', () => {
    const lookup: { [id: string]: { id: string, stage: MODIFIER_STAGE } } = {
        'eventA': {
            id: 'eventA',
            stage: 'Amount Flat',
        },
        'eventZ': {
            id: 'eventZ',
            stage: 'Amount Flat',
        },
        'eventBefore': {
            id: 'eventBefore',
            stage: 'Amount Multiplier',
        },
        'eventAfter': {
            id: 'eventAfter',
            stage: 'Reactive Effects',
        },

    };
    it('should sort events in the same stage alphabetically', () => {
        const events = ['eventAfter', 'eventZ', 'eventA', 'eventBefore'];
        events.sort(eventsSorter(lookup))
        expect(events).toEqual([
            'eventBefore',
            'eventA',
            'eventZ',
            'eventAfter'
        ])

    });

})