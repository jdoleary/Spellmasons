import { slashCardId } from '../cards/slash';
import { elTutorialChecklistInner } from '../HTMLElements';
import * as storage from '../storage';
import Jprompt, { PromptArgs } from './Jprompt';
import keyMapping, { keyToHumanReadable } from './ui/keyMapping';
const ALREADY_EXPLAINED = 'explained'
export function explain(key: string, forceShow?: boolean) {
    if (globalThis.headless) {
        return;
    }
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
                Jprompt({ ...explainData.prompt(), portal: forceShow ? (portal || undefined) : undefined, forceShow });
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
export const EXPLAIN_BLESSINGS = 'Blessings';
export const EXPLAIN_REMOVE_SPELLS = 'Remove Spells';
export const EXPLAIN_FORGE_ORDER = 'Spell Forge Order';
export const EXPLAIN_DEATH = 'Surviving Death';
export const EXPLAIN_MINI_BOSSES = 'Mini Bosses';
export const EXPLAIN_PING = 'Pinging';
export const EXPLAIN_UPDATES = 'Update the Game';
interface ExplainData {
    condition?: () => boolean;
    // Returns args to pass into Jprompt
    prompt: () => PromptArgs;
};

const explainMap: { [key: string]: ExplainData } = {
    [EXPLAIN_UPDATES]: {
        prompt: () => ({
            imageSrc: 'images/explain/verifyIntegrity.gif', text: 'Right Click on Spellmasons, then click on "Properties", then "Local Files", then "Verify integrity of game files..." to ensure that you have the latest update.', yesText: 'Okay'
        })
    },
    [EXPLAIN_WALK]: {
        prompt: () => ({ imageSrc: 'images/explain/walk.gif', text: 'explain move', yesText: 'Okay' })
    },
    [EXPLAIN_CAST]: {
        prompt: () => ({ imageSrc: 'images/explain/cast.gif', text: ['explain cast', keyToHumanReadable(keyMapping.clearQueuedSpell)], yesText: 'Nice!' })
    },
    [EXPLAIN_STACK]: {
        prompt: () => ({ imageSrc: 'images/explain/stack-spells.gif', text: 'explain stack', yesText: 'Intriguing...' })

    },
    [EXPLAIN_WALK_ROPE]: {
        prompt: () => ({ imageSrc: 'images/explain/walk-rope.gif', text: ['explain walk rope', keyToHumanReadable(keyMapping.showWalkRope)], yesText: 'Okay' })

    },
    [EXPLAIN_END_TURN]: {
        prompt: () => ({
            imageSrc: 'images/explain/end-turn.gif', text: ['explain end turn', keyToHumanReadable(keyMapping.endTurn)], yesText: 'Okay'
        })
    },
    [EXPLAIN_OVERFILL]: {
        condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
        prompt: () => ({ imageSrc: 'images/explain/mana-overfill.gif', text: 'explain overfill', yesText: 'Cool!' })

    },
    [EXPLAIN_MANA_COST]: {
        prompt: () => ({ imageSrc: 'images/explain/mana-cost.gif', text: 'explain mana cost', yesText: 'Okay' })

    },
    [EXPLAIN_ATTENTION_MARKER_MELEE]: {
        prompt: () => ({ imageSrc: 'images/explain/attentionMarkerMelee.gif', text: 'explain attention markers melee', yesText: 'Okay' })

    },
    [EXPLAIN_ATTENTION_MARKER_RANGED]: {
        prompt: () => ({ imageSrc: 'images/explain/attentionMarkerRanged.gif', text: 'explain attention markers', yesText: 'Okay' })

    },
    [EXPLAIN_CAMERA]: {
        prompt: () => ({
            imageSrc: 'images/explain/camera-movement.gif', text: ['explain camera movement', keyToHumanReadable(keyMapping.cameraUp), keyToHumanReadable(keyMapping.cameraLeft), keyToHumanReadable(keyMapping.cameraDown), keyToHumanReadable(keyMapping.cameraRight), keyToHumanReadable(keyMapping.recenterCamera)], yesText: 'Okay'
        })

    },
    [EXPLAIN_INVENTORY]: {
        prompt: () => ({
            imageSrc: 'images/explain/inventory.gif', text: ['explain inventory', keyToHumanReadable(keyMapping.openInventory)], yesText: "I'm so organized!"
        })

    },
    [EXPLAIN_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll.gif', text: 'explain scrolls', yesText: 'Okay'
        })

    },
    [EXPLAIN_MISSED_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll-disappear.gif', text: `explain scroll dissapear`, yesText: 'Bummer'
        })

    },
    [EXPLAIN_LIQUID_DAMAGE]: {
        prompt: () => ({
            imageSrc: 'images/explain/liquid-damage.gif', text: 'explain liquid damage', yesText: 'Yikes!'
        })
    },
    [EXPLAIN_BLESSINGS]: {
        prompt: () => ({
            imageSrc: 'images/explain/bless-ally.gif', text: `explain blessings`, yesText: 'Got it!'
        })
    },
    [EXPLAIN_REMOVE_SPELLS]: {
        prompt: () => ({
            imageSrc: 'images/explain/delete-queued-spells.gif', text: ['explain remove spells', keyToHumanReadable(keyMapping.dequeueSpell)], yesText: 'Okay'
        })
    },
    [EXPLAIN_FORGE_ORDER]: {
        prompt: () => ({
            imageSrc: 'images/explain/forge-order.gif', text: 'explain forge order', yesText: 'Okay'
        })
    },
    [EXPLAIN_DEATH]: {
        prompt: () => ({
            imageSrc: 'images/explain/death.gif', text: 'explain death', yesText: 'Okay'
        })
    },
    [EXPLAIN_MINI_BOSSES]: {
        prompt: () => ({
            imageSrc: 'images/explain/minibosses.gif', text: 'explain minibosses', yesText: 'Got it!'
        })
    },
    [EXPLAIN_PING]: {
        prompt: () => ({
            imageSrc: 'images/explain/ping.gif', text: ['explain ping', keyToHumanReadable(keyMapping.ping)], yesText: 'Cool!'
        })
    },
}
globalThis.explainKeys = Object.keys(explainMap);
export const autoExplains = [
    EXPLAIN_ATTENTION_MARKER_MELEE,
    EXPLAIN_MANA_COST,
    EXPLAIN_WALK_ROPE,
    EXPLAIN_STACK,
    EXPLAIN_ATTENTION_MARKER_RANGED,
    EXPLAIN_CAMERA,
    EXPLAIN_REMOVE_SPELLS,
    EXPLAIN_FORGE_ORDER
]
export function autoExplain() {
    // @ts-ignore: This global isn't on the server
    if (globalThis.devUnderworld && globalThis.devUnderworld.levelIndex > 2) {
        for (let e of autoExplains) {
            if (!isAlreadyExplained(e)) {
                explain(e);
                // Stop after finding one that needs explaining
                return;
            }
        }
    }

}
export function setTutorialVisiblity(visible: boolean) {
    document.body.classList.toggle('showTutorial', visible);
    globalThis.doUpdateTutorialChecklist = visible;
    updateTutorialChecklist();
}
interface TutorialChecklistItem {
    visible: boolean;
    complete: boolean;
    text: string;
    nextVisibleTasks: (keyof TutorialChecklist)[];
    showExplainPopup: string[];
}
export interface TutorialChecklist {
    spawn: TutorialChecklistItem;
    moved: TutorialChecklistItem;
    portal: TutorialChecklistItem;
    cast: TutorialChecklistItem;
    castMultipleInOneTurn: TutorialChecklistItem;
    camera: TutorialChecklistItem;
    recenterCamera: TutorialChecklistItem;
    pickupScroll: TutorialChecklistItem;
}
const tutorialChecklist: TutorialChecklist = {
    spawn: {
        visible: true,
        complete: false,
        text: "Click somewhere on the grass to choose a spawn point",
        nextVisibleTasks: ['moved', 'portal'],
        showExplainPopup: [],
    },
    moved: {
        visible: false,
        complete: false,
        text: "Hold right mouse button to walk towards your cursor",
        nextVisibleTasks: [],
        showExplainPopup: [EXPLAIN_WALK],
    },
    portal: {
        visible: false,
        complete: false,
        text: "Move into the portal to go to the next level",
        nextVisibleTasks: ['camera', 'cast'],
        showExplainPopup: [],
    },
    cast: {
        visible: false,
        complete: false,
        text: "Click on a spell from your toolbar to queue it up and then click on a target to cast it",
        nextVisibleTasks: ['castMultipleInOneTurn'],
        showExplainPopup: [EXPLAIN_CAST],
    },
    castMultipleInOneTurn: {
        visible: false,
        complete: false,
        text: "Cast more than once in a single turn",
        nextVisibleTasks: [],
        showExplainPopup: [],
    },
    camera: {
        visible: false,
        complete: false,
        text: "Move the camera with W,A,S, and D keys or by holding and dragging Middle Mouse Button",
        nextVisibleTasks: ['recenterCamera'],
        showExplainPopup: [],
    },
    recenterCamera: {
        visible: false,
        complete: false,
        text: "Recenter the camera with the Z key",
        nextVisibleTasks: [],
        showExplainPopup: [],
    },
    pickupScroll: {
        visible: false,
        complete: false,
        text: "Pickup a spell scroll to get more spells",
        nextVisibleTasks: [],
        showExplainPopup: [],
    }
}

