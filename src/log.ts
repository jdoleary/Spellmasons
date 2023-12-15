// For logging only on client and not the server
export function client(...args: any[]) {
    if (!globalThis.headless) {
        console.log(...args);
    }

}