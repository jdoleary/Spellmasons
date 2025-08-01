import { areCookiesAllowed } from "./cookieConsent";
import { robeColors } from "./graphics/ui/colors";
import { fullyUpdateControls } from "./graphics/ui/keyMapping";
export const STORAGE_OPTIONS = 'OPTIONS';
export const STORAGE_LANGUAGE_CODE_KEY = 'language';
export const STORAGE_ID_PLAYER_COLOR = 'player-color';
export const STORAGE_ID_PLAYER_COLOR_MAGIC = 'player-color-magic';
export const STORAGE_ID_PLAYER_NAME = 'player-name';
export const STORAGE_ID_WIZARD_TYPE = 'wizard-type';
export const STORAGE_ID_UI_ZOOM = 'uiZoom';
export const STORAGE_CONTROLS_KEY = 'controls';
export const ENEMY_ENCOUNTERED_STORAGE_KEY = 'enemyEncountered';
export const SPELLS_DISCOVERED_STORAGE_KEY = 'spellsDiscovered';
export const STORAGE_PIE_CLIENTID_KEY = 'clientId';
export const STORAGE_OPT_IN_REMOTE_LOGGING = 'remote-logging-opt-in';
const ACCESSIBILITY_OUTLINE_STORAGE_KEY = 'accessibilityOutlineNew';
globalThis.STORAGE_ID_UI_ZOOM = STORAGE_ID_UI_ZOOM;
globalThis.enemyEncountered = [];
globalThis.spellsDiscovered = [];

export function getSavedData() {
  if (globalThis.headless) {
    // Headless server does not use storage
    return;
  }
  // Initialize settings once the settings object is loaded
  // If this is running as an electron app, get settings from storage
  // If this is not running as an electron app, just resolve immediately
  // because settings can be gotten syncronously from local storage
  (globalThis.isElectron && globalThis.diskStorage ?
    globalThis.diskStorage.getDiskStorage().then(settings => {
      console.log('Setup: Got settings from disk:', settings);
      // Cache settings from disk in localStorage so they can
      // be access syncronously
      for (let [key, value] of Object.entries(settings || {})) {
        localStorage.setItem(key, value);
      }
    })
    : Promise.resolve())
    .then(() => {
      // Default language to english if no language is stored:
      const storedLanguageCode = get(STORAGE_LANGUAGE_CODE_KEY);
      setLanguage(storedLanguageCode ? storedLanguageCode : 'en', false);
      // Retrieve settings from storage
      const storedOptions = get(STORAGE_OPTIONS);
      console.log('Setup: Initializing saved settings', storedOptions);
      if (storedOptions !== null) {
        const options = JSON.parse(storedOptions);
        console.log('[OPTIONS] noGore', options.noGore);
        globalThis.noGore = options.noGore;
        if (options.fontOverride && globalThis.setFontOverride) {
          globalThis.setFontOverride(options.fontOverride);
        }
        globalThis.noScreenshake = options.noScreenshake;
        if (exists(options.cinematicCameraEnabled)) {
          globalThis.cinematicCameraEnabled = options.cinematicCameraEnabled;
        }
        if (exists(options.volume)) {
          globalThis.changeVolume?.(options.volume, false)
        }
        if (exists(options.volumeMusic)) {
          globalThis.changeVolumeMusic?.(options.volumeMusic, false)
        }
        if (exists(options.volumeGame)) {
          globalThis.changeVolumeGame?.(options.volumeGame, false)
        }
        if (exists(options.UIEasyOnTheEyes)) {
          globalThis.UIEasyOnTheEyes = options.UIEasyOnTheEyes;
        }
        if (exists(options.limitParticleEmitters)) {
          globalThis.limitParticleEmitters = options.limitParticleEmitters;
        }
        if (exists(options.alwaysDrawHealthBars)) {
          globalThis.alwaysDrawHealthBars = options.alwaysDrawHealthBars;
        }
        globalThis.activeMods = [];
        if (!!options.activeMods) {
          globalThis.activeMods = options.activeMods;
        }
      }
      const storedAccessibilityOutline = get(ACCESSIBILITY_OUTLINE_STORAGE_KEY);
      console.log('Setup: Initializing outline settings', storedAccessibilityOutline);
      if (storedAccessibilityOutline !== null) {
        globalThis.remoteLog?.('Accessibility Outlines: Active')
        try {
          globalThis.accessibilityOutline = JSON.parse(storedAccessibilityOutline);
        } catch (e) {
          console.error('Failled to parse stored accessibility outline options', storedAccessibilityOutline)
        }
      } else {
        globalThis.remoteLog?.('Accessibility Outlines: Inactive')
      }
      globalThis.playMusicIfNotAlreadyPlaying?.();
      // Default stored color if player doesn't already have one stored
      const color = get(STORAGE_ID_PLAYER_COLOR);
      if (!color) {
        const newColor = robeColors[Math.floor(Math.random() * robeColors.length)] || 0xef476f;
        set(STORAGE_ID_PLAYER_COLOR, newColor);
      }
      // Set uiZoom:
      if (globalThis.isElectron) {
        if (globalThis.electronSettings) {
          const uiZoom = get(STORAGE_ID_UI_ZOOM);
          if (uiZoom) {
            globalThis.electronSettings.setUIZoom(parseFloat(uiZoom));
          }
        } else {
          console.error('globalThis.electronSettings is undefined, cannot set uiZoom');
        }
      }
      // Update controls:
      // Get saved controls from storage:
      const savedControls = JSON.parse(get(STORAGE_CONTROLS_KEY) || '{}');
      console.log('Retrieved saved controls:', savedControls);
      fullyUpdateControls(savedControls);
      // Update enemy encountered:
      globalThis.enemyEncountered = JSON.parse(get(ENEMY_ENCOUNTERED_STORAGE_KEY) || '[]');
      console.log('Setup: initializing enemyEncountered as', globalThis.enemyEncountered);
      // Update spells discovered:
      globalThis.spellsDiscovered = JSON.parse(get(SPELLS_DISCOVERED_STORAGE_KEY) || '[]');
      console.log('Setup: initializing spellsDiscovered as', globalThis.spellsDiscovered);
    });
}

