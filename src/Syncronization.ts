import * as Unit from "./entity/Unit"
import { UnitType } from "./types/commonTypes";

// syncUnits should:
// NOT remove any existing player's units (even if there are discrepancies)
//   Note: Missing player unit's should be sent to the server from clients
//   This should piggy back on CLIENT_SEND_PLAYER_TO_SERVER
// Sync the state of identityMatched units (same id, same type, same sourceId)
// Remove current units not in the serialized units array (so long as they are not player units)
// Create missing units from the serialized array (careful not to overwrite ids of existing units)

// TODO: INPROGRESS (replace `any`s) maybe use a subtype so it's testable without constructing a whole underworld
interface syncFunctionReturn {
    // Which objects should be synced,
    // first is from `current`
    // last is from `syncFrom`
    sync: [any, any][];
    //  current to remove
    remove: any[];
    //  Current objects to send to the server
    syncToServer: any[];
    // Objects of syncFrom to create new
    create: any[];

}
// Identity match determines if the units are the same entity (and then it's okay to sync from syncFrom to current for that entity)
export function getSyncActions(
    current: any[],
    syncFrom: any[],
    findMatchIndex: (a: any, potentialMatches: any[]) => number,
    ignoreSync: (a: any) => boolean): syncFunctionReturn {
    const ret: syncFunctionReturn = {
        sync: [],
        remove: [],
        syncToServer: [],
        create: []
    }
    const matches: any[] = []
    for (let i = 0; i < current.length; i++) {
        const e = current[i];
        const matchIndex = findMatchIndex(e, syncFrom);
        const match = syncFrom[matchIndex]
        if (match) {
            // Keep track of what synced so we can create the extras in syncFrom as new
            matches.push(match);
            ret.sync.push([e, match]);
        } else {
            if (!ignoreSync(e)) {
                ret.remove.push(e);
            } else {
                ret.syncToServer.push(e);
            }
        }
    }
    const toBeCreated = syncFrom.filter(x => !matches.includes(x));
    for (let e of toBeCreated) {
        ret.create.push(e);
    }
    return ret;

}