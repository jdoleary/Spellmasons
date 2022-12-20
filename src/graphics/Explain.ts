import { id } from '../cards/slash';
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
interface ExplainData {
    condition?: () => boolean;
    // Returns args to pass into Jprompt
    prompt: () => PromptArgs;
};

const explainMap: { [key: string]: ExplainData } = {
    [EXPLAIN_WALK]: {
        prompt: () => ({ imageSrc: 'images/explain/walk.gif', text: '<h1>How to Move</h1>Hold right mouse button to walk towards your cursor.', yesText: 'Okay' })
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
        prompt: () => ({
            imageSrc: 'images/explain/end-turn.gif', text: `Press ${keyToHumanReadable(keyMapping.endTurn)} or click the End Turn button to have your mana and stamina refilled.
        
Note: You may still cast even when you are out of stamina.`, yesText: 'Okay'
        })
    },
    [EXPLAIN_OVERFILL]: {
        condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
        prompt: () => ({ imageSrc: 'images/explain/mana-overfill.gif', text: 'You are able to fill your mana beyond its maximum amount using potions or spells.', yesText: 'Cool!' })

    },
    [EXPLAIN_MANA_COST]: {
        prompt: () => ({ imageSrc: 'images/explain/mana-cost.gif', text: 'Spells cost more mana each time they are cast.  When you end your turn, the spells\' mana costs decrease until they return to the original cost.', yesText: 'Okay' })

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
            imageSrc: 'images/explain/inventory.gif', text: `Spells are stored in your inventory.  Open your inventory by clicking on the Spell Book or by pressing ${keyToHumanReadable(keyMapping.openInventory)}.
Click and drag a spell to your toolbar to make it easily accessible.
You can also forge spells by clicking on them in your inventory so you don't have to have a spell on your toolbar in order to use it.`, yesText: "I'm so organized!"
        })

    },
    [EXPLAIN_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll.gif', text: `Move onto a Scroll Pickup to aquire new spells. Scroll Pickups will disappear after a number of turns have passed so be careful to pick them up before it's too late!`, yesText: 'Okay'
        })

    },
    [EXPLAIN_MISSED_SCROLL]: {
        prompt: () => ({
            imageSrc: 'images/explain/scroll-disappear.gif', text: `<h1>A Scroll has disappeared!</h1>Remember: Scrolls disappear after a number of turns have passed.  It is very important to pick them up before it is too late so you can get new spells.`, yesText: 'Bummer'
        })

    },
    [EXPLAIN_LIQUID_DAMAGE]: {
        prompt: () => ({
            imageSrc: 'images/explain/liquid-damage.gif', text: `Units that fall into bodies of liquid will take damage.  Some units are stronger than others and will survive.  Some types of liquid will deal more damage than others.`, yesText: 'Yikes!'
        })
    },
    [EXPLAIN_BLESSINGS]: {
        prompt: () => ({
            imageSrc: 'images/explain/bless-ally.gif', text: `Cast blessings on yourself or your allies to help them survive.`, yesText: 'Got it!'
        })
    },
    [EXPLAIN_REMOVE_SPELLS]: {
        prompt: () => ({
            imageSrc: 'images/explain/delete-queued-spells.gif', text: `Click on a spell to remove it or press ${keyToHumanReadable(keyMapping.dequeueSpell)} to remove the last spell.`, yesText: 'Okay'
        })
    },
    [EXPLAIN_FORGE_ORDER]: {
        prompt: () => ({
            imageSrc: 'images/explain/forge-order.gif', text: `The order in which spells are forged may result in a different outcome.
    
In this example, "Connect" + "Push" + "${id}" will damage you instead of the 2nd Golem; whereas reversing the order of "Connect" and "Push" - so that "Push" comes first - will cause it to connect to the 2nd Golem instead of you.`, yesText: 'Okay'
        })
    },
    [EXPLAIN_DEATH]: {
        prompt: () => ({
            imageSrc: 'images/explain/death.gif', text: `You have died. If you have any allies in your faction they will continue to fight on your behalf; and if they defeat the enemy factions you will be resurrected and continue to the next level.`, yesText: 'Okay'
        })
    },
    [EXPLAIN_MINI_BOSSES]: {
        prompt: () => ({
            imageSrc: 'images/explain/minibosses.gif', text: `Minibosses are larger than their meager counterparts, have more health and do more damage.  Take extra caution when facing one.`, yesText: 'Got it!'
        })
    },
    [EXPLAIN_PING]: {
        prompt: () => ({
            imageSrc: 'images/explain/ping.gif', text: `In multiplayer games, you can ping specific locations to help with communication by holding down ${keyToHumanReadable(keyMapping.ping)} and moving your mouse.`, yesText: 'Cool!'
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
globalThis.skipTutorial = () => {
    const yesSkip = confirm(i18n('Are you sure you want to skip the tutorial? (You can reset the tutorial in the menu)'))
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
    alert('Tutorial has been reset');
}
// Returns a value that remains the same as the first time this function was invoked for the duration of the play session
export function isTutorialComplete() {
    if (globalThis.headless) {
        // Never run the tutorial on a headless server because it is hosting games for clients
        return true;
    }
    // Update tutorialChecklist from storage:
    for (let key of Object.keys(tutorialChecklist)) {
        const item = tutorialChecklist[key as keyof TutorialChecklist];
        if (storage.get(getTutorialStorageKey(key)) === COMPLETE) {
            item.complete = true;
        }
    }
    if (Object.keys(tutorialChecklist).every(key => tutorialChecklist[key as keyof TutorialChecklist].complete)) {
        setTutorialVisiblity(false);
        return true;
    } else {
        setTutorialVisiblity(true);
        return false;
    }
}
globalThis.isTutorialComplete = isTutorialComplete;