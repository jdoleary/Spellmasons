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
globalThis.controlMap = mapping;
export default mapping;

export function fullyUpdateControls(newMapping: any) {
    // Overwrite mapping with newMappping while maintaining the object reference
    Object.assign(mapping, newMapping);

}

export function keyToHumanReadable(keyboardKeys: string[]): string {
    return keyboardKeys.map(keyString =>
        `<kbd>${keyString
            .split('Digit').join('')
            .split('Key').join('')}</kbd>`).join(' or ');
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
    storage.set(storage.STORAGE_CONTROLS_KEY, JSON.stringify(mapping));
}