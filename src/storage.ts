import { areCookiesAllowed } from "./cookieConsent";

export function set(key: string, value: any) {
    if (globalThis.headless) {
        // Headless server does not use storage
        return;
    }
    if (globalThis.allowCookies) {
        localStorage.setItem(key, value);
        console.log('Setting ', key, 'to', value, 'in local storage');
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
        localStorage.setItem(key, options);
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
        return localStorage.getItem(key);
    } else {
        console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
        return null;
    }

}