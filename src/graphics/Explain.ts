import * as storage from '../storage';
import Jprompt from './Jprompt';
import keyMapping, { keyToHumanReadable } from './ui/keyMapping';
const ALREADY_EXPLAINED = 'explained'
export function explain(key: string, forceShow?: boolean) {
    const explainData = explainMap[key];
    if (globalThis.allowCookies) {
        if (explainData) {
            // If condition is met
            if (forceShow || !explainData.condition || explainData.condition()) {
                // If not already explained
                if (forceShow || storage.get(key) != ALREADY_EXPLAINED) {
                    explainData.prompt();
                    document.querySelectorAll('.prompt').forEach(el => el.classList.add('forceShow'));
                    storage.set(key, ALREADY_EXPLAINED);
                }
            }
        } else {
            console.error('explainData not found for key', key);
        }
    } else {
        console.warn('Cannnot show tutorial prompts, allowCookies is false');
    }

}
globalThis.explain = (key: string) => {
    explain(key, true);
}

export const EXPLAIN_WALK = 'How to Move';
export const EXPLAIN_OVERFILL = 'Mana Overfill';
export const EXPLAIN_CAST = 'Casting Spells';
export const EXPLAIN_STACK = 'Stacking Spells';
export const EXPLAIN_WALK_ROPE = 'Stamina';
export const EXPLAIN_END_TURN = 'End Turn';
const explainMap: { [key: string]: { condition?: () => boolean, prompt: () => void } } = {
    [EXPLAIN_OVERFILL]: {
        condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/mana-overfill.gif', text: 'You are able to fill your mana up to 3x its maximum amount using potions or spells.', yesText: 'Cool!' });
        }
    },
    [EXPLAIN_WALK]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/walk.gif', text: '<h1>How to Move</h1>Hold right mouse button to walk towards your cursor. Your stamina bar will refill at the start of every turn.', yesText: 'Okay' });
        }
    },
    [EXPLAIN_CAST]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/cast.gif', text: `<h1>How to use Magic!</h1>Click on a spell or use its keyboard hotkey to queue it up. Left click on a target to unleash the queued spell.<br/><br/>Or if you change your mind, press <kbd>${keyToHumanReadable(keyMapping.clearQueuedSpell)}</kbd> to clear a queued spell.`, yesText: 'Nice!' });
        }
    },
    [EXPLAIN_STACK]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/stack-spells.gif', text: 'Many spells become more powerful if you stack multiple in a row.  Try combining different spells to find out how they might interact.', yesText: 'Intriguing...' });
        }
    },
    [EXPLAIN_WALK_ROPE]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/walk-rope.gif', text: `Hold <kbd>${keyToHumanReadable(keyMapping.showWalkRope)}</kbd> to see how far you can go with the stamina that you have remaining.  The blue circle shows you what your cast range would be if you moved to that location.`, yesText: 'Okay' });
        }
    },
    [EXPLAIN_END_TURN]: {
        prompt: () => {
            Jprompt({ imageSrc: 'images/explain/end-turn.gif', text: `Press <kbd>${keyToHumanReadable(keyMapping.endTurn)}</kbd> or click the End Turn button to have your mana and stamina refilled.`, yesText: 'Okay' });
        }
    },
}
globalThis.explainKeys = Object.keys(explainMap);