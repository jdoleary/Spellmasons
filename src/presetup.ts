if (globalThis.isElectron) {
    console.log('globalThis.isElectron == true; RUNNING AS DESKTOP APP')
}
import { version } from '../package.json';
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
import { enableRemoteLogging } from './RemoteLogging';
enableRemoteLogging();
console.log('Setup: presetup.ts')
import './localization';
import * as PIXI from 'pixi.js';
import * as storage from './storage';
import { setupAudio } from './Audio';
// globalThis.pixi must be set before ANY other js files are
// processes so that files know that this isn't a headless
// instance
globalThis.pixi = PIXI;

// Setup globals that svelte-bundle menu needs

globalThis.setupPixiPromise = new Promise((resolve) => {
    globalThis.pixiPromiseResolver = resolve;
})
globalThis.volume = 1.0;
globalThis.volumeMusic = 0.6;
globalThis.volumeGame = 0.6;
globalThis.cinematicCameraEnabled = true;
globalThis.savePrefix = 'spellmasons-save-';
globalThis.quicksaveKey = 'quicksave';
// Never commit this to true.  To make a demo build, you should
// toggle this to true, make the build and toggle it back off
globalThis.isDemo = false;
globalThis.emitters = [];
globalThis.timeLastChoseUpgrade = Date.now();
// setupAudio must be invoked before getSavedData so that the saved audio
// options can persist
setupAudio();


storage.getSavedData();
// TODO: Remove from svelte menu, music is now played when level is created.
// TODO: Ensure music works on electron without being associated with a button press
globalThis.playMusic = () => { };