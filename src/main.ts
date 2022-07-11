import * as Unit from './entity/Unit';
import './types/globalTypes';
import { setView, View } from './views';
import * as readyState from './readyState';
import { setupPixi } from './graphics/PixiUtils';
import * as Cards from './cards';
import * as Units from './entity/units';
import { initPlanningView } from './graphics/PlanningView';
import { setupAudio } from './Audio';
import cookieConsentPopup from './cookieConsent';
import { setupMonitoring } from './monitoring';
import * as storage from './storage';
import { version } from '../package.json';
import { Faction, UnitType } from './types/commonTypes';
window.SPELLMASONS_PACKAGE_VERSION = version;
import './style.css';
cookieConsentPopup(false);


// This import is critical so that the svelte menu has access to
// the pie globals
import './network/wsPieSetup';
import { ENEMY_ENCOUNTERED_STORAGE_KEY } from './config';
import { syncInventory } from './graphics/ui/CardUI';

const YES = 'yes'
const SKIP_TUTORIAL = 'skipTutorial';

// set window defaults, must be called before setupAll()
window.volume = 1.0;
window.volumeMusic = 1.0;
window.volumeGame = 1.0;
window.playerWalkingPromise = Promise.resolve();
window.predictionUnits = [];
window.attentionMarkers = [];
window.resMarkers = [];
window.lastThoughtsHash = '';
window.playerThoughts = {};
window.forceMove = [];
window.devMode = location.href.includes('localhost');
window.zoomTarget = 1.3;
// If the code in main runs this is NOT a headless instance, main.ts is the entrypoint for
// the regular game with graphics and audio
window.headless = false;
if (window.devMode) {
  console.log('ADMIN: devMode = true! Character and upgrades will be picked automatically.');
}

setupAll();

function setupAll() {
  // Start monitoring with development overlay
  setupMonitoring();

  setupAudio();

  // Start up menu script now that the window globals are assigned
  var script = document.createElement('script');
  script.src = 'svelte-bundle.js';
  script.async = false;
  document.body.appendChild(script);

  // Initialize Assets
  console.log("Setup: Loading Pixi assets...")
  window.setupPixiPromise = setupPixi().then(() => {
    readyState.set('pixiAssets', true);
    console.log("Setup: Done loading Pixi assets.")
    // Initialize content
    Cards.registerCards();
    Units.registerUnits();
    initPlanningView();
    readyState.set("content", true);
    // if (storage.get(SKIP_TUTORIAL) === YES) {
    window.setMenu('PLAY');
    setView(View.Menu);
    // } else {
    //   window.setMenu('TUTORIAL');
    //   startTutorial();
    // }
  }).catch(e => {
    console.error('Setup: Failed to setup pixi', e);
  });

  const elMenu = document.getElementById('menu');
  if (elMenu) {
    // Reveal the menu now that the global variables needed by svelte are set.
    elMenu.classList.add('ready');

  } else {
    // This should never happen
    console.error('Cannot find "menu" element in DOM');
  }

  // Set UI version info
  const elVersionInfo = document.getElementById('version-info')
  if (elVersionInfo && window.SPELLMASONS_PACKAGE_VERSION) {
    elVersionInfo.innerText = `Alpha v${window.SPELLMASONS_PACKAGE_VERSION}\nGraphics may not be final`;
  }
}

// For development, spawns a unit near the player
window.devSpawnUnit = (unitId: string, faction: Faction = Faction.ENEMY) => {
  if (window.player) {
    const coords = window.underworld.findValidSpawn(window.player.unit, 5)
    const sourceUnit = Units.allUnits[unitId];
    if (coords && sourceUnit) {
      Unit.create(
        unitId,
        // Start the unit at the summoners location
        coords.x,
        coords.y,
        // A unit always summons units in their own faction
        faction,
        sourceUnit.info.image,
        UnitType.AI,
        sourceUnit.info.subtype,
        1,
        sourceUnit.unitProps
      );
    }

  }
}
window.devSpawnAllUnits = () => {
  for (let id of Object.keys(Units.allUnits)) {
    window.devSpawnUnit(id, Faction.ENEMY);
  }
}
window.setMMBDown = (isDown: boolean) => {
  // I want it to show a compile error anywhere else
  // @ts-expect-error Override "readyonly" error.  This is the ONLY place that MMBDown should be mutated.
  window.MMBDown = isDown;
  document.body.classList.toggle('draggingCamera', window.MMBDown);
}
window.setRMBDown = (isDown: boolean) => {
  // I want it to show a compile error anywhere else
  // @ts-expect-error Override "readyonly" error.  This is the ONLY place that RMBDown should be mutated.
  window.RMBDown = isDown;
}
window.skipTutorial = () => {
  storage.set(SKIP_TUTORIAL, YES);
}
window.enemyEncountered = JSON.parse(storage.get(ENEMY_ENCOUNTERED_STORAGE_KEY) || '[]');
console.log('Setup: initializing enemyEncountered as', window.enemyEncountered);

window.superMe = () => {
  if (window.player) {

    window.player.unit.health = 10000;
    window.player.unit.healthMax = 10000;
    window.player.unit.mana = 10000;
    window.player.unit.manaMax = 10000;
    // Give me all cards
    Object.keys(Cards.allCards).forEach(window.giveMeCard);
    // Run farther! Jump higher!
    window.player.unit.staminaMax = 10000;
    window.player.unit.stamina = window.player.unit.staminaMax;
    window.player.unit.moveSpeed = 0.3;
    // Now that player's health and mana has changed we must sync
    // predictionUnits so that the player's prediction copy
    // has the same mana and health
    window.underworld.syncPredictionUnits();
    syncInventory(undefined);
  }
}
window.showDebug = false;

// Prevent accidental back button only when not in devMode
// In devMode, lots of refreshing happens so it's annoying when it
// asks "are you sure?" every time
if (!window.devMode) {
  window.onbeforeunload = function () { return "Are you sure you want to quit?"; };
}