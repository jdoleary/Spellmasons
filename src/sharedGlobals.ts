// Shared Globals are shared between headless and non

// Type guard that checks if a value is null or undefined
globalThis.isNullOrUndef = <T>(x: T): x is Extract<T, null | undefined> => {
    return x === undefined || x === null;
};

// Type guard that checks if a value exists (is not null or undefined)
globalThis.exists = <T>(x: T): x is NonNullable<T> => {
    return !globalThis.isNullOrUndef(x);
};