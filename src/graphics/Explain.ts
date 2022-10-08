import * as storage from '../storage';
import Jprompt from './Jprompt';
import keyMapping from './ui/keyMapping';
const ALREADY_EXPLAINED = 'explained'
export function explain(key: string) {
    const explainData = explainMap[key];
    if (explainData && globalThis.allowCookies) {
        // If condition is met
        if (!explainData.condition || explainData.condition()) {
            // If not already explained
            if (storage.get(key) != ALREADY_EXPLAINED) {
                explainData.prompt();
                storage.set(key, ALREADY_EXPLAINED);
            }
        }
    } else {
        console.error('explainData not found for key', key);
    }

}
export const EXPLAIN_WALK = 'walk';
export const EXPLAIN_OVERFILL = 'mana-overfill';
export const EXPLAIN_CAST = 'cast';
export const EXPLAIN_STACK = 'stack-spells';
const explainMap: { [key: string]: { condition?: () => boolean, prompt: () => void } } = {
    [EXPLAIN_OVERFILL]: {
        condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/mana-overfill.gif', text: 'You are able to fill your mana up to 3x its maximum amount using potions or spells.', yesText: 'Cool!' });

        }
    },
    [EXPLAIN_WALK]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/walk.gif', text: 'Hold right mouse button to walk towards your cursor. Your stamina bar will refill at the start of every turn.', yesText: 'Okay' });
        }
    },
    [EXPLAIN_CAST]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/cast.gif', text: `Click on a spell (or use its hotkey) to queue it up. Left click on a target to unleash the queued spell.  Press ${keyMapping.clearQueuedSpell} to clear a queued spell or ${keyMapping.dequeueSpell} to dequeue spells one at a time or click on a queued spell to remove it from the queue.`, yesText: 'Nice!' });
        }
    },
    [EXPLAIN_STACK]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/stack-spells.gif', text: 'Many spells become more powerful if you stack multiple in a row.  Try combining different spells to find out how they might interact.', yesText: 'Intriguing...' });
        }
    },

}