export function remove(key: string) {
  if (globalThis.headless) {
    // Headless server does not use storage
    return;
  }
  localStorage.removeItem(key);
  if (globalThis.isElectron) {
    if (globalThis.diskStorage) {
      globalThis.diskStorage.remove(key);
    }
  }
}
export function set(key: string, value: any) {
  console.debug('Setting ', key, 'to', value.toString().slice(0, 64), 'in local storage');
  if (globalThis.headless) {
    // Headless server does not use storage
    return;
  }
  if (globalThis.isElectron || globalThis.privacyPolicyAndEULAConsent) {
    if (globalThis.diskStorage) {
      // Store both on disk and in local storage
      // because local storage is used for accessing the
      // settings in game while the diskStorage is only used
      // once when the app boots
      localStorage.setItem(key, value);
      globalThis.diskStorage.set(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } else {
    console.log(`Could not save "${key}" to storage, without cookie consent`);
  }
}
export function assign(key: string, value: object) {
  if (globalThis.privacyPolicyAndEULAConsent) {
    const obj = localStorage.getItem(key);
    let json = {};
    if (obj) {
      json = JSON.parse(obj);
    }
    console.log('Changing ', value, 'in', key, 'in local storage');
    const options = JSON.stringify(Object.assign(json, value))
    set(key, options);
  } else {
    console.log(`Could not add "${key}" to storage, without cookie consent`);
  }
}
export function get(key: string): string | null {
  if (globalThis.headless) {
    // Headless server does not use storage
    return null;
  }
  if (globalThis.privacyPolicyAndEULAConsent || areCookiesAllowed()) {
    const savedValue = localStorage.getItem(key);
    return savedValue;
  } else {
    console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
    return null;
  }
}

globalThis.setCinematicCameraEnabled = (enabled: boolean, saveSetting: boolean = true) => {
  globalThis.cinematicCameraEnabled = enabled;
  if (saveSetting) {
    assign(STORAGE_OPTIONS, { cinematicCameraEnabled: enabled });
  }
};
globalThis.setFontOverride = (font: string) => {
  assign(STORAGE_OPTIONS, { fontOverride: font });
  if (font == 'arial') {
    document.body.classList.toggle(`font-arial`, true);
  } else {
    document.body.classList.toggle(`font-arial`, false);
  }

}
globalThis.storageSet = set;
globalThis.storageGet = get;
