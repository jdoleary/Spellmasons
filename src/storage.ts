import { areCookiesAllowed } from "./cookieConsent";
export const STORAGE_OPTIONS = 'OPTIONS';
export const STORAGE_LANGUAGE_CODE_KEY = 'language';
let cachedSettings: { [key: string]: string } = {};
// Initialize settings once the settings object is loaded
// If this is running as an electron app, get settings from storage
// If this is not running as an electron app, just resolve immediately
// because settings can be gotten syncronously from local storage
(globalThis.isElectron && globalThis.diskStorage ?
    globalThis.diskStorage.getDiskStorage().then(settings => {
        cachedSettings = settings;
        console.log('Setup: Got settings from disk:', cachedSettings);
    })
    : Promise.resolve())
    .then(() => {
        // Default language to english if no language is stored:
        const storedLanguageCode = get(STORAGE_LANGUAGE_CODE_KEY);
        setLanguage(storedLanguageCode ? storedLanguageCode : 'en', false);
        // Retrieve audio settings from storage
        const storedOptions = get(STORAGE_OPTIONS);
        if (storedOptions !== null) {
            const options = JSON.parse(storedOptions);
            if (globalThis.changeVolume && options.volume !== undefined) {
                globalThis.changeVolume(options.volume, false);
            }
            if (globalThis.changeVolumeMusic && options.volumeMusic !== undefined) {
                globalThis.changeVolumeMusic(options.volumeMusic, false);
            }
            if (globalThis.changeVolumeGame && options.volumeGame !== undefined) {
                globalThis.changeVolumeGame(options.volumeGame, false);
            }
        }
    });

export function remove(key: string) {
    localStorage.removeItem(key);
}
export function set(key: string, value: any) {
    console.log('Setting ', key, 'to', value, 'in local storage');
    if (globalThis.headless) {
        // Headless server does not use storage
        return;
    }
    if (globalThis.isElectron || globalThis.allowCookies) {
        if (globalThis.diskStorage) {
            if (cachedSettings) {
                cachedSettings[key] = value;
            } else {
                console.error('cachedDiskStorageObject is undefined');
            }
            globalThis.diskStorage.set(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    } else {
        console.log(`Could not save "${key}" to storage, without cookie consent`);
    }
}
export function assign(key: string, value: object) {
    if (globalThis.allowCookies) {
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
    if (globalThis.allowCookies || areCookiesAllowed()) {
        if (globalThis.diskStorage) {
            if (cachedSettings) {
                const savedValue = cachedSettings[key] || null;
                console.log('storage: get from diskStorage ', key, 'as', savedValue);
                return savedValue;
            } else {
                console.error('cachedDiskStorageObject is undefined');
                return null;
            }
        } else {
            const savedValue = localStorage.getItem(key);
            console.log(`storage: get "${key}" as ${savedValue}`);
            return savedValue;
        }
    } else {
        console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
        return null;
    }

}
globalThis.storageSet = set;
globalThis.storageGet = get;