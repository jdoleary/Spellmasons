// set window defaults, must be called before setupAll()
import { setupPixi } from './graphics/PixiUtils';
import { initPlanningView } from './graphics/PlanningView';
import { setupAudio, playNextSong, playSFX, playSFXKey, sfx } from './Audio';
import cookieConsentPopup from './cookieConsent';
import { setupMonitoring } from './monitoring';
import * as storage from './storage';
import { version } from '../package.json';
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
import './style.css';
import './svelte-bundle.css';
cookieConsentPopup(false);


// This import is critical so that the svelte menu has access to
// the pie globals
import './network/wsPieSetup';
import { IHostApp, typeGuardHostApp } from './network/networkUtil';
import Underworld from './Underworld';
import type PieClient from '@websocketpie/client';
import { setupPieAndUnderworld } from './network/wsPieSetup';
import { returnToDefaultSprite } from './entity/Unit';
import Jprompt from './graphics/Jprompt';

const YES = 'yes'
const SKIP_TUTORIAL = 'skipTutorial';

// Globalize injected Audio functions
globalThis.playNextSong = playNextSong;
globalThis.playSFX = playSFX;
globalThis.playSFXKey = playSFXKey;
globalThis.sfx = sfx;

globalThis.lobbyPlayerList = [];

globalThis.playerWalkingPromise = Promise.resolve();
globalThis.attentionMarkers = [];
globalThis.resMarkers = [];
globalThis.devMode = location.href.includes('localhost');
globalThis.adminMode = location.href.includes('localhost');
globalThis.zoomTarget = 1.8;
// If the code in main runs this is NOT a headless instance, main.ts is the entrypoint for
// the regular game with graphics and audio
globalThis.headless = false;
globalThis.isHost = (pie: PieClient | IHostApp) => {
  // isHost only if playing singleplayer, otherwise the headless hostApp is the host
  // and this file is the entry point to the non-headless client so it will never be the
  // hostApp
  return typeGuardHostApp(pie) ? true : pie.soloMode;
}
if (globalThis.devMode) {
  console.log('ADMIN: devMode = true! Character and upgrades will be picked automatically. Animations are sped up');
}

setupAll();

function setupAll() {
  // Start monitoring with development overlay
  setupMonitoring();

  setupAudio();


  // Initialize Assets
  console.log("Setup: Loading Pixi assets...")
  setupPixi().then(() => {
    console.log("Setup: Done loading Pixi assets.")
    initPlanningView();
    setupPieAndUnderworld();
    // if (storage.get(SKIP_TUTORIAL) === YES) {
    // } else {
    //   globalThis.setMenu('TUTORIAL');
    //   startTutorial();
    // }
  }).catch(e => {
    console.error('Setup: Failed to setup pixi', e);
  });

  const elMenu = document.getElementById('menu-app');
  if (elMenu) {
    // Reveal the menu now that the global variables needed by svelte are set.
    elMenu.classList.add('ready');

  } else {
    // This should never happen
    console.error('Cannot find "menu" element in DOM');
  }

  // Set UI version info
  const elVersionInfo = document.getElementById('version-info')
  if (elVersionInfo && globalThis.SPELLMASONS_PACKAGE_VERSION) {
    elVersionInfo.innerText = `Client v${globalThis.SPELLMASONS_PACKAGE_VERSION}`;
  }
}

globalThis.setMMBDown = (isDown: boolean) => {
  // This is the ONLY place that MMBDown should be mutated.
  globalThis.MMBDown = isDown;
  document.body?.classList.toggle('draggingCamera', globalThis.MMBDown);
}
globalThis.setRMBDown = (isDown: boolean, underworld: Underworld) => {
  // This is the ONLY place that RMBDown should be mutated.
  globalThis.RMBDown = isDown;
  // Now that player has stopped moving notify multiplayer clients that player has moved
  if (!isDown) {
    if (globalThis.player) {
      returnToDefaultSprite(globalThis.player.unit);
    } else {
      console.error('Cannot send MOVE_PLAYER, globalThis.player is undefined')
    }
  }
  // Reset notifiedOutOfStamina so that when RMB is pressed again, if the 
  // player is out of stamina it will notify them
  globalThis.notifiedOutOfStamina = false;
}
globalThis.skipTutorial = () => {
  storage.set(SKIP_TUTORIAL, YES);
}
globalThis.enemyEncountered = [];

globalThis.showDebug = false;
// Prevent accidental back button only when not in devMode
// In devMode, lots of refreshing happens so it's annoying when it
// asks "are you sure?" every time
if (!globalThis.devMode && !globalThis.isElectron) {
  globalThis.onbeforeunload = function () { return "Are you sure you want to quit?"; };
}

globalThis.fullyExitGame = () => {
  Jprompt({ text: 'Are you sure you wish to exit to Desktop?', noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'Quit', forceShow: true }).then(doQuit => {
    if (doQuit) {
      window.close();
    }
  });

}