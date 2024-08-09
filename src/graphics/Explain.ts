import { allUnits } from '../entity/units';
import { elTutorialChecklistInner } from '../HTMLElements';
import * as storage from '../storage';
import Jprompt, { PromptArgs } from './Jprompt';
import { keyToHumanReadable } from './ui/keyMapping';
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
        // Slightly delay showing explain prompt so the button doesn't flicker on for a moment before CSS has a chance
        // to mark cinematic camera as active
        setTimeout(() => {
          Jprompt({ ...explainData.prompt(), portal: forceShow ? (portal || undefined) : undefined, forceShow });
        }, 500);
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
  if (globalThis.privacyPolicyAndEULAConsent) {
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
export const EXPLAIN_LIQUID_DAMAGE = 'Liquid Damage';
export const EXPLAIN_BLESSINGS = 'Blessings';
export const EXPLAIN_REMOVE_SPELLS = 'Remove Spells';
export const EXPLAIN_FORGE_ORDER = 'Spell Forge Order';
export const EXPLAIN_DEATH = 'Surviving Death';
export const EXPLAIN_MINI_BOSSES = 'Mini Bosses';
export const EXPLAIN_PING = 'Pinging';
export const EXPLAIN_BOOKMARKS = 'Bookmarks';
export const EXPLAIN_UPGRADE_BOOKMARK = 'Upgrade Points';
interface ExplainData {
  condition?: () => boolean;
  // Returns args to pass into Jprompt
  prompt: () => PromptArgs;
};

const explainMap: { [key: string]: ExplainData } = {
  [EXPLAIN_WALK]: {
    prompt: () => ({ imageSrc: 'images/explain/walk.gif', text: 'explain move', yesText: 'Okay' })
  },
  [EXPLAIN_CAST]: {
    prompt: () => ({ gore: true, imageSrc: 'images/explain/cast.gif', text: ['explain cast', keyToHumanReadable(['Escape'])], yesText: 'Nice!' })
  },
  [EXPLAIN_STACK]: {
    prompt: () => ({ imageSrc: 'images/explain/stack-spells.gif', text: 'explain stack', yesText: 'Intriguing...' })

  },
  [EXPLAIN_WALK_ROPE]: {
    prompt: () => ({ imageSrc: 'images/explain/walk-rope.gif', text: ['explain walk rope', keyToHumanReadable(globalThis.controlMap.showWalkRope)], yesText: 'Okay' })

  },
  [EXPLAIN_END_TURN]: {
    prompt: () => ({
      imageSrc: 'images/explain/end-turn.gif', text: ['explain end turn', keyToHumanReadable(globalThis.controlMap.endTurn)], yesText: 'Okay'
    })
  },
  [EXPLAIN_OVERFILL]: {
    condition: () => !!globalThis.player && globalThis.player.unit.mana > globalThis.player.unit.manaMax,
    prompt: () => ({ imageSrc: 'images/explain/mana-overfill.gif', text: 'explain overfill', yesText: 'Cool!' })

  },
  [EXPLAIN_MANA_COST]: {
    prompt: () => ({ gore: true, imageSrc: 'images/explain/mana-cost.gif', text: 'explain mana cost', yesText: 'Okay' })

  },
  [EXPLAIN_ATTENTION_MARKER_MELEE]: {
    prompt: () => ({ imageSrc: 'images/explain/attentionMarkerMelee.gif', text: 'explain attention markers melee', yesText: 'Okay' })

  },
  [EXPLAIN_ATTENTION_MARKER_RANGED]: {
    prompt: () => ({ imageSrc: 'images/explain/attentionMarkerRanged.gif', text: 'explain attention markers', yesText: 'Okay' })

  },
  [EXPLAIN_CAMERA]: {
    prompt: () => ({
      imageSrc: 'images/explain/camera-movement.gif', text: ['explain camera movement', keyToHumanReadable(globalThis.controlMap.cameraUp), keyToHumanReadable(globalThis.controlMap.cameraLeft), keyToHumanReadable(globalThis.controlMap.cameraDown), keyToHumanReadable(globalThis.controlMap.cameraRight), keyToHumanReadable(globalThis.controlMap.recenterCamera)], yesText: 'Okay'
    })

  },
  [EXPLAIN_INVENTORY]: {
    prompt: () => ({
      imageSrc: 'images/explain/inventory.gif', text: ['explain inventory', keyToHumanReadable(globalThis.controlMap.openInventory)], yesText: "I'm so organized!"
    })

  },
  [EXPLAIN_LIQUID_DAMAGE]: {
    prompt: () => ({
      gore: true,
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
      imageSrc: 'images/explain/delete-queued-spells.gif', text: ['explain remove spells', keyToHumanReadable(globalThis.controlMap.dequeueSpell)], yesText: 'Okay'
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
      imageSrc: 'images/explain/ping.gif', text: ['explain ping', keyToHumanReadable(globalThis.controlMap.ping)], yesText: 'Cool!'
    })
  },
  [EXPLAIN_BOOKMARKS]: {
    prompt: () => ({
      imageSrc: 'images/explain/bookmarks.gif', text: 'explain bookmarks', yesText: 'Got it!'
    })
  },
  [EXPLAIN_UPGRADE_BOOKMARK]: {
    prompt: () => ({
      imageSrc: 'images/explain/skillpoints.gif', text: 'explain upgrade bookmark', yesText: 'Got it!'
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
  EXPLAIN_FORGE_ORDER,
  EXPLAIN_BOOKMARKS,
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
}
export const tutorialChecklist: TutorialChecklist = {
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
      completedItemsHtml += `<div class="complete">&#x2611; <span class="text complete">${i18n(item.text)}</span></div>`
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
    // Set all enemies as encountered:
    globalThis.enemyEncountered = Object.keys(allUnits);
    storage.set(storage.ENEMY_ENCOUNTERED_STORAGE_KEY, JSON.stringify(globalThis.enemyEncountered));

    // Complete all tutorial tasks
    for (let task of Object.keys(tutorialChecklist)) {
      tutorialCompleteTask(task as keyof TutorialChecklist);
    }
    for (let key of Object.keys(explainMap)) {
      storage.set(key, ALREADY_EXPLAINED);
    }
  }
}
export function tutorialShowTask(key: keyof TutorialChecklist) {
  // This is called to reveal the next step of the tutorial
  // If there are any popups attached to that new step, show them
  if (globalThis.doUpdateTutorialChecklist) {
    const task = tutorialChecklist[key];
    if (task) {
      task.visible = true;
      for (let popup of task.showExplainPopup) {
        explain(popup);
      }
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
    storage.remove(getTutorialStorageKey(key));
  }
  setTutorialVisiblity(true);
  // Reset all explain prompts when tutorial is reset
  for (let explainKey of explainKeys) {
    storage.remove(explainKey);
  }
  globalThis.enemyEncountered = [];
  storage.remove(storage.ENEMY_ENCOUNTERED_STORAGE_KEY);
  Jprompt({ text: 'Tutorial will reset after the game is restarted.', yesText: 'Okay', forceShow: true });
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

// Used to determine whether or not the player has gone through
// the first few steps of the tutorial, and has a basic understanding of the game
export function isTutorialFirstStepsComplete(steps: (keyof TutorialChecklist)[] = ['moved', 'portal', 'camera', 'cast']) {
  if (globalThis.headless) {
    // Never run the tutorial on a headless server because it is hosting games for clients
    return true;
  }
  if (steps.every(key => tutorialChecklist[key].complete)) {
    return true;
  } else {
    return false;
  }
}