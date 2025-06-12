if (globalThis.isElectron) {
    console.log('globalThis.isElectron == true; RUNNING AS DESKTOP APP')
}
import { version } from '../package.json';
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
import { enableRemoteLogging } from './RemoteLogging';
enableRemoteLogging();
import { setupMonitoring } from './monitoring';
// Setup monitoring as soon as possible
setupMonitoring();
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
globalThis.peerLobbyId = '';
globalThis.peers = new Set<string>();
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

// Type guard that checks if a value is null or undefined
globalThis.isNullOrUndef = <T>(x: T): x is Extract<T, null | undefined> => {
    return x === undefined || x === null;
};

// Type guard that checks if a value exists (is not null or undefined)
globalThis.exists = <T>(x: T): x is NonNullable<T> => {
    return !globalThis.isNullOrUndef(x);
};