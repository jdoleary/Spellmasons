export default {
    showWalkRope: 'KeyF',
    clearQueuedSpell: 'Escape',
    dequeueSpell: 'Backspace',
    openInventory: 'Tab',
    openInventory2: 'KeyI',
    ping: 'KeyC',
    recenterCamera: 'KeyZ',
    endTurn: 'Space',
    spell1: 'Digit1',
    spell2: 'Digit2',
    spell3: 'Digit3',
    spell4: 'Digit4',
    spell5: 'Digit5',
    spell6: 'Digit6',
    spell7: 'Digit7',
    spell8: 'Digit8',
    spell9: 'Digit9',
    spell10: 'Digit0',
    cameraUp: 'KeyW',
    cameraDown: 'KeyS',
    cameraLeft: 'KeyA',
    cameraRight: 'KeyD',
}

export function keyToHumanReadable(keyboardKey: string): string {
    return keyboardKey
        .split('Digit').join('')
        .split('Key').join('');
}