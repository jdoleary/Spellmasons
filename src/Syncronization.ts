
// syncUnits should:
// NOT remove any existing player's units (even if there are discrepancies)
//   Note: Missing player unit's should be sent to the server from clients
//   This should piggy back on CLIENT_SEND_PLAYER_TO_SERVER
// Sync the state of identityMatched units (same id, same type, same sourceId)
// Remove current units not in the serialized units array (so long as they are not player units)
// Create missing units from the serialized array (careful not to overwrite ids of existing units)

interface syncFunctionReturn<T, U> {
    // Which objects should be synced,
    // first is from `current`
    // last is from `syncFrom`
    sync: [T, U][];
    //  current to remove
    remove: T[];
    // Objects in the client's state that shouldn't be
    // cleaned up but should be sent to the server.
    // This is used, for example, when the server somehow
    // doesn't have a reference to the player unit
    // and we don't want to delete the player unit on the client
    skippedRemoval: T[];
    // Objects of syncFrom to create new
    create: U[];

}
// Identity match determines if the units are the same entity (and then it's okay to sync from syncFrom to current for that entity)
export function getSyncActions<T, U>(
    current: T[],
    syncFrom: U[],
    findMatch: (a: T, potentialMatches: U[]) => U | undefined,
    doNotRemove: (a: T) => boolean): syncFunctionReturn<T, U> {
    const ret: syncFunctionReturn<T, U> = {
        sync: [],
        remove: [],
        skippedRemoval: [],
        create: []
    }
    const matches: U[] = []
    for (let e of current) {
        const match = findMatch(e, syncFrom);
        if (match) {
            // Keep track of what synced so we can create the extras in syncFrom as new
            matches.push(match);
            ret.sync.push([e, match]);
        } else {
            if (doNotRemove(e)) {
                ret.skippedRemoval.push(e);
            } else {
                ret.remove.push(e);
            }
        }
    }
    const toBeCreated = syncFrom.filter(x => !matches.includes(x));
    for (let e of toBeCreated) {
        ret.create.push(e);
    }
    return ret;

}