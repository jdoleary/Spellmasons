import * as PIXI from 'pixi.js';
// window.pixi must be set before ANY other js files are
// processes so that files know that this isn't a headless
// instance
window.pixi = PIXI;

// Setup globals that svelte-bundle menu needs

window.setupPixiPromise = new Promise((resolve) => {
    window.pixiPromiseResolver = resolve;
})
window.volume = 1.0;
window.volumeMusic = 1.0;
window.volumeGame = 1.0;
// TODO: Remove from svelte menu, music is now played when level is created.
// TODO: Ensure music works on electron without being associated with a button press
window.playMusic = () => { };
console.log('Setup: presetup.ts')