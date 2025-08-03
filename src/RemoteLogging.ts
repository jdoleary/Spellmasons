import type Underworld from "./Underworld";
import { SERVER_HUB_URL } from "./config";
import { STORAGE_OPT_IN_REMOTE_LOGGING } from "./storage";

const YES = 'yes';
const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;
export function enableRemoteLogging() {
    if (globalThis.headless) {
        // Squelch console.debug so as to not flood server logs
        console.debug = () => { }
        // headless servers should not log due to privacy policy
        return;
    }

    if (!globalThis.headless && location.href.includes('localhost')) {
        console.warn('Remote Logging is disabled for localhost development')
        return;
    }

    if (storageGet(STORAGE_OPT_IN_REMOTE_LOGGING) !== YES) {
        console.log("Privacy: User has opted out of remote logging. Remote logging will not occur.");
        return;
    }

    console.error = function () {
        if (storageGet(STORAGE_OPT_IN_REMOTE_LOGGING) === YES) {
            sendLogToServerHub(Array.from(arguments), LogLevel.ERROR);
        }

        // Call the original console.error function
        // @ts-ignore
        originalConsoleError.apply(console, arguments);
    };

    globalThis.remoteLog = (...args: any[]) => {
        if (globalThis.headless || globalThis.privacyPolicyAndEULAConsent) {
            if (storageGet(STORAGE_OPT_IN_REMOTE_LOGGING) === YES) {
                sendLogToServerHub(args, LogLevel.LOG);
            }
        }
    }
    globalThis.remoteLogWithContext = (message: string, level: LogLevel, context: string) => {
        if (globalThis.headless || globalThis.privacyPolicyAndEULAConsent) {
            if (storageGet(STORAGE_OPT_IN_REMOTE_LOGGING) === YES) {
                sendLogToServerHub([message], level, context);
            }
        }
    }

    // console.warn = function () {
    //     sendLogToServerHub(Array.from(arguments), LogLevel.WARN);

    //     // Call the original console.warn function
    //     // @ts-ignore
    //     originalConsoleWarn.apply(console, arguments);
    // };
}
globalThis.remoteLog = (...args: any[]) => {
    // Squelch until enabled
}
globalThis.remoteLogWithContext = (message: string, level: LogLevel, context: string) => {
    // Squelch until enabled
}
// Copied from spellmasons-server-hub
interface EventGroupMessage {
    seed: string; // Required to identify EventGroup
    gameName: string; // Required to identify EventGroup
    startTime?: number;
    endTime?: number;
    serverRegion?: string;
    events: Event[];
}
// Copied from spellmasons-server-hub
interface Event {
    time: number;
    message: string;
}
export function sendEventToServerHub(eventG: Partial<EventGroupMessage>, underworld: Underworld) {
    if (globalThis.headless && globalThis.useEventLogger) {
        const eventGroup = Object.assign({
            seed: underworld.seed,
            gameName: underworld.pie.currentRoomInfo?.name || 'default',
            serverRegion: process.env.serverRegion || undefined,
            events: [],
        }, eventG)
        fetch(`${SERVER_HUB_URL}/event`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventGroup)
        }).catch(_ => {
            originalConsoleError('Remote Event Logging failed');
        });
    }

}
// recentLogs holds logs for an amount of time to prevent oversending
// the same logs that may occur, for example, if mousemove causes an error
let recentLogs: { m: string, d: number }[] = [];
// ctx represents individual context for a particular error that will still be grouped under message
function sendLogToServerHub(args: any[], l: LogLevel, ctx?: string) {
    if (!globalThis.headless && !globalThis.privacyPolicyAndEULAConsent) {
        return;
    }
    if (!globalThis.headless && location && location.href.includes('localhost')) {
        console.debug('on localhost: do not log remotely', args.join(' '));
        return;
    }
    const log: Log = {
        m: args.join(' '),
        v: globalThis.SPELLMASONS_PACKAGE_VERSION,
        r: globalThis.headless ? RUNNER.SERVER : RUNNER.BROWSER,
        l,
        d: Date.now(),
        e: ENV.UNKNOWN,
        ctx
    }
    const now = Date.now();
    // Only hold logs for 10 seconds
    recentLogs = recentLogs.filter(entry => {
        const ago = now - entry.d;
        return ago < 10_000;
    })
    if (recentLogs.find(entry => entry.m == log.m)) {
        // Omitts FLOODing logs
    } else {
        fetch(`${SERVER_HUB_URL}/log`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        }).catch(_ => {
            originalConsoleError('Remote Logging failed');
        });
    }
    recentLogs.push({ m: log.m, d: log.d });

}

// START: interfaces and enums copied from spellmasons-server-hub/app/logs.ts
export enum LogLevel {
    DEBUG,
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
    e: ENV
    // optional context for the message, will be aggregated into
    // a revolving array
    ctx?: string;
}
// END: interfaces and enums copied from spellmasons-server-hub/app/logs.ts