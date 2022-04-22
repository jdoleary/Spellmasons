export function save(key: string, value: any) {
    if (window.allowCookies) {
        localStorage.setItem(key, value);
    } else {
        console.log(`Could not save "${key}" to storage, without cookie consent`);
    }
}
export function assign(key: string, value: object) {
    if (window.allowCookies) {
        const obj = localStorage.getItem(key);
        let json = {};
        if (obj) {
            json = JSON.parse(obj);
        }
        const options = JSON.stringify(Object.assign(json, value))
        localStorage.setItem(key, options);
    } else {
        console.log(`Could not add "${key}" to storage, without cookie consent`);
    }
}
export function get(key: string): string | null {
    if (window.allowCookies) {
        return localStorage.getItem(key);
    } else {
        console.log(`Could not retrieve "${key}" from storage, without cookie consent`);
        return null;
    }

}