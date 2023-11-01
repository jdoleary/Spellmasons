
const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;
export function enableRemoteLogging() {

    console.error = function () {
        sendLogToServerHub(Array.from(arguments), LogLevel.ERROR);

        // Call the original console.error function
        // @ts-ignore
        originalConsoleError.apply(console, arguments);
    };

    // console.warn = function () {
    //     sendLogToServerHub(Array.from(arguments), LogLevel.WARN);

    //     // Call the original console.warn function
    //     // @ts-ignore
    //     originalConsoleWarn.apply(console, arguments);
    // };
}
function sendLogToServerHub(args: any[], l: LogLevel) {
    const log: Log = {
        m: args.join(' '),
        v: globalThis.SPELLMASONS_PACKAGE_VERSION,
        r: globalThis.headless ? RUNNER.SERVER : RUNNER.BROWSER,
        l,
        d: new Date().getTime(),
        e: ENV.UNKNOWN
    }
    fetch("https://server-hub-d2b2v.ondigitalocean.app/log", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
    }).catch(_ => {
        originalConsoleError('Remote Logging failed');
    });

}

// START: interfaces and enums copied from spellmasons-server-hub/app/logs.ts
enum LogLevel {
    TRACE,
    LOG,
    WARN,
    ERROR
}
enum RUNNER {
    BROWSER,
    SERVER
}

enum ENV {
    DEV,
    STAGING,
    PROD,
    UNKNOWN
}

export interface Log {
    // message
    m: string;
    // app version
    v: string;
    // runner
    r: RUNNER;
    // level
    l: LogLevel;
    // date
    d: number;
    // environment
    e: ENV;
}
// END: interfaces and enums copied from spellmasons-server-hub/app/logs.ts