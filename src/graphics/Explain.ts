import * as storage from '../storage';
import Jprompt, { PromptArgs } from './Jprompt';
import keyMapping, { keyToHumanReadable } from './ui/keyMapping';
const ALREADY_EXPLAINED = 'explained'
export function explain(key: string, forceShow?: boolean) {
    const explainData = explainMap[key];
    if (forceShow || !isAlreadyExplained(key)) {
        if (explainData) {
            // If condition is met
            if (forceShow || !explainData.condition || explainData.condition()) {
                let portal = document.getElementById('explain-portal');
                if (portal) {
                    // Clear previous explain if this is a forceShow (meaning it's coming from the help screen)
                    // and rendering into a portal
                    portal.innerHTML = "";
                }
                Jprompt({ ...explainData.prompt(), portal: forceShow ? (portal || undefined) : undefined });
                document.querySelectorAll('.prompt').forEach(el => el.classList.add('forceShow'));
                storage.set(key, ALREADY_EXPLAINED);
            }
        } else {
            console.error('explainData not found for key', key);
        }
    }

}
globalThis.menuExplain = (key: string) => {
    explain(key, true);
}
function isAlreadyExplained(key: string): boolean {
    const explainData = explainMap[key];
    if (globalThis.allowCookies) {
        if (explainData) {
            // If not already explained
            return storage.get(key) == ALREADY_EXPLAINED;
        } else {
            console.error('explainData not found for key', key);
            return false;
        }
    } else {
        return false;
    }
}

export const EXPLAIN_WALK = 'How to Move';
export const EXPLAIN_OVERFILL = 'Mana Overfill';
export const EXPLAIN_CAST = 'Forging Spells';
export const EXPLAIN_STACK = 'Stacking Spells';
export const EXPLAIN_WALK_ROPE = 'Stamina';
export const EXPLAIN_END_TURN = 'End Turn';
export const EXPLAIN_MANA_COST = 'Mana Cost';
export const EXPLAIN_ATTENTION_MARKER_MELEE = 'Melee Agro';
export const EXPLAIN_ATTENTION_MARKER_RANGED = 'Ranged Agro';
export const EXPLAIN_CAMERA = 'Camera Movement';
export const EXPLAIN_INVENTORY = 'Inventory';
export const EXPLAIN_SCROLL = 'Getting New Spells';
export const EXPLAIN_MISSED_SCROLL = 'Missing Scroll Pickups';
export const EXPLAIN_LIQUID_DAMAGE = 'Liquid Damage';
interface ExplainData {
    condition?: () => boolean;
    // Returns args to pass into Jprompt
    prompt: () => PromptArgs;
};

