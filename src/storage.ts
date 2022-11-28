import { areCookiesAllowed } from "./cookieConsent";

// Make deep copy of globalThis.cachedDiskStorageObject
// because the global version is immutable because it was set in electron
// and we need a mutable copy so that we can update it in this file when
// what is stored changes.
const cachedStorageObject = JSON.parse(JSON.stringify(globalThis.cachedDiskStorageObject));
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
            if (cachedStorageObject) {
                cachedStorageObject[key] = value;
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
            if (cachedStorageObject) {
                const savedValue = cachedStorageObject[key] || null;
                console.log('storage: get from diskStorage ', key, 'as', savedValue);
                return savedValue;
            } else {
                console.error('cachedDiskStorageObject is undefined');
                return null;
            }
        } else {
            const savedValue = localStorage.getItem(key);
            console.log('storage: get', key, 'as', savedValue);
            return savedValue;
        }
    } else {
        console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
        return null;
    }

}
globalThis.storageSet = set;
globalThis.storageGet = get;