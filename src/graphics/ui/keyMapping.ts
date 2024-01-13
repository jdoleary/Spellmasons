import * as storage from '../../storage';
const originalMapping = Object.freeze({
    showWalkRope: ['KeyF'],
    dequeueSpell: ['Backspace'],
    openInventory: ['Tab', 'KeyI'],
    ping: ['KeyC'],
    recenterCamera: ['KeyZ'],
    endTurn: ['Space'],
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
    spellRight1: ['ctrlKey+Digit1'],
    spellRight2: ['ctrlKey+Digit2'],
    spellRight3: ['ctrlKey+Digit3'],
    spellRight4: ['ctrlKey+Digit4'],
    spellRight5: ['ctrlKey+Digit5'],
    spellRight6: ['ctrlKey+Digit6'],
    spellRight7: ['ctrlKey+Digit7'],
    spellRight8: ['ctrlKey+Digit8'],
    spellRight9: ['ctrlKey+Digit9'],
    cameraUp: ['KeyW'],
    cameraDown: ['KeyS'],
    cameraLeft: ['KeyA'],
    cameraRight: ['KeyD'],
    touchPadMoveCharacter: ['KeyG'],
    openChat: ['KeyT'],
    adminPowerBar: ['ctrlKey+Space']
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
    const { ctrlKey, shiftKey, altKey } = modifierKeys || { ctrlKey: false, shiftKey: false, altKey: false };
    for (let [mapCode, array] of Object.entries(globalThis.controlMap)) {
        for (let code of array) {
            const parts = code.split('+');
            const keyCodeSansModifiers = parts[parts.length - 1];
            const keyCodeCtrlKey = parts.includes('ctrlKey');
            const keyCodeShiftKey = parts.includes('shiftKey');
            const keyCodeAltKey = parts.includes('altKey');
            if (keyCodeSansModifiers == keyCode
                && keyCodeCtrlKey == ctrlKey
                && keyCodeShiftKey == shiftKey
                && keyCodeAltKey == altKey
            ) {
                return mapCode;
            }
        }
    }
    return undefined;
}
globalThis.persistControls = () => {
    storage.set(storage.STORAGE_CONTROLS_KEY, JSON.stringify(globalThis.controlMap));
}