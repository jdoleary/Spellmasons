import * as storage from '../../storage';
const mapping = {
    showWalkRope: ['KeyF'],
    clearQueuedSpell: ['Escape'],
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
    spell0: ['Digit0'],
    cameraUp: ['KeyW'],
    cameraDown: ['KeyS'],
    cameraLeft: ['KeyA'],
    cameraRight: ['KeyD'],
}
const STORAGE_CONTROLS_KEY = 'controls';
// Get saved controls from storage:
const savedControls = JSON.parse(storage.get(STORAGE_CONTROLS_KEY) || '{}');
console.log('Retrieved saved controls:', savedControls);
// Overwrite mapping with savedControls while maintaining the object reference
Object.assign(mapping, savedControls);
globalThis.controlMap = mapping;
export default mapping;

export function keyToHumanReadable(keyboardKey: string[]): string {
    const keyString = keyboardKey.join(' or ')
        .split('Digit').join('')
        .split('Key').join('');
    return `<kbd>${keyString}</kbd>`;
}

export function getKeyCodeMapping(keyCode: string): string | undefined {
    for (let [mapCode, array] of Object.entries(mapping)) {
        if (array.includes(keyCode)) {
            return mapCode;
        }
    }
    return undefined;
}
globalThis.persistControls = () => {
    console.log('jtest persist', mapping)
    storage.set(STORAGE_CONTROLS_KEY, JSON.stringify(mapping));
}