export function updateTutorialChecklist() {
    if (globalThis.usingTestRunner) {
        return;
    }
    let html = `<h3>${i18n('Tutorial')}</h3>`;
    const tutorialItems = Object.values(tutorialChecklist);
    const completeTutorialItems = tutorialItems.filter(x => x.complete);
    if (completeTutorialItems.length) {
        let completedItemsHtml = '';
        for (let item of completeTutorialItems) {
            if (item.visible) {
                completedItemsHtml += `<div class="complete">&#x2611; <span class="text complete">${i18n(item.text)}</span></div>`
            }
        }
        html += `<details>
            <summary>${i18n('Completed Tasks')} ${completeTutorialItems.length}/${tutorialItems.length}</summary>
            ${completedItemsHtml}
            </details>`
    }
    for (let item of tutorialItems.filter(x => !x.complete)) {
        if (item.visible) {
            html += `<div>&#x2610; <span class="text">${i18n(item.text)}</span></div>`
        }
    }
    elTutorialChecklistInner.innerHTML = html;
}
const COMPLETE = 'complete';
export function tutorialCompleteTask(key: keyof TutorialChecklist, condition?: () => boolean) {
    if (globalThis.doUpdateTutorialChecklist && (condition ? condition() : true)) {
        const task = tutorialChecklist[key];
        if (task) {
            console.log('Tutorial: Complete task', task.text);
            task.complete = true;
            storage.set(getTutorialStorageKey(key), COMPLETE);
            for (let nextTask of task.nextVisibleTasks) {
                tutorialShowTask(nextTask);
            }
            updateTutorialChecklist();
            isTutorialComplete();
        } else {
            console.error('No such tutorial task with key', key);
        }
    }
}
globalThis.skipTutorial = async () => {
    const yesSkip = await Jprompt({ text: 'skip tutorial detail', yesText: 'Yes', noBtnText: 'Cancel', noBtnKey: 'Escape', forceShow: true })
    if (yesSkip) {
        for (let task of Object.keys(tutorialChecklist)) {
            tutorialCompleteTask(task as keyof TutorialChecklist);
        }
        for (let key of Object.keys(explainMap)) {
            storage.set(key, ALREADY_EXPLAINED);
        }
    }
}
export function tutorialShowTask(key: keyof TutorialChecklist) {
    if (globalThis.doUpdateTutorialChecklist) {
        const task = tutorialChecklist[key];
        if (task) {
            task.visible = true;
            if (storage.get(getTutorialStorageKey(key)) === COMPLETE) {
                tutorialCompleteTask(key);
            }
            setTutorialVisiblity(true);
        } else {
            console.error('No such tutorial task with key', key);
        }
    }
}
function getTutorialStorageKey(key: string): string {
    return `tutorial_${key}`;

}
globalThis.resetTutorial = function resetTutorial() {
    for (let key of Object.keys(tutorialChecklist)) {
        const item = tutorialChecklist[key as keyof TutorialChecklist];
        item.complete = false;
        storage.set(getTutorialStorageKey(key), undefined);
    }
    setTutorialVisiblity(true);
    // Reset all explain prompts when tutorial is reset
    for (let explainKey of explainKeys) {
        storage.set(explainKey, undefined);
    }
    globalThis.enemyEncountered = [];
    storage.remove(storage.ENEMY_ENCOUNTERED_STORAGE_KEY);
    Jprompt({ text: 'Tutorial has been reset', yesText: 'Okay', forceShow: true });
}
// Returns a value that remains the same as the first time this function was invoked for the duration of the play session
export function isTutorialComplete() {
    if (globalThis.headless) {
        // Never run the tutorial on a headless server because it is hosting games for clients
        return true;
    }
    // Update tutorialChecklist from storage:
    const tutorialKeys: (keyof TutorialChecklist)[] = Object.keys(tutorialChecklist) as (keyof TutorialChecklist)[]
    for (let key of tutorialKeys) {
        const item = tutorialChecklist[key];
        if (storage.get(getTutorialStorageKey(key)) === COMPLETE) {
            item.complete = true;
        }
    }
    if (tutorialKeys.every(key => tutorialChecklist[key].complete)) {
        setTutorialVisiblity(false);
        return true;
    } else {
        setTutorialVisiblity(true);
        return false;
    }
}
globalThis.isTutorialComplete = isTutorialComplete;

// Used to spawn the player into early tutorial levels if they've never played before
// Will only return true for the first two steps of the tutorial, once they know how to
// spawn and portal just let them play regular
export function isFirstTutorialStepComplete() {
    if (globalThis.headless) {
        // Never run the tutorial on a headless server because it is hosting games for clients
        return true;
    }
    const firstStepKeys: (keyof TutorialChecklist)[] = ['spawn', 'portal'];
    if (firstStepKeys.every(key => tutorialChecklist[key].complete)) {
        return true;
    } else {
        return false;
    }
}