const explainMap: { [key: string]: ExplainData } = {
    [EXPLAIN_WALK]: {
        prompt: () => ({ imageSrc: 'images/explain/walk.gif', text: '<h1>How to Move</h1>Hold right mouse button to walk towards your cursor. Your stamina bar will refill at the start of every turn.', yesText: 'Okay' })
    },
    [EXPLAIN_CAST]: {
        prompt: () => ({ imageSrc: 'images/explain/cast.gif', text: `<h1>How to Forge Spells!</h1>Click on a spell or use its keyboard hotkey to queue it up. Left click on a target to unleash the queued spell.<br/><br/>Or if you change your mind, press ${keyToHumanReadable(keyMapping.clearQueuedSpell)} to clear a queued spell.`, yesText: 'Nice!' })
    },
    [EXPLAIN_STACK]: {
        prompt: () => ({ imageSrc: 'images/explain/stack-spells.gif', text: 'Many spells become more powerful if you stack multiple in a row.  Try combining different spells to find out how they might interact.', yesText: 'Intriguing...' })

    },
    [EXPLAIN_WALK_ROPE]: {
        prompt: () => ({ imageSrc: 'images/explain/walk-rope.gif', text: `Hold ${keyToHumanReadable(keyMapping.showWalkRope)} to see how far you can go with the stamina (the yellow line) that you have remaining. The blue circle shows you what your cast range would be if you moved to that location.`, yesText: 'Okay' })

    },
    [EXPLAIN_END_TURN]: {
        prompt: () => ({ imageSrc: 'images/explain/end-turn.gif', text: `Press ${keyToHumanReadable(keyMapping.endTurn)} or click the End Turn button to have your mana and stamina refilled.`, yesText: 'Okay' })

    },
    [EXPLAIN_OVERFILL]: {
        condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
        prompt: () => ({ imageSrc: 'images/explain/mana-overfill.gif', text: 'You are able to fill your mana up to 3x its maximum amount using potions or spells.', yesText: 'Cool!' })

    },
    [EXPLAIN_MANA_COST]: {
        prompt: () => ({ imageSrc: 'images/explain/mana-cost.gif', text: 'As you use a spell it will cost more mana.  Every time you end your turn the spell will cost less mana until it returns to the original cost.', yesText: 'Okay' })

    },
    [EXPLAIN_ATTENTION_MARKER_MELEE]: {
        prompt: () => ({ imageSrc: 'images/explain/attentionMarkerMelee.gif', text: 'An icon will appear above the head of a melee enemy if you are close enough for them to attack you next turn.', yesText: 'Okay' })

    },
    [EXPLAIN_ATTENTION_MARKER_RANGED]: {
        prompt: () => ({ imageSrc: 'images/explain/attentionMarkerRanged.gif', text: 'An icon will appear above the head of an archer when they can see you; which means they will attack you next turn.', yesText: 'Okay' })

    },
    [EXPLAIN_CAMERA]: {
        prompt: () => ({
            imageSrc: 'images/explain/camera-movement.gif', text: `Move the camera by clicking and dragging Middle Mouse Button or by pressing ${keyToHumanReadable(keyMapping.cameraUp)}, ${keyToHumanReadable(keyMapping.cameraLeft)}, ${keyToHumanReadable(keyMapping.cameraDown)}, or ${keyToHumanReadable(keyMapping.cameraRight)}.
            To make the camera auto follow your player again, press ${keyToHumanReadable(keyMapping.recenterCamera)}.`, yesText: 'Okay'
        })

    },
    [EXPLAIN_INVENTORY]: {
        prompt: () => ({
            imageSrc: 'images/explain/inventory.gif', text: `Spells are stored in your inventory.Open your inventory by clicking on the Spell Book or by pressing ${keyToHumanReadable(keyMapping.openInventory)}.
Click and drag a spell to your toolbar to make it easily accessible.`, yesText: 'I\'m so organized!'
        })

    },
    [EXPLAIN_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll.gif', text: `Move onto the Scroll Pickup to aquire new spells.Scroll Pickups will disappear after a number of turns have passed so be careful to pick them up before it's too late!`, yesText: 'Okay'
        })

    },
    [EXPLAIN_MISSED_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll-disappear.gif', text: `<h1>A Scroll has disappeared!</h1>Remember: Scrolls disappear after a number of turns have passed.  It is very important to pick them up before it is too late so you can get new spells.`, yesText: 'Bummer'
        })

    },
    [EXPLAIN_LIQUID_DAMAGE]: {
        prompt: () => ({
            imageSrc: 'images/explain/liquid-damage.gif', text: `Units that fall into bodies of liquid will take damage.  Some units are stronger than others and will survive.`, yesText: 'Yikes!'
        })

    },
}
globalThis.explainKeys = Object.keys(explainMap);
export const autoExplains = [
    EXPLAIN_WALK,
    EXPLAIN_CAST,
    EXPLAIN_ATTENTION_MARKER_MELEE,
    EXPLAIN_MANA_COST,
    EXPLAIN_WALK_ROPE,
    EXPLAIN_STACK,
    EXPLAIN_ATTENTION_MARKER_RANGED,
    EXPLAIN_CAMERA,
]
export function autoExplain() {
    for (let e of autoExplains) {
        if (!isAlreadyExplained(e)) {
            explain(e);
            // Stop after finding one that needs explaining
            return;
        }
    }

}