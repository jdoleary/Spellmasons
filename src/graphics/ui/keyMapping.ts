import * as storage from '../../storage';
import { updateCardBadges } from './CardUI';
const originalMapping = Object.freeze({
  showWalkRope: ['KeyF'],
  dequeueSpell: ['Backspace'],
  openInventory: ['Tab', 'KeyI'],
  ping: ['KeyC'],
  recenterCamera: ['KeyZ'],
  endTurn: ['Space'],
  cameraUp: ['KeyW'],
  cameraDown: ['KeyS'],
  cameraLeft: ['KeyA'],
  cameraRight: ['KeyD'],
  touchPadMoveCharacter: ['KeyG'],
  openChat: ['KeyT'],
  adminPowerBar: ['ctrlKey+Space'],
  spell1: ['Digit1'],
  spell2: ['Digit2'],
  spell3: ['Digit3'],
  spell4: ['Digit4'],
  spell5: ['Digit5'],
  spell6: ['Digit6'],
  spell7: ['Digit7'],
  spell8: ['Digit8'],
  spell9: ['Digit9'],
  spellLeft1: ['shiftKey+Digit1'],
  spellLeft2: ['shiftKey+Digit2'],
  spellLeft3: ['shiftKey+Digit3'],
  spellLeft4: ['shiftKey+Digit4'],
  spellLeft5: ['shiftKey+Digit5'],
  spellLeft6: ['shiftKey+Digit6'],
  spellLeft7: ['shiftKey+Digit7'],
  spellLeft8: ['shiftKey+Digit8'],
  spellLeft9: ['shiftKey+Digit9'],
  spellLeft1b: [],
  spellLeft2b: [],
  spellLeft3b: [],
  spellLeft4b: [],
  spellLeft5b: [],
  spellLeft6b: [],
  spellLeft7b: [],
  spellLeft8b: [],
  spellLeft9b: [],
  spellLeft1c: [],
  spellLeft2c: [],
  spellLeft3c: [],
  spellLeft4c: [],
  spellLeft5c: [],
  spellLeft6c: [],
  spellLeft7c: [],
  spellLeft8c: [],
  spellLeft9c: [],
  spellRight1: ['ctrlKey+Digit1'],
  spellRight2: ['ctrlKey+Digit2'],
  spellRight3: ['ctrlKey+Digit3'],
  spellRight4: ['ctrlKey+Digit4'],
  spellRight5: ['ctrlKey+Digit5'],
  spellRight6: ['ctrlKey+Digit6'],
  spellRight7: ['ctrlKey+Digit7'],
  spellRight8: ['ctrlKey+Digit8'],
  spellRight9: ['ctrlKey+Digit9'],
  spellRight1b: [],
  spellRight2b: [],
  spellRight3b: [],
  spellRight4b: [],
  spellRight5b: [],
  spellRight6b: [],
  spellRight7b: [],
  spellRight8b: [],
  spellRight9b: [],
  spellRight1c: [],
  spellRight2c: [],
  spellRight3c: [],
  spellRight4c: [],
  spellRight5c: [],
  spellRight6c: [],
  spellRight7c: [],
  spellRight8c: [],
  spellRight9c: [],
});
// Deep copy so mapping itself isn't mutated so it can be reset
globalThis.controlMap = JSON.parse(JSON.stringify(originalMapping));
globalThis.resetControlMap = () => {
  globalThis.controlMap = JSON.parse(JSON.stringify(originalMapping));
}
export default originalMapping;

export function fullyUpdateControls(newMapping: any) {
  // Overwrite mapping with newMappping while maintaining the object reference
  Object.assign(globalThis.controlMap, newMapping);

}

export function keyToHumanReadable(keyboardKeys: string[]): string {
  return keyboardKeys.map(keyString =>
    `<kbd>${keyString
      .split('Digit').join('')
      .split('Key').join('')}</kbd>`).join(' or ');
}

interface ModifierKeys {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;

}
export function getKeyCodeMapping(keyCode: string, modifierKeys?: ModifierKeys): string | undefined {
  // Exception: Escape cannot be rebound because it has multiple
  // uses can no label fits it well
  if (keyCode == 'Escape') {
    return 'Escape';
  }

  // Find a map code with exact match keycode + modifierKeys combo..
  // If no exact match, but there is a mapping for the keyCode alone, use that
  // Reasoning: Unless there is a higher priority binding, if the player presses
  // Shift + W using default controls, we still want the camera to move upward.
  let unModifiedMapCodeMatch = undefined;
  const { ctrlKey, shiftKey, altKey } = modifierKeys || { ctrlKey: false, shiftKey: false, altKey: false };
  for (let [mapCode, array] of Object.entries(globalThis.controlMap)) {
    for (let code of array) {
      const parts = code.split('+');
      const keyCodeSansModifiers = parts[parts.length - 1];
      const keyCodeCtrlKey = parts.includes('ctrlKey');
      const keyCodeShiftKey = parts.includes('shiftKey');
      const keyCodeAltKey = parts.includes('altKey');
      if (keyCodeSansModifiers == keyCode) {
        if (keyCodeCtrlKey == ctrlKey && keyCodeShiftKey == shiftKey && keyCodeAltKey == altKey) {
          // Perfect match, immediately return
          return mapCode;
        } else {
          // The base keyCode matched this map code, but the modifier keys did not
          // If this mapCode does not require any modifier keys, store it
          // This stored mapCode will be used if there is not a higher priority binding
          if (!keyCodeCtrlKey && !keyCodeAltKey && !keyCodeAltKey) {
            if (!unModifiedMapCodeMatch) {
              unModifiedMapCodeMatch = mapCode;
            }
            else {
              console.warn("Multiple keys bound to the same keyCode. Partial match with: ", keyCode, " + ", mapCode);
            }
          }
        }
      }
    }
  }
  if (unModifiedMapCodeMatch) {
    return unModifiedMapCodeMatch;
  }
  //console.warn("DEBUG - No KeyCodeMapping for: ", keyCode, " + ", modifierKeys);
  return undefined;
}

globalThis.persistControls = () => {
  storage.set(storage.STORAGE_CONTROLS_KEY, JSON.stringify(globalThis.controlMap));
}