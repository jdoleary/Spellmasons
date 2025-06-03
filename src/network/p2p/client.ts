
const handlers: { onData: (data: any, socket: WebSocket) => void, onError: (data: any, socket: WebSocket) => void } = {
    onData: () => console.error('No onData handler set up'),
    onError: () => console.error('No onError handler set up')
};
// This function is exposed for the consumer of this library
// to initiate a join request to a host for a p2p connection
// export async function join({ toName, fromName, fromClientId, websocketHubUrl, onError, onData, onPeerDisconnected }: { toName: string, fromName: string, fromClientId: string, websocketHubUrl: string, onError: (error: any) => void, onData: (data: any) => void, onPeerDisconnected: (p: SteamPeer) => void }): Promise<{ peer: SteamPeer, name: string }> {
//     console.log('P2P join:', ...arguments);
//     // Note: it is up to the caller to
// }
